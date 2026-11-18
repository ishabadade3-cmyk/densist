"""Server-verified online and offline payment flows (FR-034–FR-038)."""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth_routes import AuthContext, get_fully_authenticated_context, require_csrf, require_roles
from app.database import get_db
from app.models import AuditLog, Invoice, Patient, Payment, PaymentRefund, PaymentWebhookEvent
from app.payment_gateway import (
    PaymentGatewayUnavailable,
    RazorpayGateway,
    get_payment_gateway,
)

router = APIRouter(prefix="/api/v1", tags=["payments"])
STAFF_ROLES = {"receptionist", "clinic_admin"}
MINOR_UNIT = Decimal("100")


class CheckoutIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    invoice_id: uuid.UUID
    idempotency_key: str = Field(min_length=8, max_length=128, pattern=r"^[A-Za-z0-9._:-]+$")


class InvoiceIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patient_id: uuid.UUID
    appointment_id: uuid.UUID | None = None
    treatment_id: uuid.UUID | None = None
    total_amount: Decimal = Field(ge=Decimal("0"), max_digits=10, decimal_places=2)
    tax_amount: Decimal = Field(default=Decimal("0"), ge=Decimal("0"), max_digits=10, decimal_places=2)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=Decimal("0"), max_digits=10, decimal_places=2)
    net_amount: Decimal = Field(gt=Decimal("0"), max_digits=10, decimal_places=2)


class CheckoutOut(BaseModel):
    payment_id: uuid.UUID
    invoice_id: uuid.UUID
    amount: float
    currency: str
    status: str
    provider_order_id: str
    key_id: str


class VerifyCheckoutIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    razorpay_order_id: str = Field(min_length=1, max_length=80)
    razorpay_payment_id: str = Field(min_length=1, max_length=80)
    razorpay_signature: str = Field(min_length=1, max_length=128)


class OfflinePaymentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    invoice_id: uuid.UUID
    amount: Decimal = Field(gt=Decimal("0"), max_digits=10, decimal_places=2)
    method: Literal["cash", "bank_transfer", "upi", "other"]
    received_at: datetime | None = None
    idempotency_key: str = Field(min_length=8, max_length=128, pattern=r"^[A-Za-z0-9._:-]+$")


class RefundIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    amount: Decimal = Field(gt=Decimal("0"), max_digits=10, decimal_places=2)
    idempotency_key: str = Field(min_length=10, max_length=128, pattern=r"^[A-Za-z0-9._:-]+$")


class PaymentOut(BaseModel):
    payment_id: uuid.UUID
    patient_id: uuid.UUID
    invoice_id: uuid.UUID | None
    amount: float
    currency: str
    status: str
    payment_method: str
    offline_method: str | None
    refunded_amount: str
    receipt_number: str | None
    created_at: datetime
    verified_at: datetime | None


class ReceiptOut(BaseModel):
    receipt_number: str
    payment_id: uuid.UUID
    invoice_id: uuid.UUID
    invoice_number: str
    amount: str
    currency: str
    payment_method: str
    offline_method: str | None
    received_at: datetime
    status: str


class RefundOut(BaseModel):
    refund_id: uuid.UUID
    payment_id: uuid.UUID
    amount: str
    status: str
    provider_refund_id: str | None
    created_at: datetime


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        raise HTTPException(status_code=400, detail="INVALID_AMOUNT") from None


def _to_minor(amount: Decimal) -> int:
    if amount <= 0 or amount != amount.quantize(Decimal("0.01")):
        raise HTTPException(status_code=400, detail="INVALID_AMOUNT")
    return int(amount * MINOR_UNIT)


def _out(payment: Payment) -> PaymentOut:
    return PaymentOut(
        payment_id=payment.payment_id,
        patient_id=payment.patient_id,
        invoice_id=payment.invoice_id,
        amount=float(_decimal(payment.amount)),
        currency=payment.currency,
        status=payment.status,
        payment_method=payment.payment_method,
        offline_method=payment.offline_method,
        refunded_amount=f"{_decimal(payment.refunded_amount):.2f}",
        receipt_number=payment.receipt_number,
        created_at=payment.created_at,
        verified_at=payment.verified_at,
    )


