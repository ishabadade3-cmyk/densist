from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth_security import _totp_at, encrypt_totp_secret, hash_password, new_totp_secret
from app.auth_settings import AuthSettings
from app.models import Appointment, Dentist, MedicalRecord, Patient, Service, User, UserMFA

ORIGIN = {"Origin": "https://testserver"}


def staff_user(db: Session, role: str, suffix: str, dentist_profile: bool = False):
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
    db.add(UserMFA(
        user_id=user.user_id,
        secret_ciphertext=encrypt_totp_secret(AuthSettings.from_environment(), secret),
        enabled_at=datetime.now(timezone.utc),
    ))
    db.flush()
    return user, dentist, secret


def login_staff(auth_app, email: str, secret: str) -> str:
    token = _totp_at(secret, int(datetime.now(timezone.utc).timestamp() // 30))
    response = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "test-only-password-123", "totp_code": token},
        headers=ORIGIN,
    )
    assert response.status_code == 200
    return response.json()["csrf_token"]


def test_receptionist_calendar_contains_no_clinical_notes_and_cannot_read_records(auth_app):
    with Session(auth_app.engine) as db:
        receptionist, _, secret = staff_user(db, "receptionist", "calendar")
        patient_user = User(name="SAMPLE ONLY patient", role="patient", status="active")
        patient = Patient(user=patient_user)
        dentist_user = User(name="SAMPLE ONLY dentist", role="dentist", status="active")
        dentist = Dentist(user=dentist_user, qualification="SAMPLE ONLY qualification")
        service = Service(service_name="[SAMPLE ONLY] service", active=False)
        db.add_all([patient_user, patient, dentist_user, dentist, service])
        db.flush()
        start = datetime.now(timezone.utc) + timedelta(days=1)
        appt = Appointment(
            patient_id=patient.patient_id,
            dentist_id=dentist.dentist_id,
            service_id=service.service_id,
            start_time=start,
            end_time=start + timedelta(minutes=30),
            status="confirmed",
        )
        note = MedicalRecord(patient_id=patient.patient_id, dentist_id=dentist.dentist_id, clinical_notes="SAMPLE ONLY SECRET NOTE")
        db.add_all([appt, note])
        db.commit()
        email = receptionist.email
        patient_id = patient.patient_id

    csrf = login_staff(auth_app, email, secret)
    response = auth_app.client.get("/api/v1/appointments")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert "clinical_notes" not in response.text and "SAMPLE ONLY SECRET NOTE" not in response.text
    assert auth_app.client.get(f"/api/v1/patients/{patient_id}/records").status_code == 403

    created = auth_app.client.post(
        "/api/v1/patients",
        json={"name": "SAMPLE ONLY walk-in", "phone": "0000000000"},
        headers={**ORIGIN, "X-CSRF-Token": csrf},
    )
    assert created.status_code == 201
    assert created.json()["status"] == "pending"


def test_dentist_calendar_and_details_are_assigned_only(auth_app):
    with Session(auth_app.engine) as db:
        _, dentist, secret = staff_user(db, "dentist", "scope", dentist_profile=True)
        _, other_dentist, _ = staff_user(db, "dentist", "other-scope", dentist_profile=True)
        patients = [Patient() for _ in range(2)]
        other_patient = Patient()
        service = Service(service_name="[SAMPLE ONLY] scope service", active=False)
        db.add_all([*patients, other_patient, service])
        db.flush()
        start = datetime.now(timezone.utc) + timedelta(days=2)
        records = [
            Appointment(patient_id=patients[0].patient_id, dentist_id=dentist.dentist_id, service_id=service.service_id,
                        start_time=start, end_time=start + timedelta(minutes=30), status="confirmed"),
            Appointment(patient_id=patients[1].patient_id, dentist_id=dentist.dentist_id, service_id=service.service_id,
                        start_time=start + timedelta(hours=1), end_time=start + timedelta(hours=1, minutes=30), status="confirmed"),
        ]
        hidden = Appointment(
            patient_id=other_patient.patient_id,
            dentist_id=other_dentist.dentist_id,
            service_id=service.service_id,
            start_time=start + timedelta(hours=2),
            end_time=start + timedelta(hours=2, minutes=30),
            status="confirmed",
        )
        db.add_all([*records, hidden])
        db.commit()
        email = dentist.user.email
        visible_id = records[0].appointment_id
        hidden_id = hidden.appointment_id

    login_staff(auth_app, email, secret)
    response = auth_app.client.get("/api/v1/appointments")
    assert response.status_code == 200 and len(response.json()) == 2
    assert str(hidden_id) not in {item["appointment_id"] for item in response.json()}
    assert auth_app.client.get(f"/api/v1/appointments/{visible_id}").status_code == 200
    assert auth_app.client.get(f"/api/v1/appointments/{hidden_id}").status_code == 403


def test_only_clinic_admin_can_access_aggregate_reports_services_and_content(auth_app):
    with Session(auth_app.engine) as db:
        receptionist, _, receptionist_secret = staff_user(db, "receptionist", "admin-forbidden")
        admin, _, admin_secret = staff_user(db, "clinic_admin", "admin-allowed")
        db.commit()

    login_staff(auth_app, receptionist.email, receptionist_secret)
    url = "/api/v1/admin/reports?date_from=2026-01-01&date_to=2026-01-31&aggregate_by=day"
    assert auth_app.client.get(url).status_code == 403
    assert auth_app.client.get("/api/v1/admin/services").status_code == 403

    auth_app.client.post("/api/v1/auth/logout", headers={**ORIGIN, "X-CSRF-Token": "invalid"})
    auth_app.client.cookies.clear()
    csrf = login_staff(auth_app, admin.email, admin_secret)
    headers = {**ORIGIN, "X-CSRF-Token": csrf}
    reports = auth_app.client.get(url)
    assert reports.status_code == 200
    assert "patient_id" not in reports.text and "appointment_id" not in reports.text
    service = auth_app.client.post(
        "/api/v1/admin/services",
        json={"service_name": "[SAMPLE ONLY] admin service", "duration_minutes": 30, "active": False},
        headers=headers,
    )
    assert service.status_code == 201
    content = auth_app.client.post(
        "/api/v1/admin/content",
        json={"slug": "sample-draft", "title": "SAMPLE ONLY title", "body": "SAMPLE ONLY body"},
        headers=headers,
    )
    assert content.status_code == 201 and content.json()["status"] == "draft"


def test_invalid_appointment_transitions_are_rejected(auth_app):
    with Session(auth_app.engine) as db:
        receptionist, _, secret = staff_user(db, "receptionist", "state")
        patient = Patient()
        dentist_user = User(name="SAMPLE ONLY dentist", role="dentist", status="active")
        dentist = Dentist(user=dentist_user, qualification="SAMPLE ONLY qualification")
        service = Service(service_name="[SAMPLE ONLY] state service", active=False)
        db.add_all([patient, dentist_user, dentist, service])
        db.flush()
        appt = Appointment(
            patient_id=patient.patient_id,
            dentist_id=dentist.dentist_id,
            service_id=service.service_id,
            start_time=datetime.now(timezone.utc) + timedelta(days=1),
            end_time=datetime.now(timezone.utc) + timedelta(days=1, minutes=30),
            status="completed",
        )
        db.add(appt)
        db.commit()
        appt_id, email = appt.appointment_id, receptionist.email

    csrf = login_staff(auth_app, email, secret)
    response = auth_app.client.patch(
        f"/api/v1/appointments/{appt_id}",
        json={"status": "confirmed"},
        headers={**ORIGIN, "X-CSRF-Token": csrf},
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "INVALID_STATUS_TRANSITION"
