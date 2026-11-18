"""Consent-gated notification queue and provider-neutral delivery worker (FR-039–FR-043)."""

from __future__ import annotations

import os
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Appointment, Consent, Notification, NotificationAttempt, NotificationTemplate, Patient, StaffTask, User

_VARIABLE = re.compile(r"\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}")


@dataclass(frozen=True)
class DeliveryReceipt:
    provider_message_id: str | None = None
    delivered: bool = False


class EmailProvider(Protocol):
    def send(self, destination: str, subject: str, body: str) -> DeliveryReceipt: ...


class SMSProvider(Protocol):
    def send(self, destination: str, body: str, *, dlt_template_id: str, sender_id: str) -> DeliveryReceipt: ...


class WhatsAppProvider(Protocol):
    def send(self, destination: str, body: str, *, approved_template_id: str) -> DeliveryReceipt: ...


class NotificationProviders(Protocol):
    email: EmailProvider
    sms: SMSProvider
    whatsapp: WhatsAppProvider


class ProviderNotConfigured(Exception):
    """A provider adapter has not been selected/configured; never includes message data."""


class _UnavailableProvider:
    def send(self, *_args: Any, **_kwargs: Any) -> DeliveryReceipt:
        raise ProviderNotConfigured


@dataclass(frozen=True)
class UnconfiguredProviders:
    email: EmailProvider = _UnavailableProvider()
    sms: SMSProvider = _UnavailableProvider()
    whatsapp: WhatsAppProvider = _UnavailableProvider()


def _latest_consent(db: Session, patient_id: uuid.UUID, channel: str, purpose: str) -> bool:
    record = db.scalar(
        select(Consent)
        .where(Consent.patient_id == patient_id, Consent.channel == channel, Consent.purpose == purpose)
        .order_by(Consent.recorded_at.desc(), Consent.consent_id.desc())
        .limit(1)
    )
    return bool(record and record.status == "granted")


def _render(template: NotificationTemplate, variables: dict[str, Any]) -> str:
    expected = set(template.variable_names or [])
    if set(variables) - expected:
        raise ValueError("UNDECLARED_TEMPLATE_VARIABLE")
    required = set(_VARIABLE.findall(template.body))
    if required != expected or not required <= set(variables):
        raise ValueError("TEMPLATE_VARIABLE_MISMATCH")
    if template.purpose == "marketing" and expected:
        raise ValueError("MARKETING_TEMPLATES_MUST_NOT_MIX_DYNAMIC_CONTENT")
    if template.channel == "sms" and set(template.variable_types or {}) != expected:
        raise ValueError("SMS_VARIABLE_TYPES_REQUIRED")
    if template.channel == "sms" and re.search(r"\{\{[a-zA-Z][a-zA-Z0-9_]*\}\}\s*\{\{", template.body):
        raise ValueError("DLT_VARIABLES_MUST_BE_SEPARATED")
    rendered = template.body
    variable_chars = 0
    for key in expected:
        value = variables[key]
        if not isinstance(value, (str, int, float)):
            raise ValueError("INVALID_TEMPLATE_VARIABLE")
        text_value = str(value)
        if len(text_value) > 30 or "\n" in text_value or "\r" in text_value:
            raise ValueError("TEMPLATE_VARIABLE_TOO_LONG")
        if template.channel == "sms" and not re.fullmatch(r"[A-Za-z0-9 .,'/:+-]*", text_value):
            raise ValueError("INVALID_SMS_TEMPLATE_VARIABLE")
        if template.channel == "sms" and template.variable_types[key] == "numeric" and not text_value.isdigit():
            raise ValueError("DLT_NUMERIC_VARIABLE_REQUIRED")
        rendered = rendered.replace("{{" + key + "}}", text_value)
    variable_chars = sum(len(str(variables[key])) for key in _VARIABLE.findall(template.body))
    if template.channel == "sms" and rendered and variable_chars / len(rendered) >= 0.4:
        raise ValueError("SMS_VARIABLE_CONTENT_TOO_LARGE")
    if template.channel == "sms" and re.search(r"(?:https?://|www\.)", rendered, re.IGNORECASE):
        raise ValueError("SMS_URL_NOT_CONFIRMED_DLT_WHITELIST")
    return rendered


