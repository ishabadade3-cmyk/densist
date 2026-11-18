from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Consent, Notification, NotificationAttempt, NotificationTemplate, StaffTask
from app.notification_service import (
    DeliveryReceipt,
    enqueue_notification,
    process_due_notifications,
    record_delivery_status,
)
from test_auth import make_patient


class FakeSender:
    def __init__(self, *, fail: bool = False, delivered: bool = True) -> None:
        self.fail = fail
        self.delivered = delivered
        self.sent: list[tuple[str, str]] = []

    def send(self, destination, *args, **kwargs):
        if self.fail:
            raise RuntimeError("provider failure must not leak recipient or content")
        self.sent.append((destination, str(args[0] if args else kwargs)))
        return DeliveryReceipt(provider_message_id=f"provider-{len(self.sent)}", delivered=self.delivered)


class FakeProviders:
    def __init__(self, *, fail: bool = False, delivered: bool = True) -> None:
        self.email = FakeSender(fail=fail, delivered=delivered)
        self.sms = FakeSender(fail=fail, delivered=delivered)
        self.whatsapp = FakeSender(fail=fail, delivered=delivered)


def _records(db: Session, suffix: str, *, channel: str = "email", purpose: str = "care_delivery"):
    user, patient = make_patient(db, suffix)
    db.add(Consent(
        patient_id=patient.patient_id,
        purpose=purpose,
        channel=channel,
        status="granted",
        policy_version="SAMPLE_ONLY_policy",
        recorded_at=datetime.now(timezone.utc),
    ))
    template = NotificationTemplate(
        template_key=f"sample.{suffix}",
        channel=channel,
        purpose=purpose,
        subject="SAMPLE ONLY notice" if channel == "email" else None,
        body="SAMPLE ONLY update {{appointment_time}}" if purpose == "appointment_reminders" else "SAMPLE ONLY update",
        variable_names=["appointment_time"] if purpose == "appointment_reminders" else [],
        variable_types={"appointment_time": "alphanumeric"} if channel == "sms" and purpose == "appointment_reminders" else {},
        is_active=True,
        is_provider_approved=True,
        provider_template_id="SAMPLE_ONLY_DLT_TEMPLATE" if channel == "sms" else None,
        provider_sender_id="SAMPLE_ONLY" if channel == "sms" else None,
    )
    db.add(template)
    db.flush()
    return user, patient, template


def test_enqueue_requires_matching_channel_and_purpose_consent(auth_app):
    with Session(auth_app.engine) as db:
        user, _patient = make_patient(db, "notification-no-consent")
        template = NotificationTemplate(
            template_key="sample.no-consent",
            channel="email",
            purpose="marketing",
            subject="SAMPLE ONLY",
            body="SAMPLE ONLY notice",
            variable_names=[],
            is_active=True,
        )
        db.add(template)
        db.commit()
        with pytest.raises(PermissionError, match="CONSENT_REQUIRED"):
            enqueue_notification(
                db,
                recipient_user_id=user.user_id,
                template_key=template.template_key,
                idempotency_key="notification-no-consent",
            )


def test_worker_rechecks_consent_immediately_before_send(auth_app):
    with Session(auth_app.engine) as db:
        user, patient, template = _records(db, "notification-revoked")
        queued = enqueue_notification(
            db,
            recipient_user_id=user.user_id,
            template_key=template.template_key,
            idempotency_key="notification-revoked-key",
        )
        db.add(Consent(
            patient_id=patient.patient_id,
            purpose="care_delivery",
            channel="email",
            status="revoked",
            policy_version="SAMPLE_ONLY_policy",
            recorded_at=datetime.now(timezone.utc) + timedelta(seconds=1),
        ))
        db.commit()
        providers = FakeProviders()
        result = process_due_notifications(db, providers)
        assert result["blocked"] == 1
        assert providers.email.sent == []
        assert db.get(Notification, queued.notification_id).delivery_status == "consent_blocked"


def test_retry_exhaustion_creates_staff_task_without_message_or_recipient_data(auth_app):
    with Session(auth_app.engine) as db:
        user, patient, template = _records(db, "notification-failure")
        queued = enqueue_notification(
            db,
            recipient_user_id=user.user_id,
            template_key=template.template_key,
            idempotency_key="notification-failure-key",
        )
        queued.max_attempts = 2
        db.commit()
        providers = FakeProviders(fail=True)
        first = process_due_notifications(db, providers)
        assert first["failed"] == 0
        queued = db.get(Notification, queued.notification_id)
        second = process_due_notifications(db, providers, now=queued.next_attempt_at + timedelta(seconds=1))
        assert second["failed"] == 1
        assert second["staff_tasks"] == 1
        task = db.scalar(select(StaffTask).where(StaffTask.notification_id == queued.notification_id))
        assert task is not None
        assert task.patient_id == patient.patient_id
        assert task.description_code == "notification_delivery_retries_exhausted"
        assert "SAMPLE ONLY" not in task.description_code
        assert db.scalar(select(NotificationAttempt).where(NotificationAttempt.notification_id == queued.notification_id)) is not None


def test_provider_delivery_status_hook_records_delivery(auth_app):
    with Session(auth_app.engine) as db:
        user, _patient, template = _records(db, "notification-delivery")
        queued = enqueue_notification(
            db,
            recipient_user_id=user.user_id,
            template_key=template.template_key,
            idempotency_key="notification-delivery-key",
        )
        db.commit()
        result = process_due_notifications(db, FakeProviders(delivered=False))
        assert result["sent"] == 1
        assert db.get(Notification, queued.notification_id).delivery_status == "sent"
        assert record_delivery_status(db, provider_message_id="provider-1", delivered=True)
        assert db.get(Notification, queued.notification_id).delivery_status == "delivered"
        attempt = db.scalar(select(NotificationAttempt).where(
            NotificationAttempt.notification_id == queued.notification_id,
        ))
        assert attempt.outcome == "delivered"


def test_sms_needs_approved_dlt_binding_and_consent_is_channel_specific(auth_app):
    with Session(auth_app.engine) as db:
        user, patient, template = _records(db, "notification-sms", channel="sms", purpose="appointment_reminders")
        db.add(Consent(
            patient_id=patient.patient_id,
            purpose="appointment_reminders",
            channel="email",
            status="granted",
            policy_version="SAMPLE_ONLY_policy",
        ))
        db.commit()
        with pytest.raises(PermissionError, match="CONSENT_REQUIRED"):
            enqueue_notification(
                db,
                recipient_user_id=user.user_id,
                template_key=template.template_key,
                idempotency_key="notification-sms-consent-key",
                variables={"appointment_time": "09AM 2030"},
            )
        db.add(Consent(
            patient_id=patient.patient_id,
            purpose="appointment_reminders",
            channel="sms",
            status="granted",
            policy_version="SAMPLE_ONLY_policy",
        ))
        db.commit()
        assert enqueue_notification(
            db,
            recipient_user_id=user.user_id,
            template_key=template.template_key,
            idempotency_key="notification-sms-consent-key2",
            variables={"appointment_time": "09AM 2030"},
        )
        template.is_provider_approved = False
        db.commit()
        with pytest.raises(PermissionError, match="DLT_TEMPLATE_NOT_APPROVED"):
            enqueue_notification(
                db,
                recipient_user_id=user.user_id,
                template_key=template.template_key,
                idempotency_key="notification-sms-unapproved-key",
                variables={"appointment_time": "09AM 2030"},
            )
