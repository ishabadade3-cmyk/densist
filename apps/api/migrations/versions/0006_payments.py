"""Add Razorpay, offline payment, refund and webhook inbox state.

Revision ID: 0006_payments
Revises: 0005_clinical_records
Requirement IDs: FR-034, FR-035, FR-036, FR-037, FR-038
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import context, op

from app.models import PaymentRefund, PaymentWebhookEvent

revision: str = "0006_payments"
down_revision: str | None = "0005_clinical_records"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    offline = context.is_offline_mode()
    payment_columns = set() if offline else {
        column["name"] for column in sa.inspect(bind).get_columns("payments")
    }
    if offline or "provider_order_id" not in payment_columns:
        op.add_column("payments", sa.Column("provider_order_id", sa.Text(), nullable=True))
        op.add_column("payments", sa.Column("idempotency_key", sa.Text(), nullable=True))
        op.add_column("payments", sa.Column("payment_method", sa.Text(), server_default="online", nullable=False))
        op.add_column("payments", sa.Column("recorded_by_user_id", sa.Uuid(), nullable=True))
        op.add_column("payments", sa.Column("offline_method", sa.Text(), nullable=True))
        op.add_column("payments", sa.Column("refunded_amount", sa.Numeric(10, 2), server_default="0", nullable=False))
        op.add_column("payments", sa.Column("receipt_number", sa.Text(), nullable=True))
        op.create_foreign_key("fk_payments_recorded_by_user_id_users", "payments", "users", ["recorded_by_user_id"], ["user_id"])
        op.create_unique_constraint("uq_payments_provider_order_id", "payments", ["provider_order_id"])
        op.create_unique_constraint("uq_payments_idempotency_key", "payments", ["idempotency_key"])
        op.create_unique_constraint("uq_payments_receipt_number", "payments", ["receipt_number"])
        # Existing status values are intentionally preserved pending an approved reconciliation policy.
        op.create_check_constraint("ck_payments_payment_method", "payments", "payment_method IN ('online','offline')")
        op.create_check_constraint("ck_payments_payment_amount_positive", "payments", "amount > 0")
        op.create_check_constraint("ck_payments_payment_refund_bounds", "payments", "refunded_amount >= 0 AND refunded_amount <= amount")

    existing_checks = set() if offline else {
        item["name"] for item in sa.inspect(bind).get_check_constraints("payments")
    }
    if offline:
        op.create_check_constraint(
            "ck_payments_payment_status", "payments",
            "status IN ('pending','successful','failed','refunded','partially_refunded')",
        )
    elif "ck_payments_payment_status" not in existing_checks:
        legacy_statuses = set(bind.execute(sa.text("SELECT DISTINCT status FROM payments")).scalars())
        allowed_statuses = {"pending", "successful", "failed", "refunded", "partially_refunded"}
        if legacy_statuses <= allowed_statuses:
            op.create_check_constraint(
                "ck_payments_payment_status", "payments",
                "status IN ('pending','successful','failed','refunded','partially_refunded')",
            )

    PaymentWebhookEvent.__table__.create(bind=bind, checkfirst=False)
    PaymentRefund.__table__.create(bind=bind, checkfirst=False)
    for table in (PaymentWebhookEvent.__table__, PaymentRefund.__table__):
        op.execute(
            f'CREATE TRIGGER "trg_{table.name}_updated_at" '
            f'BEFORE UPDATE ON "{table.name}" '
            'FOR EACH ROW EXECUTE FUNCTION set_updated_at_utc()'
        )


def downgrade() -> None:
    bind = op.get_bind()
    financial_rows = bind.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM payment_refunds) OR "
        "EXISTS (SELECT 1 FROM payment_webhook_events) OR "
        "EXISTS (SELECT 1 FROM payments WHERE provider_order_id IS NOT NULL "
        "OR idempotency_key IS NOT NULL OR receipt_number IS NOT NULL OR refunded_amount > 0)"
    )).scalar_one()
    if financial_rows:
        raise RuntimeError("Refusing to downgrade: payment reconciliation/refund history exists")
    checks = {item["name"] for item in sa.inspect(bind).get_check_constraints("payments")}
    if "ck_payments_payment_status" in checks:
        op.drop_constraint("ck_payments_payment_status", "payments", type_="check")
    for table in (PaymentRefund.__table__, PaymentWebhookEvent.__table__):
        op.execute(f'DROP TRIGGER IF EXISTS "trg_{table.name}_updated_at" ON "{table.name}"')
        table.drop(bind=bind, checkfirst=False)
    op.drop_constraint("ck_payments_payment_refund_bounds", "payments", type_="check")
    op.drop_constraint("ck_payments_payment_amount_positive", "payments", type_="check")
    op.drop_constraint("ck_payments_payment_method", "payments", type_="check")
    op.drop_constraint("uq_payments_receipt_number", "payments", type_="unique")
    op.drop_constraint("uq_payments_idempotency_key", "payments", type_="unique")
    op.drop_constraint("uq_payments_provider_order_id", "payments", type_="unique")
    op.drop_constraint("fk_payments_recorded_by_user_id_users", "payments", type_="foreignkey")
    for column in (
        "receipt_number", "refunded_amount", "offline_method", "recorded_by_user_id", "payment_method",
        "idempotency_key", "provider_order_id",
    ):
        op.drop_column("payments", column)
