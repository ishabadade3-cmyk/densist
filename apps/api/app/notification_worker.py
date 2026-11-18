"""One-shot notification dispatcher; run repeatedly from an external job scheduler."""

from __future__ import annotations

import os
from importlib import import_module

from app.database import _session_factory
from app.notification_service import NotificationProviders, UnconfiguredProviders, process_due_notifications, schedule_appointment_reminders


def load_providers() -> NotificationProviders:
    """Load deployment-owned adapter factory from `module:callable`; no provider is guessed."""
    target = os.getenv("NOTIFICATION_PROVIDER_FACTORY", "").strip()
    if not target:
        return UnconfiguredProviders()
    module_name, separator, callable_name = target.partition(":")
    if not separator or not module_name or not callable_name:
        raise SystemExit("NOTIFICATION_PROVIDER_FACTORY must use module:callable syntax")
    factory = getattr(import_module(module_name), callable_name)
    return factory()


def main() -> int:
    with _session_factory()() as db:
        lead = os.getenv("NOTIFICATION_REMINDER_LEAD_MINUTES")
        template_key = os.getenv("NOTIFICATION_REMINDER_TEMPLATE_KEY")
        if lead and template_key:
            schedule_appointment_reminders(db, lead_minutes=int(lead), template_key=template_key)
        result = process_due_notifications(
            db,
            load_providers(),
            batch_size=max(1, int(os.getenv("NOTIFICATION_BATCH_SIZE", "50"))),
        )
    # Counts contain no recipients, message content or patient identifiers.
    print(" ".join(f"{key}={value}" for key, value in result.items()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