def enqueue_notification(
    db: Session,
    *,
    recipient_user_id: uuid.UUID,
    template_key: str,
    idempotency_key: str,
    variables: dict[str, Any] | None = None,
    resource_id: uuid.UUID | None = None,
    scheduled_at: datetime | None = None,
) -> Notification:
    if len(idempotency_key) < 8 or len(idempotency_key) > 128:
        raise ValueError("INVALID_IDEMPOTENCY_KEY")
    if scheduled_at is not None and (scheduled_at.tzinfo is None or scheduled_at.utcoffset() is None):
        raise ValueError("SCHEDULED_AT_REQUIRES_TIMEZONE")
    user = db.get(User, recipient_user_id)
    template = db.scalar(select(NotificationTemplate).where(
        NotificationTemplate.template_key == template_key,
        NotificationTemplate.is_active.is_(True),
    ))
    if user is None:
        raise LookupError("RECIPIENT_NOT_FOUND")
    if template is None:
        raise LookupError("TEMPLATE_NOT_FOUND")
    patient = db.scalar(select(Patient).where(Patient.user_id == user.user_id))
    if patient is None or not _latest_consent(db, patient.patient_id, template.channel, template.purpose):
        raise PermissionError("CONSENT_REQUIRED")
    if template.channel == "sms" and (not template.is_provider_approved or not template.provider_template_id or not template.provider_sender_id):
        raise PermissionError("DLT_TEMPLATE_NOT_APPROVED")
    if template.channel == "whatsapp" and not template.is_provider_approved:
        raise PermissionError("WHATSAPP_TEMPLATE_NOT_APPROVED")
    if template.purpose == "marketing" and not _latest_consent(db, patient.patient_id, template.channel, "marketing"):
        raise PermissionError("MARKETING_CONSENT_REQUIRED")
    data = variables or {}
    _render(template, data)
    existing = db.scalar(select(Notification).where(Notification.idempotency_key == idempotency_key))
    if existing is not None:
        if existing.user_id != recipient_user_id or existing.template_id != template.template_id:
            raise ValueError("IDEMPOTENCY_KEY_REUSED")
        return existing
    row = Notification(
        user_id=user.user_id,
        channel=template.channel,
        purpose=template.purpose,
        template_id=template.template_id,
        resource_id=resource_id,
        idempotency_key=idempotency_key,
        variables=data,
        delivery_status="queued",
        scheduled_at=scheduled_at or datetime.now(timezone.utc),
        next_attempt_at=scheduled_at or datetime.now(timezone.utc),
    )
    db.add(row)
    db.flush()
    return row


def _destination(user: User, channel: str) -> str:
    destination = user.email if channel == "email" else user.phone
    if not destination:
        raise LookupError("RECIPIENT_CHANNEL_UNAVAILABLE")
    return destination


def _staff_followup(db: Session, notification: Notification, patient_id: uuid.UUID) -> None:
    if db.scalar(select(StaffTask.task_id).where(StaffTask.notification_id == notification.notification_id)) is None:
        db.add(StaffTask(
            task_type="notification_delivery",
            patient_id=patient_id,
            notification_id=notification.notification_id,
            status="open",
            description_code="notification_delivery_retries_exhausted",
        ))


def process_due_notifications(
    db: Session,
    providers: NotificationProviders,
    *,
    batch_size: int = 50,
    now: datetime | None = None,
) -> dict[str, int]:
    current = now or datetime.now(timezone.utc)
    rows = db.scalars(
        select(Notification)
        .where(
            Notification.delivery_status == "queued",
            Notification.scheduled_at <= current,
            (Notification.next_attempt_at.is_(None) | (Notification.next_attempt_at <= current)),
            Notification.template_id.is_not(None),
        )
        .order_by(Notification.scheduled_at)
        .with_for_update(skip_locked=True)
        .limit(batch_size)
    ).all()
    result = {"checked": 0, "sent": 0, "blocked": 0, "failed": 0, "staff_tasks": 0}
    retry_base = max(1, int(os.getenv("NOTIFICATION_RETRY_BASE_SECONDS", "60")))
    for row in rows:
        result["checked"] += 1
        template = db.get(NotificationTemplate, row.template_id)
        user = db.get(User, row.user_id)
        patient = db.scalar(select(Patient).where(Patient.user_id == row.user_id))
        if template is None or user is None or patient is None:
            row.delivery_status = "failed"
            row.last_error_code = "RECIPIENT_OR_TEMPLATE_UNAVAILABLE"
            result["failed"] += 1
            continue
        # Re-check immediately before every provider call; old or channel-less consent never authorizes a send.
        if not _latest_consent(db, patient.patient_id, row.channel, row.purpose):
            row.delivery_status = "consent_blocked"
            row.last_error_code = "CONSENT_REVOKED_OR_MISSING"
            result["blocked"] += 1
            continue
        if row.purpose == "marketing" and not _latest_consent(db, patient.patient_id, row.channel, "marketing"):
            row.delivery_status = "consent_blocked"
            row.last_error_code = "MARKETING_CONSENT_REVOKED_OR_MISSING"
            result["blocked"] += 1
            continue
        if row.purpose == "appointment_reminders" and row.resource_id:
            appointment = db.get(Appointment, row.resource_id)
            if appointment is None or appointment.status not in {"requested", "confirmed"}:
                row.delivery_status = "failed"
                row.last_error_code = "APPOINTMENT_NO_LONGER_ACTIVE"
                result["failed"] += 1
                continue
        try:
            body = _render(template, row.variables or {})
            destination = _destination(user, row.channel)
            sender = getattr(providers, row.channel)
            if row.channel == "email":
                if not template.subject:
                    raise ValueError("EMAIL_SUBJECT_REQUIRED")
                receipt = sender.send(destination, template.subject, body)
            elif row.channel == "sms":
                if not template.is_provider_approved or not template.provider_template_id or not template.provider_sender_id:
                    raise PermissionError("DLT_TEMPLATE_NOT_APPROVED")
                receipt = sender.send(destination, body, dlt_template_id=template.provider_template_id, sender_id=template.provider_sender_id)
            elif row.channel == "whatsapp":
                if not template.is_provider_approved or not template.provider_template_id:
                    raise PermissionError("WHATSAPP_TEMPLATE_NOT_APPROVED")
                receipt = sender.send(destination, body, approved_template_id=template.provider_template_id)
            else:
                raise ValueError("UNSUPPORTED_CHANNEL")
            row.attempt_count += 1
            row.message_reference = receipt.provider_message_id
            row.delivery_status = "delivered" if receipt.delivered else "sent"
            row.delivered_at = current if receipt.delivered else None
            row.next_attempt_at = None
            row.last_error_code = None
            db.add(NotificationAttempt(
                notification_id=row.notification_id,
                attempt_number=row.attempt_count,
                outcome="delivered" if receipt.delivered else "accepted",
                provider_message_id=receipt.provider_message_id,
                attempted_at=current,
            ))
            result["sent"] += 1
        except Exception:  # Provider exception text may contain recipients or message content.
            row.attempt_count += 1
            error_code = "PROVIDER_ERROR"
            row.last_error_code = error_code
            db.add(NotificationAttempt(
                notification_id=row.notification_id,
                attempt_number=row.attempt_count,
                outcome="failed",
                error_code=error_code,
                attempted_at=current,
            ))
            if row.attempt_count >= row.max_attempts:
                row.delivery_status = "failed"
                _staff_followup(db, row, patient.patient_id)
                result["failed"] += 1
                result["staff_tasks"] += 1
            else:
                row.next_attempt_at = current + timedelta(seconds=retry_base * (2 ** (row.attempt_count - 1)))
    db.commit()
    return result


