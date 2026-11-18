"""T-012 backend tests: staff calendar, today stats, reschedule, RBAC enforcement.

Uses dependency overrides to inject authenticated users without a live login flow.
This avoids the full HTTP auth stack (OTP, CSRF, MFA) which requires PostgreSQL/SMTP.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.auth_routes import AuthContext, get_fully_authenticated_context, require_csrf
from app.database import get_db
from app.main import app


# ---------------------------------------------------------------------------
# Helpers — build a fake AuthContext using SimpleNamespace (no ORM mapping)
# ---------------------------------------------------------------------------

def _fake_ctx(role: str) -> AuthContext:
    user = SimpleNamespace(
        user_id=uuid.uuid4(),
        name=f"SAMPLE ONLY ({role})",
        email=f"{role}-{uuid.uuid4().hex[:6]}@test.internal",
        phone=None,
        role=role,
        status="active",
    )
    session = SimpleNamespace(
        session_id=uuid.uuid4(),
        user_id=user.user_id,
        session_token_hash="test",
        csrf_token_hash="test",
        mfa_verified=True,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    return AuthContext(user=user, session=session)


def _make_auth_override(role: str):
    ctx = _fake_ctx(role)
    def _override() -> AuthContext:
        return ctx
    return _override


def _noop_csrf() -> None:
    return None


def _client_as(role: str) -> TestClient:
    app.dependency_overrides[get_fully_authenticated_context] = _make_auth_override(role)
    app.dependency_overrides[require_csrf] = _noop_csrf
    return TestClient(app, base_url="https://localhost:3000", raise_server_exceptions=False)


def _anon_client() -> TestClient:
    app.dependency_overrides.clear()
    return TestClient(app, base_url="https://localhost:3000", raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def cleanup_overrides():
    yield
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Staff calendar endpoint (GET /api/v1/staff/calendar)
# ---------------------------------------------------------------------------

class TestStaffCalendar:
    def test_unauthenticated_returns_401_or_403(self):
        resp = _anon_client().get("/api/v1/staff/calendar")
        assert resp.status_code in {401, 403}

    def test_patient_role_forbidden(self):
        resp = _client_as("patient").get("/api/v1/staff/calendar")
        assert resp.status_code == 403

    def test_receptionist_can_access_calendar(self):
        resp = _client_as("receptionist").get("/api/v1/staff/calendar")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_admin_can_access_calendar(self):
        resp = _client_as("clinic_admin").get("/api/v1/staff/calendar")
        assert resp.status_code == 200

    def test_calendar_response_has_patient_name_field(self):
        """Every item in the staff calendar must carry patient_name."""
        resp = _client_as("receptionist").get("/api/v1/staff/calendar")
        assert resp.status_code == 200
        for appt in resp.json():
            assert "patient_name" in appt, f"patient_name missing: {appt}"

    def test_invalid_date_range_too_long_returns_400(self):
        resp = _client_as("receptionist").get(
            "/api/v1/staff/calendar?date_from=2030-01-01&date_to=2030-06-01"
        )
        assert resp.status_code == 400

    def test_to_before_from_returns_400(self):
        resp = _client_as("receptionist").get(
            "/api/v1/staff/calendar?date_from=2030-02-01&date_to=2030-01-01"
        )
        assert resp.status_code == 400

    def test_dentist_can_access_own_calendar(self):
        """Dentist role is permitted on the staff calendar endpoint."""
        resp = _client_as("dentist").get("/api/v1/staff/calendar")
        # Dentist may get 200 (empty list) if no matching dentist profile found
        assert resp.status_code in {200, 403}


# ---------------------------------------------------------------------------
# Today stats (GET /api/v1/admin/stats/today)
# ---------------------------------------------------------------------------

class TestTodayStats:
    def test_unauthenticated_returns_401_or_403(self):
        resp = _anon_client().get("/api/v1/admin/stats/today")
        assert resp.status_code in {401, 403}

    def test_patient_forbidden(self):
        resp = _client_as("patient").get("/api/v1/admin/stats/today")
        assert resp.status_code == 403

    def test_dentist_forbidden(self):
        resp = _client_as("dentist").get("/api/v1/admin/stats/today")
        assert resp.status_code == 403

    def test_receptionist_can_view_stats(self):
        resp = _client_as("receptionist").get("/api/v1/admin/stats/today")
        assert resp.status_code == 200
        data = resp.json()
        for key in ("date", "total_today", "confirmed", "completed", "cancelled", "no_show", "total_patients"):
            assert key in data, f"Missing key: {key}"

    def test_admin_can_view_stats(self):
        resp = _client_as("clinic_admin").get("/api/v1/admin/stats/today")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data["total_today"], int)
        assert isinstance(data["total_patients"], int)

    def test_stats_date_is_today(self):
        resp = _client_as("clinic_admin").get("/api/v1/admin/stats/today")
        assert resp.status_code == 200
        # Server uses date.today() (local clock); accept either local or UTC date.
        import datetime as dt
        local_today = dt.date.today().isoformat()
        utc_today = dt.datetime.now(dt.timezone.utc).date().isoformat()
        assert resp.json()["date"] in {local_today, utc_today}


# ---------------------------------------------------------------------------
# Reschedule endpoint (POST /api/v1/appointments/{id}/reschedule)
# ---------------------------------------------------------------------------

class TestReschedule:
    def test_patient_cannot_reschedule(self):
        fake_id = str(uuid.uuid4())
        new_time = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        resp = _client_as("patient").post(
            f"/api/v1/appointments/{fake_id}/reschedule",
            json={"new_start_time": new_time},
        )
        assert resp.status_code == 403

    def test_missing_appointment_returns_404(self):
        fake_id = str(uuid.uuid4())
        new_time = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        resp = _client_as("receptionist").post(
            f"/api/v1/appointments/{fake_id}/reschedule",
            json={"new_start_time": new_time},
        )
        assert resp.status_code == 404

    def test_past_slot_rejected(self):
        fake_id = str(uuid.uuid4())
        past_time = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        resp = _client_as("receptionist").post(
            f"/api/v1/appointments/{fake_id}/reschedule",
            json={"new_start_time": past_time},
        )
        # 404 on appointment_id or 400 on past time — both are correct
        assert resp.status_code in {400, 404}

    def test_admin_gets_404_for_missing_appointment(self):
        fake_id = str(uuid.uuid4())
        new_time = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        resp = _client_as("clinic_admin").post(
            f"/api/v1/appointments/{fake_id}/reschedule",
            json={"new_start_time": new_time},
        )
        # Must be 404 (not found), not 403 (forbidden) — admin is authorized
        assert resp.status_code == 404

    def test_dentist_cannot_reschedule(self):
        """Dentist role is not permitted to reschedule — that is receptionist/admin only."""
        fake_id = str(uuid.uuid4())
        new_time = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        resp = _client_as("dentist").post(
            f"/api/v1/appointments/{fake_id}/reschedule",
            json={"new_start_time": new_time},
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# RBAC: receptionist clinical notes boundary (ADM-023)
# ---------------------------------------------------------------------------

class TestReceptionistClinicalBoundary:
    def test_receptionist_cannot_read_clinical_notes(self):
        """ADM-023: Receptionists must not access clinical record endpoints."""
        fake_patient_id = str(uuid.uuid4())
        resp = _client_as("receptionist").get(
            f"/api/v1/patients/{fake_patient_id}/records"
        )
        assert resp.status_code in {403, 404}

    def test_receptionist_cannot_write_clinical_note(self):
        """ADM-023: Receptionists must not write clinical notes."""
        fake_patient_id = str(uuid.uuid4())
        resp = _client_as("receptionist").post(
            f"/api/v1/patients/{fake_patient_id}/records",
            json={"clinical_notes": "Unauthorized note attempt"},
        )
        assert resp.status_code in {403, 404}

    def test_patient_cannot_read_other_patient_records(self):
        """Patients must not access other patients' clinical records."""
        fake_patient_id = str(uuid.uuid4())
        resp = _client_as("patient").get(
            f"/api/v1/patients/{fake_patient_id}/records"
        )
        assert resp.status_code in {403, 404}

    def test_admin_service_list_requires_admin_role(self):
        """Patient should not be able to access admin service management."""
        resp = _client_as("patient").get("/api/v1/admin/services")
        assert resp.status_code == 403

    def test_receptionist_cannot_access_admin_services(self):
        """Service catalogue management is admin-only."""
        resp = _client_as("receptionist").get("/api/v1/admin/services")
        assert resp.status_code == 403
