from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_routes import SESSION_COOKIE
from app.auth_security import _totp_at, encrypt_totp_secret, hash_password, new_totp_secret
from app.auth_settings import AuthSettings
from app.models import (
    Appointment,
    AuditLog,
    AuthSession,
    Consent,
    Dentist,
    MedicalRecord,
    Patient,
    Service,
    User,
    UserMFA,
)

ORIGIN = {"Origin": "https://testserver"}


def make_patient(db: Session, suffix: str) -> tuple[User, Patient]:
    user = User(
        name=f"SAMPLE ONLY patient {suffix}",
        email=f"test-patient-{suffix}@example.invalid",
        password_hash=hash_password("test-only-password-123"),
        role="patient",
        status="active",
    )
    patient = Patient(user=user)
    db.add_all([user, patient])
    db.flush()
    return user, patient


def make_staff(db: Session, role: str, suffix: str, *, dentist_profile: bool = False) -> tuple[User, Dentist | None, str]:
    user = User(
        name=f"SAMPLE ONLY {role} {suffix}",
        email=f"test-{role}-{suffix}@example.invalid",
        password_hash=hash_password("test-only-password-123"),
        role=role,
        status="active",
    )
    db.add(user)
    db.flush()
    dentist = Dentist(user=user, qualification="SAMPLE ONLY qualification") if dentist_profile else None
    if dentist:
        db.add(dentist)
    secret = new_totp_secret()
    settings = AuthSettings.from_environment()
    db.add(UserMFA(
        user_id=user.user_id,
        secret_ciphertext=encrypt_totp_secret(settings, secret),
        enabled_at=datetime.now(timezone.utc),
    ))
    db.flush()
    return user, dentist, secret


def test_invalid_credentials_and_otp_do_not_authenticate(auth_app):
    client = auth_app.client
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": "unknown-user@example.invalid", "password": "bad"},
        headers=ORIGIN,
    )
    assert bad_login.status_code == 401
    assert SESSION_COOKIE not in client.cookies

    registration = client.post(
        "/api/v1/auth/register",
        json={
            "name": "SAMPLE ONLY pending patient",
            "email": "test-registration@example.invalid",
            "password": "test-only-password-123",
        },
        headers=ORIGIN,
    )
    assert registration.status_code == 202
    valid_otp = auth_app.provider.codes[("test-registration@example.invalid", "registration")]
    bad_otp = f"{(int(valid_otp) + 1) % 1_000_000:06d}"
    invalid_otp = client.post(
        "/api/v1/auth/otp/verify",
        json={"email_or_phone": "test-registration@example.invalid", "code": bad_otp},
        headers=ORIGIN,
    )
    assert invalid_otp.status_code == 401
    assert SESSION_COOKIE not in client.cookies

    verified = client.post(
        "/api/v1/auth/otp/verify",
        json={"email_or_phone": "test-registration@example.invalid", "code": valid_otp},
        headers=ORIGIN,
    )
    assert verified.status_code == 200
    assert client.cookies.get(SESSION_COOKIE)
    cookie = next(value for value in verified.headers.get_list("set-cookie") if SESSION_COOKIE in value)
    assert "HttpOnly" in cookie and "Secure" in cookie and "SameSite=strict" in cookie


def test_password_recovery_requires_otp_and_revokes_existing_sessions(auth_app):
    with Session(auth_app.engine) as db:
        user, _ = make_patient(db, "recovery")
        db.commit()
        email = user.email
        user_id = user.user_id
    initial = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "test-only-password-123"},
        headers=ORIGIN,
    )
    assert initial.status_code == 200
    requested = auth_app.client.post(
        "/api/v1/auth/password-recovery", json={"email_or_phone": email}, headers=ORIGIN
    )
    assert requested.status_code == 202
    code = auth_app.provider.codes[(email, "password_recovery")]
    bad_code = f"{(int(code) + 1) % 1_000_000:06d}"
    invalid = auth_app.client.post(
        "/api/v1/auth/password-recovery/verify",
        json={"email_or_phone": email, "code": bad_code, "new_password": "test-only-password-456"},
        headers=ORIGIN,
    )
    assert invalid.status_code == 401
    recovered = auth_app.client.post(
        "/api/v1/auth/password-recovery/verify",
        json={"email_or_phone": email, "code": code, "new_password": "test-only-password-456"},
        headers=ORIGIN,
    )
    assert recovered.status_code == 204
    with Session(auth_app.engine) as db:
        assert db.scalar(select(AuthSession).where(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None),
        )) is None
    relogin = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "test-only-password-456"},
        headers=ORIGIN,
    )
    assert relogin.status_code == 200


