from __future__ import annotations

import hashlib
import hmac
import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_security import _totp_at
from app.main import app
from app.models import Invoice, Payment, PaymentRefund, PaymentWebhookEvent
from app.payment_gateway import PaymentGatewayUnavailable, RazorpayGateway, RazorpaySettings
from app.payment_routes import get_payment_gateway
from test_auth import ORIGIN, make_patient, make_staff


class FakeRazorpayGateway:
    key_id = "rzp_test_testonly"

    def __init__(self) -> None:
        self.orders: dict[str, dict[str, object]] = {}
        self.fetch_calls = 0
        self.refund_calls = 0

    def create_order(self, amount_paise: int, currency: str, receipt: str) -> dict[str, object]:
        order_id = f"order_test_{uuid.uuid4().hex}"
        self.orders[order_id] = {"amount": amount_paise, "currency": currency, "receipt": receipt}
        return {"id": order_id}

    def verify_checkout_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        return signature == "test-valid-signature" and order_id in self.orders and bool(payment_id)

    def verify_webhook(self, raw_body: bytes, supplied_signature: str) -> bool:
        return supplied_signature == "test-valid-webhook-signature"

    def fetch_payment(self, payment_id: str) -> dict[str, object]:
        self.fetch_calls += 1
        order_id = next(iter(self.orders))
        order = self.orders[order_id]
        return {
            "id": payment_id,
            "order_id": order_id,
            "amount": order["amount"],
            "currency": order["currency"],
            "status": "captured",
        }

    def create_refund(self, payment_id: str, amount_paise: int, idempotency_key: str) -> dict[str, object]:
        self.refund_calls += 1
        return {"id": f"rfnd_test_{uuid.uuid4().hex}", "status": "pending"}

    def fetch_order_payments(self, order_id: str) -> list[dict[str, object]]:
        return []


def _create_invoice(auth_app, suffix: str, amount: str = "100.00") -> tuple[uuid.UUID, str]:
    with Session(auth_app.engine) as db:
        user, patient = make_patient(db, suffix)
        invoice = Invoice(
            invoice_number=f"SAMPLE ONLY invoice {suffix}",
            patient_id=patient.patient_id,
            total_amount=Decimal(amount),
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            net_amount=Decimal(amount),
            status="issued",
            issued_at=datetime.now(timezone.utc),
        )
        db.add(invoice)
        db.commit()
        return invoice.invoice_id, user.email


def _login_patient(auth_app, email: str) -> str:
    response = auth_app.client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": email, "password": "test-only-password-123"},
        headers=ORIGIN,
    )
    assert response.status_code == 200
    return response.json()["csrf_token"]


def _event(event_type: str, entity_type: str, entity: dict[str, object]) -> bytes:
    return json.dumps({
        "event": event_type,
        "payload": {entity_type: {"entity": entity}},
    }, separators=(",", ":")).encode()


def _send_event(client, event_id: str, event_type: str, entity_type: str, entity: dict[str, object], *, signed: bool = True):
    return client.post(
        "/api/v1/payments/webhooks/razorpay",
        content=_event(event_type, entity_type, entity),
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Event-Id": event_id,
            "X-Razorpay-Signature": "test-valid-webhook-signature" if signed else "unsigned",
        },
    )


def test_unsigned_and_failed_callbacks_never_mark_invoice_paid(auth_app, monkeypatch):
    gateway = FakeRazorpayGateway()
    monkeypatch.setitem(app.dependency_overrides, get_payment_gateway, lambda: gateway)
    invoice_id, email = _create_invoice(auth_app, "payment-fail")
    csrf = _login_patient(auth_app, email)
    checkout = auth_app.client.post(
        "/api/v1/payments/checkout",
        json={"invoice_id": str(invoice_id), "idempotency_key": "checkout-key-failure"},
        headers={**ORIGIN, "X-CSRF-Token": csrf},
    )
    assert checkout.status_code == 200
    order_id = checkout.json()["provider_order_id"]

    invalid_callback = auth_app.client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_test_unsigned",
            "razorpay_signature": "unsigned",
        },
        headers={**ORIGIN, "X-CSRF-Token": csrf},
    )
    assert invalid_callback.status_code == 401
    assert gateway.fetch_calls == 0

    unsigned_webhook = _send_event(
        auth_app.client,
        "evt_test_unsigned",
        "payment.captured",
        "payment",
        {"id": "pay_test_unsigned", "order_id": order_id, "amount": 10000, "currency": "INR", "status": "captured"},
        signed=False,
    )
    assert unsigned_webhook.status_code == 401

    failed = _send_event(
        auth_app.client,
        "evt_test_failed",
        "payment.failed",
        "payment",
        {"id": "pay_test_failed", "order_id": order_id, "amount": 10000, "currency": "INR", "status": "failed"},
    )
    assert failed.status_code == 200
    with Session(auth_app.engine) as db:
        invoice = db.get(Invoice, invoice_id)
        payment = db.scalar(select(Payment).where(Payment.invoice_id == invoice_id))
        assert invoice.status == "issued"
        assert payment.status == "failed"


