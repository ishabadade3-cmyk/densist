"""Add server-side session, MFA-secret, and auth throttling storage.

Revision ID: 0003_auth_rbac
Revises: 0002_core_schema
Requirement IDs: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-003
"""
from collections.abc import Sequence

from alembic import op
from sqlalchemy import MetaData

from app.models import Base

revision: str = "0003_auth_rbac"
down_revision: str | None = "0002_core_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

AUTH_TABLES = ("auth_sessions", "user_mfa", "auth_rate_limits")
CORE_TABLES = (
    "users", "staff", "patients", "dentists", "operatories", "services", "appointments",
    "medical_records", "treatments", "treatment_stages", "prescriptions", "invoices", "payments",
    "notifications", "reviews", "consents", "ai_conversations", "ai_messages", "audit_logs",
    "patient_family_links", "dentist_schedules", "dentist_leaves", "appointment_waitlist",
    "patient_clinical_alerts", "otp_verifications",
)


def _auth_metadata() -> MetaData:
    metadata = MetaData(naming_convention=Base.metadata.naming_convention)
    Base.metadata.tables["users"].to_metadata(metadata)
    for name in AUTH_TABLES:
        Base.metadata.tables[name].to_metadata(metadata)
    return metadata


def upgrade() -> None:
    # Complete the additive timestamp policy for databases that already ran the original 0002.
    for table_name in CORE_TABLES:
        op.execute(
            f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS '
            'created_at timestamptz NOT NULL DEFAULT now()'
        )
        op.execute(
            f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS '
            'updated_at timestamptz NOT NULL DEFAULT now()'
        )
        op.execute(f'ALTER TABLE "{table_name}" ALTER COLUMN created_at SET DEFAULT now()')
        op.execute(f'ALTER TABLE "{table_name}" ALTER COLUMN updated_at SET DEFAULT now()')

    metadata = _auth_metadata()
    metadata.create_all(bind=op.get_bind(), tables=[metadata.tables[name] for name in AUTH_TABLES], checkfirst=False)
    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at_utc() RETURNS trigger AS $$
        BEGIN
            NEW.updated_at = clock_timestamp();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    for table_name in (*CORE_TABLES, *AUTH_TABLES):
        op.execute(f'DROP TRIGGER IF EXISTS "trg_{table_name}_updated_at" ON "{table_name}"')
        op.execute(
            f'CREATE TRIGGER "trg_{table_name}_updated_at" '
            f'BEFORE UPDATE ON "{table_name}" '
            'FOR EACH ROW EXECUTE FUNCTION set_updated_at_utc()'
        )


def downgrade() -> None:
    metadata = _auth_metadata()
    for table_name in reversed(AUTH_TABLES):
        op.execute(f'DROP TRIGGER IF EXISTS "trg_{table_name}_updated_at" ON "{table_name}"')
    metadata.drop_all(bind=op.get_bind(), tables=[metadata.tables[name] for name in reversed(AUTH_TABLES)], checkfirst=False)
