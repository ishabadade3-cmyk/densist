"""Add consent-scoped notification queue, templates and staff follow-up tasks.

Revision ID: 0007_notifications
Revises: 0006_payments
Requirement IDs: FR-039, FR-040, FR-041, FR-042, FR-043
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from app.models import NotificationAttempt, NotificationTemplate, StaffTask

revision: str = "0007_notifications"
down_revision: str | None = "0006_payments"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    NotificationTemplate.__table__.create(bind=bind, checkfirst=False)
    NotificationAttempt.__table__.create(bind=bind, checkfirst=False)
    StaffTask.__table__.create(bind=bind, checkfirst=False)
    op.add_column("consents", sa.Column("channel", sa.Text(), nullable=True))
    op.create_index(
        "ix_consents_patient_channel_purpose_recorded",
        "consents",
        ["patient_id", "channel", "purpose", "recorded_at"],
    )
    op.add_column("notifications", sa.Column("purpose", sa.Text(), server_default="care_delivery", nullable=False))
    op.add_column("notifications", sa.Column("template_id", sa.Uuid(), nullable=True))
    op.add_column("notifications", sa.Column("resource_id", sa.Uuid(), nullable=True))
    op.add_column("notifications", sa.Column("idempotency_key", sa.Text(), nullable=True))
    op.add_column("notifications", sa.Column("variables", JSONB(), server_default=sa.text("'{}'::jsonb"), nullable=False))
    op.add_column("notifications", sa.Column("scheduled_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.add_column("notifications", sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("notifications", sa.Column("attempt_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("notifications", sa.Column("max_attempts", sa.Integer(), server_default="3", nullable=False))
    op.add_column("notifications", sa.Column("last_error_code", sa.Text(), nullable=True))
    op.add_column("notifications", sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True))
    for name in ("purpose", "variables", "scheduled_at", "attempt_count", "max_attempts"):
        op.alter_column("notifications", name, server_default=None)
    # Existing records are retained but cannot be dispatched without template/consent context.
    op.create_foreign_key("fk_notifications_template_id_notification_templates", "notifications", "notification_templates", ["template_id"], ["template_id"])
    op.create_unique_constraint("uq_notifications_idempotency_key", "notifications", ["idempotency_key"])
    op.create_index("ix_notifications_status_due", "notifications", ["delivery_status", "next_attempt_at"])
    for table in (NotificationTemplate.__table__, NotificationAttempt.__table__, StaffTask.__table__):
        op.execute(
            f'CREATE TRIGGER "trg_{table.name}_updated_at" '
            f'BEFORE UPDATE ON "{table.name}" '
            'FOR EACH ROW EXECUTE FUNCTION set_updated_at_utc()'
        )


def downgrade() -> None:
    # Fail safely rather than deleting queued notifications, attempts or staff work.
    bind = op.get_bind()
    has_rows = bind.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM notification_attempts) OR "
        "EXISTS (SELECT 1 FROM staff_tasks) OR "
        "EXISTS (SELECT 1 FROM notifications WHERE attempt_count > 0 OR delivery_status NOT IN ('queued','legacy_unqueued'))"
    )).scalar_one()
    if has_rows:
        raise RuntimeError("Refusing to downgrade: notification delivery history or staff tasks exist")
    op.drop_index("ix_notifications_status_due", table_name="notifications")
    op.drop_constraint("uq_notifications_idempotency_key", "notifications", type_="unique")
    op.drop_constraint("fk_notifications_template_id_notification_templates", "notifications", type_="foreignkey")
    for column in (
        "delivered_at", "last_error_code", "max_attempts", "attempt_count", "next_attempt_at",
        "scheduled_at", "variables", "idempotency_key", "resource_id", "template_id", "purpose",
    ):
        op.drop_column("notifications", column)
    op.drop_index("ix_consents_patient_channel_purpose_recorded", table_name="consents")
    op.drop_column("consents", "channel")
    for table in (StaffTask.__table__, NotificationAttempt.__table__, NotificationTemplate.__table__):
        op.execute(f'DROP TRIGGER IF EXISTS "trg_{table.name}_updated_at" ON "{table.name}"')
        table.drop(bind=bind, checkfirst=False)
