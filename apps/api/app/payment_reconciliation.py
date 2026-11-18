"""CLI entry point for the scheduled payment reconciliation job.

Schedule `python -m app.payment_reconciliation` using the deployment's job runner.
The command is intentionally one-shot and emits counts only, never payment or patient IDs.
"""

from __future__ import annotations

import os

from app.database import _session_factory
from app.payment_gateway import PaymentGatewayUnavailable, get_payment_gateway
from app.payment_routes import reconcile_pending_payments


def main() -> int:
    older_than = int(os.getenv("PAYMENT_RECONCILE_AFTER_SECONDS", "600"))
    if older_than < 1:
        raise SystemExit("PAYMENT_RECONCILE_AFTER_SECONDS must be positive")
    try:
        with _session_factory()() as db:
            counts = reconcile_pending_payments(
                db,
                get_payment_gateway(),
                older_than_seconds=older_than,
            )
    except PaymentGatewayUnavailable:
        raise SystemExit("Payment provider is not configured or reachable") from None
    print(f"checked={counts['checked']} successful={counts['successful']} failed={counts['failed']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
