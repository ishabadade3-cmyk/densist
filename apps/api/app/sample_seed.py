"""Opt-in SAMPLE ONLY seed data; never called by migrations or application startup."""

from sqlalchemy.orm import Session

from app.models import Service, User

SAMPLE_ONLY_ROLES = ("patient", "dentist", "receptionist", "clinic_admin", "system_admin")
SAMPLE_ONLY_SERVICES = (
    "[SAMPLE ONLY] General dentistry",
    "[SAMPLE ONLY] Preventive care",
)


def load_sample_seed(session: Session) -> None:
    """Insert clearly labelled, inactive role and service examples for local development."""
    session.add_all(
        User(name=f"SAMPLE ONLY {role} role", role=role, status="suspended")
        for role in SAMPLE_ONLY_ROLES
    )
    session.add_all(
        Service(service_name=name, active=False)
        for name in SAMPLE_ONLY_SERVICES
    )
    session.flush()
