"""Create the documented core schema and UTC update triggers.

Revision ID: 0002_core_schema
Revises: 0001_empty
Requirement IDs: FR-013, FR-021, FR-029, FR-034, NFR-003, NFR-013
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy import CheckConstraint, MetaData

from app.models import Base

revision: str = "0002_core_schema"
down_revision: str | None = "0001_empty"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")
    bind = op.get_bind()
    metadata = _core_metadata()
    metadata.create_all(bind=bind, checkfirst=False)
    op.execute("""
        CREATE FUNCTION set_updated_at_utc() RETURNS trigger AS $$
        BEGIN
            NEW.updated_at = clock_timestamp();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    for table_name in metadata.tables:
        op.execute(sa.text(
            f'CREATE TRIGGER "trg_{table_name}_updated_at" '
            f'BEFORE UPDATE ON "{table_name}" '
            'FOR EACH ROW EXECUTE FUNCTION set_updated_at_utc()'
        ))


def downgrade() -> None:
    metadata = _core_metadata()
    for table_name in reversed(list(metadata.tables)):
        op.execute(sa.text(f'DROP TRIGGER IF EXISTS "trg_{table_name}_updated_at" ON "{table_name}"'))
    op.execute("DROP FUNCTION IF EXISTS set_updated_at_utc()")
    metadata.drop_all(bind=op.get_bind(), checkfirst=False)
    op.execute("DROP EXTENSION IF EXISTS citext")
    op.execute("DROP EXTENSION IF EXISTS btree_gist")


def _copy_table(table: sa.Table, metadata: MetaData, include_columns: set[str] | None = None) -> sa.Table:
    cols = [col._copy(schema=table.schema, _to_metadata=metadata) for col in table.columns if include_columns is None or col.name in include_columns]
    new_table = sa.Table(table.name, metadata, schema=table.schema, comment=table.comment, *cols, **table.kwargs)
    for const in table.constraints:
        if const is table.primary_key:
            continue
        if include_columns is not None and any(getattr(c, "name", None) not in include_columns for c in const.columns):
            continue
        new_table.append_constraint(const._copy(schema=table.schema, target_table=new_table))
    for idx in table.indexes:
        if idx._column_flag:
            continue
        if include_columns is not None and any(getattr(c, "name", None) not in include_columns for c in idx.columns):
            continue
        sa.Index(idx.name, unique=idx.unique, *[c for c in new_table.columns if c.name in {getattr(col, "name", None) for col in idx.columns}], _table=new_table, **idx.kwargs)
    return new_table


def _core_metadata() -> MetaData:
    """Keep the original 25-table revision immutable as auth evolves in later revisions."""
    metadata = MetaData(naming_convention=Base.metadata.naming_convention)
    for name, table in Base.metadata.tables.items():
        if name == "payments":
            # Keep the original payment table shape; revision 0006 owns payment evolution.
            copied = _copy_table(table, metadata, include_columns={
                "payment_id", "patient_id", "appointment_id", "invoice_id", "amount",
                "currency", "status", "provider_reference", "verified_at", "created_at", "updated_at",
            })
            for constraint in tuple(copied.constraints):
                if isinstance(constraint, CheckConstraint):
                    copied.constraints.remove(constraint)
            continue
        if name == "notifications":
            # Preserve the original queue table shape; revision 0007 owns its evolution.
            copied = _copy_table(table, metadata, include_columns={
                "notification_id", "user_id", "channel", "message_reference",
                "delivery_status", "created_at", "updated_at",
            })
            for index in tuple(copied.indexes):
                if any(column.name not in {
                    "notification_id", "user_id", "channel", "message_reference",
                    "delivery_status", "created_at", "updated_at",
                } for column in index.columns):
                    copied.indexes.remove(index)
            continue
        if name == "consents":
            # Revision 0007 adds channel-scoped consent without rewriting legacy rows.
            _copy_table(table, metadata, include_columns={
                "consent_id", "patient_id", "purpose", "status", "recorded_at",
                "policy_version", "evidence_ref", "created_at", "updated_at",
            })
            continue
        if name not in {
            "auth_sessions", "user_mfa", "auth_rate_limits", "website_content",
            "medical_record_versions", "patient_medical_histories", "clinical_documents",
            "payment_refunds", "payment_webhook_events",
            "notification_templates", "notification_attempts", "staff_tasks",
            "knowledge_documents", "knowledge_chunks", "ai_usage_counters",
        }:
            table.to_metadata(metadata)
    return metadata