def test_checkout_callback_needs_signature_and_server_captured_verification(auth_app, monkeypatch):
    gateway = FakeRazorpayGateway()
    monkeypatch.setitem(app.dependency_overrides, get_payment_gateway, lambda: gateway)
    invoice_id, email = _create_invoice(auth_app, "payment-callback")
    csrf = _login_patient(auth_app, email)
    checkout = auth_app.client.post(
        "/api/v1/payments/checkout",
        json={"invoice_id": str(invoice_id), "idempotency_key": "checkout-key-callback"},
        headers={**ORIGIN, "X-CSRF-Token": csrf},
    )
    order_id = checkout.json()["provider_order_id"]
    response = auth_app.client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_test_callback",
            "razorpay_signature": "test-valid-signature",
        },
        headers={**ORIGIN, "X-CSRF-Token": csrf},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "successful"
    assert gateway.fetch_calls == 1
    with Session(auth_app.engine) as db:
        assert db.get(Invoice, invoice_id).status == "paid"


def test_captured_webhook_is_idempotent_refunds_update_status_and_receipt_exists(auth_app, monkeypatch):
    gateway = FakeRazorpayGateway()
    monkeypatch.setitem(app.dependency_overrides, get_payment_gateway, lambda: gateway)
    invoice_id, email = _create_invoice(auth_app, "payment-refund")
    csrf = _login_patient(auth_app, email)
    checkout = auth_app.client.post(
        "/api/v1/payments/checkout",
        json={"invoice_id": str(invoice_id), "idempotency_key": "checkout-key-refund"},
        headers={**ORIGIN, "X-CSRF-Token": csrf},
    )
    assert checkout.status_code == 200
    payment_id = uuid.UUID(checkout.json()["payment_id"])
    order_id = checkout.json()["provider_order_id"]
    captured_entity = {
        "id": "pay_test_captured",
        "order_id": order_id,
        "amount": 10000,
        "currency": "INR",
        "status": "captured",
    }
    captured = _send_event(auth_app.client, "evt_test_captured", "payment.captured", "payment", captured_entity)
    duplicate = _send_event(auth_app.client, "evt_test_captured", "payment.captured", "payment", captured_entity)
    assert captured.status_code == duplicate.status_code == 200
    assert duplicate.json()["duplicate"] is True
    with Session(auth_app.engine) as db:
        assert db.get(Invoice, invoice_id).status == "paid"
        payment = db.get(Payment, payment_id)
        assert payment.status == "successful"
        assert payment.receipt_number

    partial_refund = _send_event(
        auth_app.client,
        "evt_test_refund_1",
        "refund.processed",
        "refund",
        {"id": "rfnd_test_1", "payment_id": "pay_test_captured", "amount": 2500, "status": "processed"},
    )
    assert partial_refund.status_code == 200
    with Session(auth_app.engine) as db:
        payment = db.get(Payment, payment_id)
        assert payment.status == "partially_refunded"
        assert Decimal(payment.refunded_amount) == Decimal("25.00")

    full_refund = _send_event(
        auth_app.client,
        "evt_test_refund_2",
        "refund.processed",
        "refund",
        {"id": "rfnd_test_2", "payment_id": "pay_test_captured", "amount": 7500, "status": "processed"},
    )
    assert full_refund.status_code == 200
    receipt = auth_app.client.get(f"/api/v1/payments/{payment_id}/receipt")
    assert receipt.status_code == 200
    assert receipt.json()["status"] == "refunded"
    with Session(auth_app.engine) as db:
        payment = db.get(Payment, payment_id)
        assert payment.status == "refunded"
        assert db.scalar(select(PaymentWebhookEvent).where(
            PaymentWebhookEvent.provider_event_id == "evt_test_captured",
        )) is not None
        assert len(db.scalars(select(PaymentRefund).where(PaymentRefund.payment_id == payment_id)).all()) == 2