def _refund_out(refund: PaymentRefund) -> RefundOut:
    return RefundOut(
        refund_id=refund.refund_id,
        payment_id=refund.payment_id,
        amount=f"{_decimal(refund.amount):.2f}",
        status=refund.status,
        provider_refund_id=refund.provider_refund_id,
        created_at=refund.created_at,
    )


def _audit(db: Session, context: AuthContext, action: str, resource_id: uuid.UUID | None = None) -> None:
    # Do not put invoice/patient identifiers or provider payloads in audit metadata.
    db.add(AuditLog(
        user_id=None if context.user.role == "patient" else context.user.user_id,
        action=action,
        resource_type="payment",
        resource_id=None if context.user.role == "patient" else resource_id,
        occurred_at=datetime.now(timezone.utc),
        metadata_={"source": "payment_api"},
    ))


def _authorize_invoice(db: Session, invoice_id: uuid.UUID, context: AuthContext, *, lock: bool = False) -> Invoice:
    query = select(Invoice).where(Invoice.invoice_id == invoice_id)
    if lock:
        query = query.with_for_update()
    invoice = db.scalar(query)
    if invoice is None:
        raise HTTPException(status_code=404, detail="INVOICE_NOT_FOUND")
    if context.user.role == "patient":
        patient_id = db.scalar(select(Patient.patient_id).where(Patient.user_id == context.user.user_id))
        if patient_id != invoice.patient_id:
            _audit(db, context, "payment.invoice_access_denied")
            db.commit()
            raise HTTPException(status_code=404, detail="INVOICE_NOT_FOUND")
    elif context.user.role not in STAFF_ROLES:
        _audit(db, context, "payment.invoice_access_denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    return invoice


def _recompute_invoice_status(db: Session, invoice: Invoice) -> None:
    payments = db.scalars(select(Payment).where(Payment.invoice_id == invoice.invoice_id)).all()
    gross_success = sum(
        (_decimal(item.amount) for item in payments if item.status in {"successful", "partially_refunded", "refunded"}),
        Decimal("0.00"),
    )
    refunded = sum((_decimal(item.refunded_amount) for item in payments), Decimal("0.00"))
    net_success = gross_success - refunded
    due = _decimal(invoice.net_amount)
    if gross_success > 0 and refunded >= gross_success:
        invoice.status = "refunded"
    elif refunded > 0:
        invoice.status = "partially_refunded"
    elif net_success >= due:
        invoice.status = "paid"
    elif net_success > 0:
        invoice.status = "partially_paid"
    elif invoice.status not in {"draft", "cancelled"}:
        invoice.status = "issued"


def _invoice_reserved_balance(db: Session, invoice_id: uuid.UUID) -> Decimal:
    rows = db.scalars(select(Payment).where(Payment.invoice_id == invoice_id)).all()
    return sum((
        _decimal(row.amount) - _decimal(row.refunded_amount)
        if row.status in {"successful", "partially_refunded", "refunded"}
        else _decimal(row.amount) if row.status == "pending" else Decimal("0.00")
        for row in rows
    ), Decimal("0.00"))


def _ensure_receipt(payment: Payment) -> None:
    if payment.receipt_number is None:
        payment.receipt_number = f"RCT-{uuid.uuid4().hex.upper()}"


def _capture_payment(db: Session, payment: Payment, entity: dict[str, Any], payment_id: str) -> None:
    if entity.get("status") not in {"captured", "successful"}:
        raise HTTPException(status_code=400, detail="PAYMENT_NOT_CAPTURED")
    if entity.get("order_id") != payment.provider_order_id:
        raise HTTPException(status_code=400, detail="PAYMENT_ORDER_MISMATCH")
    if entity.get("currency") != payment.currency or entity.get("amount") != _to_minor(_decimal(payment.amount)):
        raise HTTPException(status_code=400, detail="PAYMENT_AMOUNT_MISMATCH")
    existing = db.scalar(select(Payment).where(Payment.provider_reference == payment_id))
    if existing is not None and existing.payment_id != payment.payment_id:
        raise HTTPException(status_code=409, detail="PROVIDER_PAYMENT_ALREADY_LINKED")
    if payment.provider_reference is not None and payment.provider_reference != payment_id:
        raise HTTPException(status_code=409, detail="PROVIDER_PAYMENT_MISMATCH")
    if payment.status in {"successful", "partially_refunded", "refunded"}:
        return
    if payment.status not in {"pending", "failed"}:
        raise HTTPException(status_code=409, detail="INVALID_PAYMENT_TRANSITION")
    payment.provider_reference = payment_id
    payment.status = "successful"
    payment.verified_at = datetime.now(timezone.utc)
    _ensure_receipt(payment)
    if payment.invoice is not None:
        _recompute_invoice_status(db, payment.invoice)


def _fail_payment(payment: Payment, entity: dict[str, Any]) -> None:
    if entity.get("status") != "failed":
        raise HTTPException(status_code=400, detail="INVALID_PAYMENT_FAILURE_EVENT")
    if entity.get("order_id") != payment.provider_order_id:
        raise HTTPException(status_code=400, detail="PAYMENT_ORDER_MISMATCH")
    if payment.status == "pending":
        payment.provider_reference = entity.get("id") or payment.provider_reference
        payment.status = "failed"


def _apply_refund(db: Session, payment: Payment, entity: dict[str, Any]) -> None:
    refund_id = entity.get("id")
    provider_payment_id = entity.get("payment_id")
    amount_minor = entity.get("amount")
    if not isinstance(refund_id, str) or not isinstance(provider_payment_id, str):
        raise HTTPException(status_code=400, detail="INVALID_REFUND_EVENT")
    if provider_payment_id != payment.provider_reference or not isinstance(amount_minor, int) or amount_minor <= 0:
        raise HTTPException(status_code=400, detail="INVALID_REFUND_EVENT")
    if payment.status not in {"successful", "partially_refunded", "refunded"}:
        raise HTTPException(status_code=409, detail="PAYMENT_NOT_REFUNDABLE")
    refund = db.scalar(select(PaymentRefund).where(PaymentRefund.provider_refund_id == refund_id).with_for_update())
    amount = (Decimal(amount_minor) / MINOR_UNIT).quantize(Decimal("0.01"))
    if refund is not None and (refund.payment_id != payment.payment_id or _decimal(refund.amount) != amount):
        raise HTTPException(status_code=409, detail="REFUND_EVENT_MISMATCH")
    if refund is not None and refund.status == "successful":
        return
    successful_refunds = db.scalar(select(func.coalesce(func.sum(PaymentRefund.amount), 0)).where(
        PaymentRefund.payment_id == payment.payment_id,
        PaymentRefund.status == "successful",
    )) or Decimal("0.00")
    if amount + _decimal(successful_refunds) > _decimal(payment.amount):
        raise HTTPException(status_code=409, detail="REFUND_EXCEEDS_PAYMENT_AMOUNT")
    if refund is None:
        pending = db.scalar(
            select(PaymentRefund).where(
                PaymentRefund.payment_id == payment.payment_id,
                PaymentRefund.status == "pending",
                PaymentRefund.provider_refund_id.is_(None),
                PaymentRefund.amount == amount,
            ).order_by(PaymentRefund.created_at).with_for_update().limit(1)
        )
        refund = pending or PaymentRefund(
            payment_id=payment.payment_id,
            amount=amount,
            status="pending",
            idempotency_key=f"webhook:{refund_id}",
        )
        db.add(refund)
    refund.provider_refund_id = refund_id
    if entity.get("status") not in {"processed", "successful"}:
        if refund.status == "pending":
            refund.status = "failed"
    else:
        refund.status = "successful"
    db.flush()
    payment.refunded_amount = db.scalar(
        select(func.coalesce(func.sum(PaymentRefund.amount), 0)).where(
            PaymentRefund.payment_id == payment.payment_id,
            PaymentRefund.status == "successful",
        )
    ) or Decimal("0.00")
    if payment.refunded_amount >= _decimal(payment.amount):
        payment.status = "refunded"
    elif payment.refunded_amount > 0 and payment.status in {"successful", "partially_refunded"}:
        payment.status = "partially_refunded"
    if payment.invoice is not None:
        _recompute_invoice_status(db, payment.invoice)


@router.post("/payments/checkout", response_model=CheckoutOut, dependencies=[Depends(require_csrf)])
def create_checkout_order(
    payload: CheckoutIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
    gateway: Annotated[RazorpayGateway, Depends(get_payment_gateway)],
) -> CheckoutOut:
    invoice = _authorize_invoice(db, payload.invoice_id, context, lock=True)
    if invoice.status in {"paid", "refunded", "cancelled"}:
        raise HTTPException(status_code=409, detail="INVOICE_NOT_PAYABLE")
    existing = db.scalar(select(Payment).where(Payment.idempotency_key == payload.idempotency_key))
    if existing is not None:
        if existing.invoice_id != invoice.invoice_id or existing.patient_id != invoice.patient_id:
            raise HTTPException(status_code=409, detail="IDEMPOTENCY_KEY_REUSED")
        if existing.provider_order_id:
            return CheckoutOut(
                payment_id=existing.payment_id,
                invoice_id=invoice.invoice_id,
                amount=float(_decimal(existing.amount)),
                currency=existing.currency,
                status=existing.status,
                provider_order_id=existing.provider_order_id,
                key_id=gateway.key_id,
            )
        raise HTTPException(status_code=409, detail="CHECKOUT_IN_PROGRESS_OR_FAILED")

    amount = _decimal(invoice.net_amount) - _invoice_reserved_balance(db, invoice.invoice_id)
    minor_amount = _to_minor(amount)
    if invoice.status == "draft":
        raise HTTPException(status_code=409, detail="INVOICE_NOT_ISSUED")
    payment = Payment(
        patient_id=invoice.patient_id,
        appointment_id=invoice.appointment_id,
        invoice_id=invoice.invoice_id,
        amount=amount,
        currency="INR",
        status="pending",
        payment_method="online",
        idempotency_key=payload.idempotency_key,
    )
    db.add(payment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.scalar(select(Payment).where(Payment.idempotency_key == payload.idempotency_key))
        if existing is not None and existing.provider_order_id and existing.invoice_id == invoice.invoice_id:
            return CheckoutOut(
                payment_id=existing.payment_id,
                invoice_id=invoice.invoice_id,
                amount=float(_decimal(existing.amount)),
                currency=existing.currency,
                status=existing.status,
                provider_order_id=existing.provider_order_id,
                key_id=gateway.key_id,
            )
        raise HTTPException(status_code=409, detail="IDEMPOTENCY_KEY_REUSED") from None
    db.refresh(payment)
    try:
        order = gateway.create_order(
            minor_amount,
            payment.currency,
            f"payment-{payment.payment_id.hex}",
        )
        order_id = order.get("id")
        if not isinstance(order_id, str) or not order_id:
            raise PaymentGatewayUnavailable
    except PaymentGatewayUnavailable:
        payment.status = "failed"
        db.commit()
        raise HTTPException(status_code=503, detail="PAYMENT_PROVIDER_UNAVAILABLE") from None
    payment.provider_order_id = order_id
    _audit(db, context, "payment.checkout_created", payment.payment_id)
    db.commit()
    return CheckoutOut(
        payment_id=payment.payment_id,
        invoice_id=invoice.invoice_id,
        amount=float(_decimal(payment.amount)),
        currency=payment.currency,
        status=payment.status,
        provider_order_id=order_id,
        key_id=gateway.key_id,
    )


@router.post("/payments/verify", response_model=PaymentOut, dependencies=[Depends(require_csrf)])
def verify_checkout(
    payload: VerifyCheckoutIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
    gateway: Annotated[RazorpayGateway, Depends(get_payment_gateway)],
) -> PaymentOut:
    payment = db.scalar(select(Payment).where(Payment.provider_order_id == payload.razorpay_order_id).with_for_update())
    if payment is None:
        raise HTTPException(status_code=404, detail="PAYMENT_NOT_FOUND")
    if context.user.role == "patient":
        patient_id = db.scalar(select(Patient.patient_id).where(Patient.user_id == context.user.user_id))
        if patient_id != payment.patient_id:
            raise HTTPException(status_code=404, detail="PAYMENT_NOT_FOUND")
    elif context.user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    try:
        signature_valid = gateway.verify_checkout_signature(
            payload.razorpay_order_id,
            payload.razorpay_payment_id,
            payload.razorpay_signature,
        )
    except PaymentGatewayUnavailable:
        raise HTTPException(status_code=503, detail="PAYMENT_PROVIDER_UNAVAILABLE") from None
    if not signature_valid:
        _audit(db, context, "payment.signature_rejected", payment.payment_id)
        db.commit()
        raise HTTPException(status_code=401, detail="INVALID_PAYMENT_SIGNATURE")
    try:
        verified = gateway.fetch_payment(payload.razorpay_payment_id)
    except PaymentGatewayUnavailable:
        raise HTTPException(status_code=503, detail="PAYMENT_PROVIDER_UNAVAILABLE") from None
    if verified.get("status") != "captured":
        if verified.get("status") == "failed":
            _fail_payment(payment, verified)
            if payment.invoice is not None:
                _recompute_invoice_status(db, payment.invoice)
            db.commit()
        raise HTTPException(status_code=409, detail="PAYMENT_NOT_CAPTURED")
    _capture_payment(db, payment, verified, payload.razorpay_payment_id)
    _audit(db, context, "payment.verified", payment.payment_id)
    db.commit()
    db.refresh(payment)
    return _out(payment)


@router.post("/payments/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    gateway: Annotated[RazorpayGateway, Depends(get_payment_gateway)],
    signature: Annotated[str | None, Header(alias="X-Razorpay-Signature")] = None,
    event_id: Annotated[str | None, Header(alias="X-Razorpay-Event-Id")] = None,
) -> dict[str, Any]:
    body_parts: list[bytes] = []
    body_size = 0
    async for chunk in request.stream():
        body_size += len(chunk)
        if body_size > 1_048_576:
            raise HTTPException(status_code=413, detail="WEBHOOK_BODY_TOO_LARGE")
        body_parts.append(chunk)
    raw_body = b"".join(body_parts)
    if not event_id or len(event_id) > 160:
        raise HTTPException(status_code=400, detail="MISSING_EVENT_ID")
    try:
        valid = gateway.verify_webhook(raw_body, signature or "")
    except PaymentGatewayUnavailable:
        raise HTTPException(status_code=503, detail="PAYMENT_PROVIDER_UNAVAILABLE") from None
    if not valid:
        raise HTTPException(status_code=401, detail="INVALID_WEBHOOK_SIGNATURE")
    try:
        payload = json.loads(raw_body)
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="INVALID_WEBHOOK_BODY") from None
    if not isinstance(payload, dict) or not isinstance(payload.get("event"), str):
        raise HTTPException(status_code=400, detail="INVALID_WEBHOOK_BODY")
    event_type = payload["event"]
    payload_hash = hashlib.sha256(raw_body).hexdigest()
    saved_id = db.execute(
        pg_insert(PaymentWebhookEvent)
        .values(
            provider_event_id=event_id,
            event_type=event_type,
            payload_sha256=payload_hash,
            outcome="processing",
        )
        .on_conflict_do_nothing(index_elements=[PaymentWebhookEvent.provider_event_id])
        .returning(PaymentWebhookEvent.webhook_event_id)
    ).scalar_one_or_none()
    if saved_id is None:
        db.commit()
        return {"accepted": True, "duplicate": True}
    event_row = db.get(PaymentWebhookEvent, saved_id)
    supported_events = {
        "payment.captured",
        "payment.failed",
        "refund.processed",
        "refund.failed",
    }
    if event_type not in supported_events:
        event_row.outcome = "ignored"
        event_row.processed_at = datetime.now(timezone.utc)
        db.commit()
        return {"accepted": True, "duplicate": False}
    entity_type = "refund" if event_type.startswith("refund.") else "payment"
    entity = payload.get("payload", {}).get(entity_type, {}).get("entity") if isinstance(payload.get("payload"), dict) else None
    if not isinstance(entity, dict):
        db.rollback()
        raise HTTPException(status_code=400, detail="INVALID_WEBHOOK_ENTITY")

    if event_type == "payment.captured":
        order_id, provider_payment_id = entity.get("order_id"), entity.get("id")
        payment = db.scalar(select(Payment).where(Payment.provider_order_id == order_id).with_for_update()) if isinstance(order_id, str) else None
        if payment is None or not isinstance(provider_payment_id, str):
            db.rollback()
            raise HTTPException(status_code=404, detail="PAYMENT_NOT_FOUND")
        _capture_payment(db, payment, entity, provider_payment_id)
        event_row.outcome = "captured"
        event_row.processed_at = datetime.now(timezone.utc)
    elif event_type == "payment.failed":
        order_id = entity.get("order_id")
        payment = db.scalar(select(Payment).where(Payment.provider_order_id == order_id).with_for_update()) if isinstance(order_id, str) else None
        if payment is None:
            db.rollback()
            raise HTTPException(status_code=404, detail="PAYMENT_NOT_FOUND")
        _fail_payment(payment, entity)
        if payment.invoice is not None:
            _recompute_invoice_status(db, payment.invoice)
        event_row.outcome = "failed"
        event_row.processed_at = datetime.now(timezone.utc)
    elif event_type in {"refund.processed", "refund.failed"}:
        expected_refund_statuses = {"processed", "successful"} if event_type == "refund.processed" else {"failed"}
        if entity.get("status") not in expected_refund_statuses:
            db.rollback()
            raise HTTPException(status_code=400, detail="REFUND_STATUS_MISMATCH")
        provider_payment_id = entity.get("payment_id")
        payment = db.scalar(select(Payment).where(Payment.provider_reference == provider_payment_id).with_for_update()) if isinstance(provider_payment_id, str) else None
        if payment is None:
            db.rollback()
            raise HTTPException(status_code=404, detail="PAYMENT_NOT_FOUND")
        _apply_refund(db, payment, entity)
        event_row.outcome = event_type
        event_row.processed_at = datetime.now(timezone.utc)
    else:
        event_row.outcome = "ignored"
        event_row.processed_at = datetime.now(timezone.utc)
    db.commit()
    return {"accepted": True, "duplicate": False}


@router.post("/payments/offline", response_model=PaymentOut, status_code=201, dependencies=[Depends(require_csrf)])
def record_offline_payment(
    payload: OfflinePaymentIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("receptionist", "clinic_admin"))],
) -> PaymentOut:
    invoice = _authorize_invoice(db, payload.invoice_id, context, lock=True)
    existing = db.scalar(select(Payment).where(Payment.idempotency_key == payload.idempotency_key))
    if existing is not None:
        if existing.invoice_id != invoice.invoice_id or existing.payment_method != "offline":
            raise HTTPException(status_code=409, detail="IDEMPOTENCY_KEY_REUSED")
        return _out(existing)
    amount = _decimal(payload.amount)
    if amount > _decimal(invoice.net_amount) - _invoice_reserved_balance(db, invoice.invoice_id):
        raise HTTPException(status_code=409, detail="PAYMENT_EXCEEDS_BALANCE")
    received_at = payload.received_at or datetime.now(timezone.utc)
    offline_method = payload.method.strip()
    if not offline_method:
        raise HTTPException(status_code=400, detail="OFFLINE_METHOD_REQUIRED")
    if received_at.tzinfo is None:
        raise HTTPException(status_code=400, detail="RECEIVED_AT_REQUIRES_TIMEZONE")
    payment = Payment(
        patient_id=invoice.patient_id,
        appointment_id=invoice.appointment_id,
        invoice_id=invoice.invoice_id,
        amount=amount,
        currency="INR",
        status="successful",
        payment_method="offline",
        offline_method=offline_method,
        recorded_by_user_id=context.user.user_id,
        idempotency_key=payload.idempotency_key,
        verified_at=received_at,
    )
    _ensure_receipt(payment)
    db.add(payment)
    db.flush()
    _recompute_invoice_status(db, invoice)
    _audit(db, context, "payment.offline_recorded", payment.payment_id)
    db.commit()
    db.refresh(payment)
    return _out(payment)


