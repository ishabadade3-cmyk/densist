"""Add versioned clinical notes, structured history, and private document metadata.

Revision ID: 0005_clinical_records
Revises: 0004_staff_content
Requirement IDs: FR-021, FR-023, FR-024, FR-025, FR-026, FR-027, FR-031, FR-032
"""
from collections.abc import Sequence

from alembic import op

from app.models import ClinicalDocument, MedicalRecordVersion, PatientMedicalHistory

revision: str = "0005_clinical_records"
down_revision: str | None = "0004_staff_content"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLES = (PatientMedicalHistory.__table__, MedicalRecordVersion.__table__, ClinicalDocument.__table__)


def upgrade() -> None:
    for table in TABLES:
        table.create(bind=op.get_bind(), checkfirst=False)
        op.execute(
            f'CREATE TRIGGER "trg_{table.name}_updated_at" '
            f'BEFORE UPDATE ON "{table.name}" '
            'FOR EACH ROW EXECUTE FUNCTION set_updated_at_utc()'
        )


def downgrade() -> None:
    for table in reversed(TABLES):
        op.execute(f'DROP TRIGGER IF EXISTS "trg_{table.name}_updated_at" ON "{table.name}"')
        table.drop(bind=op.get_bind(), checkfirst=False)