def test_patient_cannot_read_another_patients_records_and_attempt_is_audited(auth_app):
    with Session(auth_app.engine) as db:
        _, owner = make_patient(db, "owner")
        reader, _ = make_patient(db, "reader")
        _, dentist, _ = make_staff(db, "dentist", "author", dentist_profile=True)
        record = MedicalRecord(patient_id=owner.patient_id, dentist_id=dentist.dentist_id, clinical_notes="SAMPLE ONLY note")
        db.add(record)
        db.commit()
        owner_id = owner.patient_id
        reader_id = reader.patient_id
        reader_email = reader.user.email

    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": reader_email, "password": "test-only-password-123"},
        headers=ORIGIN,
    )
    assert login.status_code == 200
    denied = auth_app.client.get(f"/api/v1/patients/{owner_id}/records")
    assert denied.status_code == 403
    assert auth_app.client.get(f"/api/v1/patients/{reader_id}/records").status_code == 200
    with Session(auth_app.engine) as db:
        assert db.scalar(select(AuditLog).where(
            AuditLog.user_id.is_(None),
            AuditLog.resource_id.is_(None),
            AuditLog.action == "patient_records.read_denied",
        )) is not None


def test_receptionist_cannot_edit_clinical_notes(auth_app):
    with Session(auth_app.engine) as db:
        receptionist, _, secret = make_staff(db, "receptionist", "frontdesk")
        _, patient = make_patient(db, "clinical-target")
        db.commit()
        receptionist_email = receptionist.email
        patient_id = patient.patient_id
        receptionist_id = receptionist.user_id
    code = _totp_at(secret, int(datetime.now(timezone.utc).timestamp() // 30))
    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": receptionist_email, "password": "test-only-password-123", "totp_code": code},
        headers=ORIGIN,
    )
    assert login.status_code == 200
    replayed = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": receptionist_email, "password": "test-only-password-123", "totp_code": code},
        headers=ORIGIN,
    )
    assert replayed.status_code == 401
    denied = auth_app.client.post(
        f"/api/v1/patients/{patient_id}/records",
        json={"clinical_notes": "SAMPLE ONLY unauthorized note"},
        headers={**ORIGIN, "X-CSRF-Token": login.json()["csrf_token"]},
    )
    assert denied.status_code == 403
    with Session(auth_app.engine) as db:
        assert db.scalar(select(AuditLog).where(
            AuditLog.user_id == receptionist_id,
            AuditLog.action == "patient_records.write_denied",
        )) is not None


def test_dentist_can_read_assigned_patient_but_not_unassigned_patient(auth_app):
    with Session(auth_app.engine) as db:
        dentist_user, dentist, secret = make_staff(db, "dentist", "assigned", dentist_profile=True)
        _, assigned = make_patient(db, "assigned")
        _, unassigned = make_patient(db, "unassigned")
        service = Service(service_name="[SAMPLE ONLY] Dental service", active=False)
        db.add(service)
        db.flush()
        starts = datetime.now(timezone.utc) + timedelta(days=2)
        db.add(Appointment(
            patient_id=assigned.patient_id,
            dentist_id=dentist.dentist_id,
            service_id=service.service_id,
            start_time=starts,
            end_time=starts + timedelta(minutes=30),
            status="scheduled",
        ))
        db.add_all([
            MedicalRecord(patient_id=assigned.patient_id, dentist_id=dentist.dentist_id, clinical_notes="SAMPLE ONLY assigned note"),
            MedicalRecord(patient_id=unassigned.patient_id, dentist_id=dentist.dentist_id, clinical_notes="SAMPLE ONLY unassigned note"),
        ])
        db.commit()
        assigned_id = assigned.patient_id
        unassigned_id = unassigned.patient_id
        dentist_email = dentist_user.email

    code = _totp_at(secret, int(datetime.now(timezone.utc).timestamp() // 30))
    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": dentist_email, "password": "test-only-password-123", "totp_code": code},
        headers=ORIGIN,
    )
    assert login.status_code == 200
    allowed = auth_app.client.get(f"/api/v1/patients/{assigned_id}/records")
    assert allowed.status_code == 200 and len(allowed.json()) == 1
    assert auth_app.client.get(f"/api/v1/patients/{unassigned_id}/records").status_code == 403


def test_session_expiry_and_csrf_protection(auth_app):
    with Session(auth_app.engine) as db:
        user, _ = make_patient(db, "expiry")
        db.commit()
        email = user.email
        user_id = user.user_id
    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "test-only-password-123"},
        headers=ORIGIN,
    )
    assert login.status_code == 200
    missing_csrf = auth_app.client.patch(
        "/api/v1/auth/profile", json={"name": "SAMPLE ONLY changed name"}, headers=ORIGIN
    )
    assert missing_csrf.status_code == 403
    changed = auth_app.client.patch(
        "/api/v1/auth/profile",
        json={"name": "SAMPLE ONLY changed name"},
        headers={**ORIGIN, "X-CSRF-Token": login.json()["csrf_token"]},
    )
    assert changed.status_code == 200
    contact = "test-updated-contact@example.invalid"
    requested = auth_app.client.post(
        "/api/v1/auth/profile/contact-verification",
        json={"email_or_phone": contact},
        headers={**ORIGIN, "X-CSRF-Token": login.json()["csrf_token"]},
    )
    assert requested.status_code == 202
    verified_contact = auth_app.client.post(
        "/api/v1/auth/profile/contact-verification/verify",
        json={
            "email_or_phone": contact,
            "code": auth_app.provider.codes[(contact, "contact_change")],
        },
        headers={**ORIGIN, "X-CSRF-Token": login.json()["csrf_token"]},
    )
    assert verified_contact.status_code == 200
    assert verified_contact.json()["email"] == contact
    with Session(auth_app.engine) as db:
        session = db.scalar(select(AuthSession).where(AuthSession.user_id == user_id))
        session.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.commit()
    assert auth_app.client.get("/api/v1/auth/profile").status_code == 401