@router.post("/payments/{payment_id}/refunds", response_model=RefundOut, status_code=202, dependencies=[Depends(require_csrf)])
def request_refund(
    payment_id: uuid.UUID,
    payload: RefundIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("receptionist", "clinic_admin"))],
    gateway: Annotated[RazorpayGateway, Depends(get_payment_gateway)],
) -> RefundOut:
    payment = db.scalar(select(Payment).where(Payment.payment_id == payment_id).with_for_update())
    if payment is None:
        raise HTTPException(status_code=404, detail="PAYMENT_NOT_FOUND")
    if payment.payment_method != "online" or not payment.provider_reference:
        raise HTTPException(status_code=409, detail="OFFLINE_REFUND_REQUIRES_EXTERNAL_PROCESS")
    existing = db.scalar(select(PaymentRefund).where(PaymentRefund.idempotency_key == payload.idempotency_key))
    if existing is not None:
        if existing.payment_id != payment.payment_id or _decimal(existing.amount) != _decimal(payload.amount):
            raise HTTPException(status_code=409, detail="IDEMPOTENCY_KEY_REUSED")
        if existing.provider_refund_id:
            return _refund_out(existing)
        refund = existing
    else:
        amount = _decimal(payload.amount)
        already_reserved = db.scalar(select(func.coalesce(func.sum(PaymentRefund.amount), 0)).where(
            PaymentRefund.payment_id == payment.payment_id,
            PaymentRefund.status.in_(("pending", "successful")),
        )) or Decimal("0.00")
        if payment.status not in {"successful", "partially_refunded"} or amount > _decimal(payment.amount) - _decimal(already_reserved):
            raise HTTPException(status_code=409, detail="REFUND_EXCEEDS_AVAILABLE_AMOUNT")
        refund = PaymentRefund(
            payment_id=payment.payment_id,
            amount=amount,
            status="pending",
            idempotency_key=payload.idempotency_key,
            requested_by_user_id=context.user.user_id,
        )
        db.add(refund)
        db.commit()
        db.refresh(refund)
    try:
        response = gateway.create_refund(
            payment.provider_reference,
            _to_minor(_decimal(refund.amount)),
            refund.idempotency_key,
        )
    except PaymentGatewayUnavailable:
        raise HTTPException(status_code=503, detail="PAYMENT_PROVIDER_UNAVAILABLE") from None
    provider_refund_id = response.get("id")
    if not isinstance(provider_refund_id, str) or not provider_refund_id:
        raise HTTPException(status_code=503, detail="PAYMENT_PROVIDER_UNAVAILABLE")
    refund.provider_refund_id = provider_refund_id
    _audit(db, context, "payment.refund_requested", payment.payment_id)
    db.commit()
    db.refresh(refund)
    return _refund_out(refund)


