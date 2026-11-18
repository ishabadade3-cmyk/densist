from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    CHAR,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.clinical import Patient
    from app.models.appointments import Appointment


class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"
    __table_args__ = (Index("ix_invoices_patient_issued", "patient_id", "issued_at"),)

    invoice_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    invoice_number: Mapped[str] = mapped_column(Text, unique=True, index=True, nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    appointment_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("appointments.appointment_id"), nullable=True)
    treatment_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("treatments.treatment_id"), nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    net_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="draft", index=True)  # draft, issued, paid, cancelled, refunded
    sac_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    pdf_document_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="invoices")
    appointment: Mapped[Optional["Appointment"]] = relationship("Appointment", back_populates="invoices")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="invoice")


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_patient_created", "patient_id", "created_at"),
        CheckConstraint("status IN ('pending','successful','failed','refunded','partially_refunded')", name="payment_status"),
        CheckConstraint("payment_method IN ('online','offline')", name="payment_method"),
        CheckConstraint("amount > 0", name="payment_amount_positive"),
        CheckConstraint("refunded_amount >= 0 AND refunded_amount <= amount", name="payment_refund_bounds"),
    )

    payment_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    appointment_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("appointments.appointment_id"), nullable=True)
    invoice_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("invoices.invoice_id"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(CHAR(3), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending", index=True)  # pending, successful, failed, refunded, partially_refunded
    provider_reference: Mapped[Optional[str]] = mapped_column(Text, unique=True, index=True, nullable=True)
    provider_order_id: Mapped[Optional[str]] = mapped_column(Text, unique=True, nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(Text, unique=True, nullable=True)
    payment_method: Mapped[str] = mapped_column(Text, nullable=False, default="online")
    recorded_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.user_id"), nullable=True)
    offline_method: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refunded_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    receipt_number: Mapped[Optional[str]] = mapped_column(Text, unique=True, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="payments")
    appointment: Mapped[Optional["Appointment"]] = relationship("Appointment", back_populates="payments")
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice", back_populates="payments")


class PaymentWebhookEvent(TimestampMixin, Base):
    __tablename__ = "payment_webhook_events"
    __table_args__ = (Index("ix_payment_webhook_events_type_created", "event_type", "created_at"),)

    webhook_event_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    provider_event_id: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    payload_sha256: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    outcome: Mapped[str] = mapped_column(Text, nullable=False)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class PaymentRefund(TimestampMixin, Base):
    __tablename__ = "payment_refunds"
    __table_args__ = (
        CheckConstraint("amount > 0", name="refund_amount_positive"),
        CheckConstraint("status IN ('pending','successful','failed')", name="refund_status"),
        Index("ix_payment_refunds_payment_status", "payment_id", "status"),
    )

    refund_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    payment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payments.payment_id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="pending")
    provider_refund_id: Mapped[Optional[str]] = mapped_column(Text, unique=True, nullable=True)
    idempotency_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    requested_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.user_id"), nullable=True)