def test_consent_writes_use_configured_server_policy_version(auth_app, monkeypatch):
    monkeypatch.setenv("CONSENT_POLICY_VERSION", "SAMPLE_ONLY_POLICY")
    with Session(auth_app.engine) as db:
        user, _ = make_patient(db, "consent")
        db.commit()
        email = user.email
    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "test-only-password-123"},
        headers=ORIGIN,
    )
    assert login.status_code == 200
    consent = auth_app.client.put(
        "/api/v1/auth/consents/marketing",
        json={"status": "granted"},
        headers={**ORIGIN, "X-CSRF-Token": login.json()["csrf_token"]},
    )
    assert consent.status_code == 200
    with Session(auth_app.engine) as db:
        stored = db.get(Consent, uuid.UUID(consent.json()["consent_id"]))
        assert stored.policy_version == "SAMPLE_ONLY_POLICY"


def test_login_is_rate_limited(auth_app):
    for attempt in range(5):
        response = auth_app.client.post(
            "/api/v1/auth/login",
            json={"email_or_phone": "rate-test@example.invalid", "password": "wrong"},
            headers=ORIGIN,
        )
        assert response.status_code == 401, attempt
    limited = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": "rate-test@example.invalid", "password": "wrong"},
        headers=ORIGIN,
    )
    assert limited.status_code == 429


def test_staff_mfa_enrollment_requires_totp_and_rotates_to_full_session(auth_app):
    with Session(auth_app.engine) as db:
        staff = User(
            name="SAMPLE ONLY staff awaiting MFA",
            email="test-mfa-enrollment@example.invalid",
            password_hash=hash_password("test-only-password-123"),
            role="receptionist",
            status="active",
        )
        db.add(staff)
        db.commit()
        staff_email = staff.email

    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": staff_email, "password": "test-only-password-123"},
        headers=ORIGIN,
    )
    assert login.status_code == 200
    assert login.json()["mfa_setup_required"] is True
    initial_token = auth_app.client.cookies.get(SESSION_COOKIE)
    csrf_token = login.json()["csrf_token"]
    enrolled = auth_app.client.post(
        "/api/v1/auth/mfa/enroll",
        headers={**ORIGIN, "X-CSRF-Token": csrf_token},
    )
    assert enrolled.status_code == 200
    secret = enrolled.json()["shared_secret"]
    code = _totp_at(secret, int(datetime.now(timezone.utc).timestamp() // 30))
    verified = auth_app.client.post(
        "/api/v1/auth/mfa/verify",
        json={"code": code},
        headers={**ORIGIN, "X-CSRF-Token": csrf_token},
    )
    assert verified.status_code == 200
    assert verified.json()["authenticated"] is True
    assert auth_app.client.cookies.get(SESSION_COOKIE) != initial_token
    assert auth_app.client.get("/api/v1/auth/profile").status_code == 200
