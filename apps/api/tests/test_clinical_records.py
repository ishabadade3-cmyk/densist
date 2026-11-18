from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_security import _totp_at
from app.clinical_storage import ClinicalStorageSettings, sign_download, validate_pdf, verify_download
from app.models import (
    Appointment,
    AuditLog,
    ClinicalDocument,
    MedicalRecord,
    MedicalRecordVersion,
    Service,
)
from test_auth import ORIGIN, make_patient, make_staff


def test_pdf_validation_rejects_wrong_content_active_features_and_oversize():
    valid_pdf = b"%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF"
    assert len(validate_pdf(valid_pdf, 1024)) == 64
    for invalid in (b"not a pdf", b"%PDF-1.4 /JavaScript payload\n%%EOF"):
        with pytest.raises(HTTPException):
            validate_pdf(invalid, 1024)
    with pytest.raises(HTTPException):
        validate_pdf(valid_pdf, 32)


def test_download_signature_is_short_lived_and_document_scoped():
    settings = ClinicalStorageSettings(
        root=Path("private-test-storage"),
        signing_key=b"test-only-signing-key-0123456789",
        max_upload_bytes=1024,
        signed_url_ttl_seconds=60,
        environment="test",
    )
    document_id = uuid.uuid4()
    expiry = 1_800_000_060
    signature = sign_download(document_id, expiry, settings)
    assert verify_download(document_id, expiry, signature, settings, 1_800_000_000)
    assert not verify_download(document_id, expiry, signature, settings, 1_800_000_060)
    assert not verify_download(uuid.uuid4(), expiry, signature, settings, 1_800_000_000)


def _login_patient(auth_app, email: str) -> str:
    response = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "test-only-password-123"},
        headers=ORIGIN,
    )
    assert response.status_code == 200
    return response.json()["csrf_token"]


def test_patient_sees_only_released_documents_and_download_is_resource_scoped(auth_app):
    with Session(auth_app.engine) as db:
        _, patient = make_patient(db, "docs-owner")
        _, other_patient = make_patient(db, "docs-other")
        document = ClinicalDocument(
            patient_id=patient.patient_id,
            uploaded_by_user_id=patient.user_id,
            kind="report",
            title="SAMPLE ONLY report",
            storage_key="a" * 48,
            media_type="application/pdf",
            size_bytes=12,
            sha256="a" * 64,
            release_to_patient=False,
        )
        db.add(document)
        db.commit()
        patient_email = patient.user.email
        document_id = document.document_id
        patient_id = patient.patient_id
        other_id = other_patient.patient_id

    csrf = _login_patient(auth_app, patient_email)
    listed = auth_app.client.get("/api/v1/patients/me/documents")
    assert listed.status_code == 200
    assert listed.json() == []
    settings = ClinicalStorageSettings.from_environment()
    expires = int(datetime.now(timezone.utc).timestamp()) + settings.signed_url_ttl_seconds
    signature = sign_download(document_id, expires, settings)
    own_unreleased = auth_app.client.get(
        f"/api/v1/clinical-documents/{document_id}/download?expires={expires}&signature={signature}"
    )
    assert own_unreleased.status_code == 404
    assert auth_app.client.post("/api/v1/auth/logout", headers={**ORIGIN, "X-CSRF-Token": csrf}).status_code == 204
    _login_patient(auth_app, other_patient_email(auth_app, other_id))
    # The URL signature cannot grant access to a different patient's resource.
    other_download = auth_app.client.get(
        f"/api/v1/clinical-documents/{document_id}/download?expires={expires}&signature={signature}"
    )
    assert other_download.status_code == 404
    assert auth_app.client.get(f"/api/v1/patients/{patient_id}/documents").status_code == 403
    with Session(auth_app.engine) as db:
        assert db.scalar(select(AuditLog).where(AuditLog.action == "clinical_documents.read")) is not None
        assert db.scalar(select(AuditLog).where(AuditLog.action == "clinical_document.download_denied")) is not None


def other_patient_email(auth_app, patient_id: uuid.UUID) -> str:
    from app.models import Patient

    with Session(auth_app.engine) as db:
        patient = db.get(Patient, patient_id)
        assert patient is not None and patient.user is not None
        return patient.user.email


def test_editing_note_creates_version_and_audits_read_write(auth_app):
    with Session(auth_app.engine) as db:
        dentist_user, dentist, secret = make_staff(db, "dentist", "note-version", dentist_profile=True)
        _, patient = make_patient(db, "note-version")
        service = Service(service_name="[SAMPLE ONLY] clinical test service", active=False)
        db.add(service)
        db.flush()
        start = datetime.now(timezone.utc) + timedelta(days=2)
        db.add(Appointment(
            patient_id=patient.patient_id,
            dentist_id=dentist.dentist_id,
            service_id=service.service_id,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            status="confirmed",
        ))
        record = MedicalRecord(
            patient_id=patient.patient_id,
            dentist_id=dentist.dentist_id,
            clinical_notes="SAMPLE ONLY original note",
        )
        db.add(record)
        db.commit()
        dentist_email = dentist_user.email
        patient_id = patient.patient_id
        record_id = record.record_id
        dentist_id = dentist.dentist_id

    now_counter = int(datetime.now(timezone.utc).timestamp() // 30)
    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={
            "email_or_phone": dentist_email,
            "password": "test-only-password-123",
            "totp_code": _totp_at(secret, now_counter),
        },
        headers=ORIGIN,
    )
    assert login.status_code == 200
    changed = auth_app.client.patch(
        f"/api/v1/patients/{patient_id}/records/{record_id}",
        json={"clinical_notes": "SAMPLE ONLY revised note"},
        headers={**ORIGIN, "X-CSRF-Token": login.json()["csrf_token"]},
    )
    assert changed.status_code == 200
    assert changed.json()["version"] == 2
    history = auth_app.client.get(f"/api/v1/patients/{patient_id}/records/{record_id}/versions")
    assert history.status_code == 200
    assert [version["clinical_notes"] for version in history.json()] == [
        "SAMPLE ONLY original note",
        "SAMPLE ONLY revised note",
    ]
    with Session(auth_app.engine) as db:
        versions = db.scalars(
            select(MedicalRecordVersion).where(MedicalRecordVersion.record_id == record_id)
        ).all()
        assert len(versions) == 2
        assert all(version.changed_by_dentist_id == dentist_id for version in versions)
        actions = set(db.scalars(select(AuditLog.action).where(AuditLog.user_id == dentist_user_id(dentist_email, db))))
        assert {"patient_records.update", "patient_records.versions.read"} <= actions


def dentist_user_id(email: str, db: Session) -> uuid.UUID:
    from app.models import User

    user = db.scalar(select(User).where(User.email == email))
    assert user is not None
    return user.user_id