def test_payment_credentials_are_environment_only_and_sandbox_scoped(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_from_environment")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "test-only-secret")
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "test-only-webhook-secret")
    monkeypatch.setenv("RAZORPAY_MODE", "sandbox")
    settings = RazorpaySettings.from_environment()
    settings.require_api_credentials()
    assert settings.key_id == "rzp_test_from_environment"
    gateway = RazorpayGateway(settings)
    body = b'{"event":"payment.captured"}'
    signature = hmac.new(b"test-only-webhook-secret", body, hashlib.sha256).hexdigest()
    assert gateway.verify_webhook(body, signature)
    assert not gateway.verify_webhook(body, "invalid-signature")
    callback_message = b"order_test|pay_test"
    callback_signature = hmac.new(b"test-only-secret", callback_message, hashlib.sha256).hexdigest()
    assert gateway.verify_checkout_signature("order_test", "pay_test", callback_signature)
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_live_blocked")
    try:
        RazorpaySettings.from_environment().require_api_credentials()
    except PaymentGatewayUnavailable:
        pass
    else:
        raise AssertionError("Live credentials must not be accepted in sandbox mode")


def test_receptionist_can_record_idempotent_offline_payment_without_card_details(auth_app):
    invoice_id, _ = _create_invoice(auth_app, "offline-payment")
    with Session(auth_app.engine) as db:
        receptionist, _, secret = make_staff(db, "receptionist", "offline-payment")
        db.commit()
        email = receptionist.email
    now_counter = int(datetime.now(timezone.utc).timestamp() // 30)
    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={
            "email_or_phone": email,
            "password": "test-only-password-123",
            "totp_code": _totp_at(secret, now_counter),
        },
        headers=ORIGIN,
    )
    assert login.status_code == 200
    payload = {
        "invoice_id": str(invoice_id),
        "amount": "100.00",
        "method": "cash",
        "idempotency_key": "offline-payment-key-1",
    }
    headers = {**ORIGIN, "X-CSRF-Token": login.json()["csrf_token"]}
    first = auth_app.client.post("/api/v1/payments/offline", json=payload, headers=headers)
    retry = auth_app.client.post("/api/v1/payments/offline", json=payload, headers=headers)
    assert first.status_code == 201
    assert retry.status_code == 201
    assert first.json()["payment_id"] == retry.json()["payment_id"]
    assert first.json()["receipt_number"]
    assert first.json()["status"] == "successful"
    assert first.json()["payment_method"] == "offline"
    assert first.json()["offline_method"] == "cash"
    with Session(auth_app.engine) as db:
        payment = db.get(Payment, uuid.UUID(first.json()["payment_id"]))
        assert payment is not None
        assert not any(token in column.name.lower() for column in Payment.__table__.columns for token in ("card", "cvv", "pan"))


def test_staff_invoice_issue_assigns_server_generated_reference(auth_app):
    with Session(auth_app.engine) as db:
        _, patient = make_patient(db, "invoice-issue")
        patient_id = patient.patient_id
        receptionist, _, secret = make_staff(db, "receptionist", "invoice-issue")
        db.commit()
        email = receptionist.email
    now_counter = int(datetime.now(timezone.utc).timestamp() // 30)
    login = auth_app.client.post(
        "/api/v1/auth/login",
        json={
            "email_or_phone": email,
            "password": "test-only-password-123",
            "totp_code": _totp_at(secret, now_counter),
        },
        headers=ORIGIN,
    )
    assert login.status_code == 200
    issued = auth_app.client.post(
        "/api/v1/invoices",
        json={
            "patient_id": str(patient_id),
            "total_amount": "100.00",
            "tax_amount": "0.00",
            "discount_amount": "0.00",
            "net_amount": "100.00",
        },
        headers={**ORIGIN, "X-CSRF-Token": login.json()["csrf_token"]},
    )
    assert issued.status_code == 201
    assert issued.json()["invoice_number"].startswith("INV-")
    assert issued.json()["status"] == "issued"
    assert issued.json()["patient_id"] == str(patient_id)