@router.get("/payments/{payment_id}/receipt", response_model=ReceiptOut)
def get_payment_receipt(
    payment_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> ReceiptOut:
    payment = db.get(Payment, payment_id)
    if payment is None or payment.status not in {"successful", "partially_refunded", "refunded"} or not payment.receipt_number:
        raise HTTPException(status_code=404, detail="RECEIPT_NOT_FOUND")
    _authorize_invoice(db, payment.invoice_id, context) if payment.invoice_id else None
    if context.user.role not in STAFF_ROLES | {"patient"}:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    invoice = db.get(Invoice, payment.invoice_id) if payment.invoice_id else None
    if invoice is None:
        raise HTTPException(status_code=404, detail="INVOICE_NOT_FOUND")
    _audit(db, context, "payment.receipt_read", payment.payment_id)
    db.commit()
    return ReceiptOut(
        receipt_number=payment.receipt_number,
        payment_id=payment.payment_id,
        invoice_id=invoice.invoice_id,
        invoice_number=invoice.invoice_number,
        amount=f"{_decimal(payment.amount):.2f}",
        currency=payment.currency,
        payment_method=payment.payment_method,
        offline_method=payment.offline_method,
        received_at=payment.verified_at or payment.created_at,
        status=payment.status,
    )


@router.get("/payments", response_model=list[PaymentOut])
def list_payments(
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[PaymentOut]:
    query = select(Payment).order_by(Payment.created_at.desc())
    if context.user.role == "patient":
        patient_id = db.scalar(select(Patient.patient_id).where(Patient.user_id == context.user.user_id))
        if patient_id is None:
            return []
        query = query.where(Payment.patient_id == patient_id)
    elif context.user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    rows = db.scalars(query).all()
    _audit(db, context, "payment.history_read")
    db.commit()
    return [_out(row) for row in rows]


def reconcile_pending_payments(db: Session, gateway: RazorpayGateway, *, older_than_seconds: int = 600) -> dict[str, int]:
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=older_than_seconds)
    payments = db.scalars(select(Payment).where(
        Payment.status == "pending",
        Payment.provider_order_id.is_not(None),
        Payment.created_at <= cutoff,
    ).with_for_update(skip_locked=True)).all()
    counts = {"checked": 0, "successful": 0, "failed": 0}
    for payment in payments:
        counts["checked"] += 1
        try:
            provider_items = gateway.fetch_order_payments(payment.provider_order_id)
        except PaymentGatewayUnavailable:
            continue
        captured = next((item for item in provider_items if item.get("status") == "captured"), None)
        failed = next((item for item in reversed(provider_items) if item.get("status") == "failed"), None)
        if captured and isinstance(captured.get("id"), str):
            _capture_payment(db, payment, captured, captured["id"])
            counts["successful"] += 1
        elif failed:
            _fail_payment(payment, failed)
            counts["failed"] += 1
        if payment.invoice is not None:
            _recompute_invoice_status(db, payment.invoice)
    db.commit()
    return counts


@router.get("/invoices")
def list_invoices(
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[dict[str, Any]]:
    query = select(Invoice).order_by(Invoice.created_at.desc())
    if context.user.role == "patient":
        patient_id = db.scalar(select(Patient.patient_id).where(Patient.user_id == context.user.user_id))
        if patient_id is None:
            return []
        query = query.where(Invoice.patient_id == patient_id)
    elif context.user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    invoices = db.scalars(query).all()
    return [{
        "invoice_id": invoice.invoice_id,
        "invoice_number": invoice.invoice_number,
        "patient_id": invoice.patient_id,
        "appointment_id": invoice.appointment_id,
        "total_amount": float(invoice.total_amount),
        "tax_amount": float(invoice.tax_amount),
        "net_amount": float(invoice.net_amount),
        "status": invoice.status,
        "issued_at": invoice.issued_at.isoformat() if invoice.issued_at else None,
        "pdf_document_url": invoice.pdf_document_url,
    } for invoice in invoices]


@router.post("/invoices", status_code=201, dependencies=[Depends(require_csrf)])
def create_invoice(
    payload: InvoiceIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("receptionist", "clinic_admin"))],
) -> dict[str, Any]:
    if _decimal(payload.total_amount) + _decimal(payload.tax_amount) - _decimal(payload.discount_amount) != _decimal(payload.net_amount):
        raise HTTPException(status_code=400, detail="INVOICE_TOTAL_MISMATCH")
    patient = db.get(Patient, payload.patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="PATIENT_NOT_FOUND")
    invoice = Invoice(
        invoice_number=f"INV-{uuid.uuid4().hex.upper()}",
        patient_id=patient.patient_id,
        appointment_id=payload.appointment_id,
        treatment_id=payload.treatment_id,
        total_amount=payload.total_amount,
        tax_amount=payload.tax_amount,
        discount_amount=payload.discount_amount,
        net_amount=payload.net_amount,
        status="issued",
        issued_at=datetime.now(timezone.utc),
    )
    db.add(invoice)
    db.flush()
    _audit(db, context, "invoice.issued", invoice.invoice_id)
    db.commit()
    return {
        "invoice_id": invoice.invoice_id,
        "invoice_number": invoice.invoice_number,
        "patient_id": invoice.patient_id,
        "appointment_id": invoice.appointment_id,
        "total_amount": float(invoice.total_amount),
        "tax_amount": float(invoice.tax_amount),
        "net_amount": float(invoice.net_amount),
        "status": invoice.status,
        "issued_at": invoice.issued_at.isoformat(),
        "pdf_document_url": None,
    }


