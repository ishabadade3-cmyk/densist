"""Razorpay server integration. Credentials are read only from process environment."""

from __future__ import annotations

import hashlib
import hmac
import os
from dataclasses import dataclass
from typing import Any

import httpx

RAZORPAY_API = "https://api.razorpay.com/v1"


@dataclass(frozen=True)
class RazorpaySettings:
    key_id: str
    key_secret: str
    webhook_secret: str
    mode: str

    @classmethod
    def from_environment(cls) -> "RazorpaySettings":
        return cls(
            key_id=os.getenv("RAZORPAY_KEY_ID", "").strip(),
            key_secret=os.getenv("RAZORPAY_KEY_SECRET", "").strip(),
            webhook_secret=os.getenv("RAZORPAY_WEBHOOK_SECRET", "").strip(),
            mode=os.getenv("RAZORPAY_MODE", "sandbox").strip().lower(),
        )

    def require_api_credentials(self) -> None:
        if not self.key_id or not self.key_secret:
            raise PaymentGatewayUnavailable
        if self.mode not in {"sandbox", "live"}:
            raise PaymentGatewayUnavailable
        if self.mode == "sandbox" and not self.key_id.startswith("rzp_test_"):
            raise PaymentGatewayUnavailable
        if self.mode == "live" and os.getenv("APP_ENV", "development") != "production":
            raise PaymentGatewayUnavailable

    def require_webhook_secret(self) -> None:
        if not self.webhook_secret:
            raise PaymentGatewayUnavailable


class PaymentGatewayUnavailable(Exception):
    """Credentials missing or provider could not be reached; message carries no secrets."""


class RazorpayGateway:
    def __init__(self, settings: RazorpaySettings, *, timeout_seconds: float = 10.0) -> None:
        self.settings = settings
        self.timeout_seconds = timeout_seconds

    @property
    def key_id(self) -> str:
        self.settings.require_api_credentials()
        return self.settings.key_id

    def verify_webhook(self, raw_body: bytes, supplied_signature: str) -> bool:
        self.settings.require_webhook_secret()
        if not supplied_signature:
            return False
        expected = hmac.new(
            self.settings.webhook_secret.encode("utf-8"), raw_body, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, supplied_signature)

    def verify_checkout_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        self.settings.require_api_credentials()
        message = f"{order_id}|{payment_id}".encode("utf-8")
        expected = hmac.new(
            self.settings.key_secret.encode("utf-8"), message, hashlib.sha256
        ).hexdigest()
        return bool(signature) and hmac.compare_digest(expected, signature)

    def create_order(self, amount_paise: int, currency: str, receipt: str) -> dict[str, Any]:
        return self._request(
            "POST", "/orders", json={"amount": amount_paise, "currency": currency, "receipt": receipt}
        )

    def fetch_payment(self, payment_id: str) -> dict[str, Any]:
        return self._request("GET", f"/payments/{payment_id}")

    def fetch_order_payments(self, order_id: str) -> list[dict[str, Any]]:
        result = self._request("GET", f"/orders/{order_id}/payments")
        items = result.get("items")
        return items if isinstance(items, list) else []

    def create_refund(
        self, payment_id: str, amount_paise: int, idempotency_key: str
    ) -> dict[str, Any]:
        return self._request(
            "POST",
            f"/payments/{payment_id}/refund",
            json={"amount": amount_paise},
            headers={"X-Refund-Idempotency": idempotency_key},
        )

    def _request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        self.settings.require_api_credentials()
        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                response = client.request(
                    method,
                    f"{RAZORPAY_API}{path}",
                    auth=(self.settings.key_id, self.settings.key_secret),
                    **kwargs,
                )
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict):
                raise PaymentGatewayUnavailable
            return payload
        except (httpx.HTTPError, ValueError) as exc:
            raise PaymentGatewayUnavailable from exc


def get_payment_gateway() -> RazorpayGateway:
    return RazorpayGateway(RazorpaySettings.from_environment())
