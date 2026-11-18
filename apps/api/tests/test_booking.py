import uuid

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app


@pytest.fixture(autouse=True)
def clean_db():
    db = next(get_db())
    try:
        from app.models.appointments import Appointment
        from app.models.financial import Invoice, Payment
        from app.models.auth import AuthSession
        from sqlalchemy import delete
        db.execute(delete(Appointment))
        db.execute(delete(Invoice))
        db.execute(delete(Payment))
        db.execute(delete(AuthSession))
        db.commit()
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app, base_url="https://localhost:3000")


def test_services_list(client: TestClient):
    response = client.get("/api/v1/services")
    assert response.status_code == 200
    services = response.json()
    assert isinstance(services, list)
    assert len(services) > 0
    assert "service_id" in services[0]
    assert "service_name" in services[0]
    assert "duration_minutes" in services[0]


def test_dentists_list(client: TestClient):
    response = client.get("/api/v1/dentists")
    assert response.status_code == 200
    dentists = response.json()
    assert isinstance(dentists, list)
    assert len(dentists) > 0
    assert "dentist_id" in dentists[0]
    assert "name" in dentists[0]
    assert "specialization" in dentists[0]


def test_availability_slots(client: TestClient):
    services_res = client.get("/api/v1/services")
    service_id = services_res.json()[0]["service_id"]

    response = client.get(f"/api/v1/availability?service_id={service_id}&date=2026-11-20")
    assert response.status_code == 200
    slots = response.json()
    assert isinstance(slots, list)
    assert len(slots) > 0
    assert "slot_id" in slots[0]
    assert "start_time" in slots[0]
    assert "available" in slots[0]


def test_booking_workflow_and_cancellation(client: TestClient):
    services_res = client.get("/api/v1/services")
    service = services_res.json()[0]
    dentists_res = client.get("/api/v1/dentists")
    dentist = dentists_res.json()[0]

    unique_suffix = uuid.uuid4().hex[:6]
    # 1. Book appointment
    start_time = "2026-12-15T10:00:00+00:00"
    booking_payload = {
        "service_id": service["service_id"],
        "dentist_id": dentist["dentist_id"],
        "start_time": start_time,
        "patient_name": f"Test Patient {unique_suffix}",
        "phone": f"+9198{secrets_rand()}",
        "email": f"test.{unique_suffix}@example.com",
        "notes": "Routine dental checkup",
    }
    create_res = client.post("/api/v1/appointments", json=booking_payload)
    assert create_res.status_code == 201
    created_appt = create_res.json()
    appt_id = created_appt["appointment_id"]
    assert created_appt["status"] == "confirmed"
    assert created_appt["dentist_name"] == dentist["name"]
    assert created_appt["service_name"] == service["service_name"]

    # 2. FR-013 Double booking prevention test: overlapping time slot for same dentist
    conflict_res = client.post("/api/v1/appointments", json=booking_payload)
    assert conflict_res.status_code == 409
    assert conflict_res.json()["detail"] == "TIME_SLOT_CONFLICT"

    # 3. Retrieve appointments as authenticated patient (cookie is preserved on client)
    list_res = client.get("/api/v1/appointments")
    assert list_res.status_code == 200
    appts = list_res.json()
    assert any(a["appointment_id"] == appt_id for a in appts)

    # 4. Cancel appointment
    cancel_res = client.post(f"/api/v1/appointments/{appt_id}/cancel", json={
        "cancellation_reason": "Schedule conflict"
    })
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # 5. After cancellation, slot is free again (conflict constraint no longer blocks)
    new_res = client.post("/api/v1/appointments", json=booking_payload)
    assert new_res.status_code == 201


def test_patient_portal_endpoints(client: TestClient):
    services_res = client.get("/api/v1/services")
    service = services_res.json()[1]
    dentists_res = client.get("/api/v1/dentists")
    dentist = dentists_res.json()[1]

    unique_suffix = uuid.uuid4().hex[:6]
    booking_payload = {
        "service_id": service["service_id"],
        "dentist_id": dentist["dentist_id"],
        "start_time": "2026-12-16T14:00:00+00:00",
        "patient_name": f"Portal Patient {unique_suffix}",
        "phone": f"+9197{secrets_rand()}",
        "email": f"portal.{unique_suffix}@example.com",
    }
    client.post("/api/v1/appointments", json=booking_payload)

    # 1. Profile
    profile_res = client.get("/api/v1/patients/me")
    assert profile_res.status_code == 200
    assert profile_res.json()["name"] == f"Portal Patient {unique_suffix}"

    # Update profile
    patch_profile = client.patch("/api/v1/patients/me", json={
        "name": f"Portal Updated {unique_suffix}",
        "date_of_birth": "1992-05-15",
        "address": {"city": "Mumbai", "postal_code": "400001"}
    })
    assert patch_profile.status_code == 200
    assert patch_profile.json()["name"] == f"Portal Updated {unique_suffix}"
    assert patch_profile.json()["date_of_birth"] == "1992-05-15"

    # 2. Documents
    docs_res = client.get("/api/v1/patients/me/documents")
    assert docs_res.status_code == 200
    assert docs_res.json() == []  # No clinic documents are seeded or fabricated

    # 3. Invoices
    inv_res = client.get("/api/v1/invoices")
    assert inv_res.status_code == 200
    assert inv_res.json() == []  # No invoice records are seeded or fabricated
    assert "invoice_number" in inv_res.json()[0]

    # 4. Payments
    pay_res = client.get("/api/v1/payments")
    assert pay_res.status_code == 200
    assert pay_res.json() == []  # No payment records are seeded or fabricated
    assert "amount" in pay_res.json()[0]


def secrets_rand():
    import random
    return str(random.randint(10000000, 99999999))