def record_delivery_status(
    db: Session,
    *,
    provider_message_id: str,
    delivered: bool,
    provider_error_code: str | None = None,
) -> bool:
    """Provider callback hook; stores status codes only and is safe to call repeatedly."""
    row = db.scalar(select(Notification).where(Notification.message_reference == provider_message_id).with_for_update())
    if row is None or row.delivery_status in {"delivered", "failed", "consent_blocked"}:
        return False
    now = datetime.now(timezone.utc)
    if delivered:
        row.delivery_status = "delivered"
        row.delivered_at = now
        row.next_attempt_at = None
        attempt = db.scalar(select(NotificationAttempt).where(
            NotificationAttempt.notification_id == row.notification_id,
        ).order_by(NotificationAttempt.attempt_number.desc()).limit(1))
        if attempt:
            attempt.outcome = "delivered"
    else:
        # Ignore provider-supplied text; it may contain personal data.
        row.last_error_code = "DELIVERY_FAILED"
        row.delivery_status = "queued"
        if row.attempt_count >= row.max_attempts:
            row.delivery_status = "failed"
            patient = db.scalar(select(Patient).join(User, Patient.user_id == User.user_id).where(User.user_id == row.user_id))
            if patient:
                _staff_followup(db, row, patient.patient_id)
        else:
            retry_base = max(1, int(os.getenv("NOTIFICATION_RETRY_BASE_SECONDS", "60")))
            row.next_attempt_at = now + timedelta(seconds=retry_base * (2 ** max(0, row.attempt_count - 1)))
    db.commit()
    return True


def schedule_appointment_reminders(db: Session, *, lead_minutes: int, template_key: str) -> int:
    if lead_minutes < 1:
        raise ValueError("REMINDER_LEAD_MINUTES_MUST_BE_POSITIVE")
    now = datetime.now(timezone.utc)
    target = now + timedelta(minutes=lead_minutes)
    appointments = db.scalars(select(Appointment).where(
        Appointment.status.in_(("requested", "confirmed")),
        Appointment.start_time > now,
        Appointment.start_time <= target,
    )).all()
    template = db.scalar(select(NotificationTemplate).where(
        NotificationTemplate.template_key == template_key,
        NotificationTemplate.is_active.is_(True),
    ))
    # The task has no approved clinic timezone or per-appointment copy, so this scheduler
    # uses only a reviewed static template and never invents appointment-local time text.
    if template is None or template.purpose != "appointment_reminders" or template.variable_names:
        return 0
    count = 0
    for appointment in appointments:
        user_id = db.scalar(select(Patient.user_id).where(Patient.patient_id == appointment.patient_id))
        if user_id is None:
            continue
        try:
            enqueue_notification(
                db,
                recipient_user_id=user_id,
                template_key=template_key,
                idempotency_key=f"appointment:{appointment.appointment_id}:reminder:{template_key}",
                resource_id=appointment.appointment_id,
                variables={},
                scheduled_at=appointment.start_time - timedelta(minutes=lead_minutes),
            )
            count += 1
        except (PermissionError, ValueError):
            # No consent, bad template configuration or unapproved provider template means no send.
            continue
    db.commit()
    return count
