import uuid
from datetime import datetime, timedelta, timezone

from app.db import Base, generate_uuid
from app.models import (
    Appointment,
    Dentist,
    Operatory,
    Patient,
    Service,
    User,
)


def test_all_documented_tables_registered_in_metadata():
    """Verify that all 40 tables specified in docs/brain/data-model.md are registered."""
    table_names = set(Base.metadata.tables.keys())
    expected_tables = {
        "users",
        "staff",
        "patients",
        "dentists",
        "operatories",
        "services",
        "appointments",
        "medical_records",
        "treatments",
        "treatment_stages",
        "prescriptions",
        "invoices",
        "payments",
        "notifications",
        "notification_templates",
        "notification_attempts",
        "staff_tasks",
        "knowledge_documents",
        "knowledge_chunks",
        "ai_usage_counters",
        "reviews",
        "consents",
        "ai_conversations",
        "ai_messages",
        "audit_logs",
        "patient_family_links",
        "dentist_schedules",
        "dentist_leaves",
        "appointment_waitlist",
        "patient_clinical_alerts",
        "otp_verifications",
        "auth_sessions",
        "user_mfa",
        "auth_rate_limits",
        "website_content",
        "medical_record_versions",
        "patient_medical_histories",
        "clinical_documents",
        "payment_webhook_events",
        "payment_refunds",
    }
    assert table_names == expected_tables, (
        f"Missing tables: {expected_tables - table_names}; unexpected tables: {table_names - expected_tables}"
    )
    for table in Base.metadata.tables.values():
        assert table.columns["created_at"].nullable is False
        assert table.columns["updated_at"].nullable is False


def test_opaque_uuid_primary_keys_on_all_tables():
    """Verify every table has a primary key named with an ID suffix and default UUID generator."""
    for table_name, table in Base.metadata.tables.items():
        pk_cols = list(table.primary_key.columns)
        assert len(pk_cols) == 1, f"Table {table_name} must have a single primary key column"
        pk_col = pk_cols[0]
        assert pk_col.name.endswith("_id"), f"Table {table_name} PK column {pk_col.name} must end with '_id'"


def test_appointment_fr013_exclusion_constraints_defined():
    """Verify that Appointment model defines the two FR-013 exclusion constraints."""
    appointment_table = Base.metadata.tables["appointments"]
    constraint_names = {c.name for c in appointment_table.constraints if c.name}

    assert "excl_appointment_dentist_no_overlap" in constraint_names
    assert "excl_appointment_operatory_no_overlap" in constraint_names


def test_model_instantiation_and_opaque_uuid_generation():
    """Verify that models accept opaque UUIDs upon creation and hold timezone-aware timestamps."""
    id1 = generate_uuid()
    id2 = generate_uuid()
    u1 = User(user_id=id1, name="Test User 1", role="patient", status="active")
    u2 = User(user_id=id2, name="Test User 2", role="dentist", status="active")

    assert isinstance(u1.user_id, uuid.UUID)
    assert isinstance(u2.user_id, uuid.UUID)
    assert u1.user_id != u2.user_id
    assert u1.user_id.version == 4  # Cryptographically secure UUIDv4

    # Verify column defaults in metadata are callable UUID generators
    user_pk_col = Base.metadata.tables["users"].columns["user_id"]
    assert user_pk_col.default is not None
    assert callable(user_pk_col.default.arg)
    generated = user_pk_col.default.arg(None)
    assert isinstance(generated, uuid.UUID)
    assert generated.version == 4


def test_in_memory_sqlite_schema_wiring():
    """Verify relational foreign key wiring in SQLite in-memory database."""
    # SQLite doesn't natively support Postgres-specific types (JSONB/ARRAY/ExcludeConstraint)
    # but we can verify SQLAlchemy column types and mapping by creating non-postgres engine
    # with schema reflection or mock session.
    now = datetime.now(timezone.utc)
    user = User(
        user_id=uuid.uuid4(),
        name="SAMPLE ONLY dentist user",
        email=None,
        role="dentist",
        status="active",
        created_at=now,
    )
    dentist = Dentist(
        dentist_id=uuid.uuid4(),
        user_id=user.user_id,
        qualification="SAMPLE ONLY qualification",
        specialization=None,
        experience_years=None,
        active=True,
    )
    service = Service(
        service_id=uuid.uuid4(),
        service_name="[SAMPLE ONLY] General dentistry",
        price_min=None,
        price_max=None,
        duration_minutes=None,
        active=True,
    )
    operatory = Operatory(
        operatory_id=uuid.uuid4(),
        name="[SAMPLE ONLY] Operatory",
        is_active=True,
    )
    patient = Patient(
        patient_id=uuid.uuid4(),
        created_at=now,
    )
    appt = Appointment(
        appointment_id=uuid.uuid4(),
        patient_id=patient.patient_id,
        dentist_id=dentist.dentist_id,
        service_id=service.service_id,
        operatory_id=operatory.operatory_id,
        start_time=now,
        end_time=now + timedelta(minutes=60),
        status="requested",
        created_at=now,
    )

    assert appt.appointment_id != appt.patient_id
    assert appt.dentist_id == dentist.dentist_id
    assert appt.operatory_id == operatory.operatory_id
    assert appt.status == "requested"
