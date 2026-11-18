"""OTP delivery boundary; console delivery is development-only."""

from __future__ import annotations

import logging
from typing import Protocol

from app.auth_settings import AuthSettings

logger = logging.getLogger("dental.auth.otp")


class OTPProvider(Protocol):
    def send_code(self, destination: str, code: str, purpose: str) -> None: ...


class ConsoleOTPProvider:
    """Emit codes without destinations or account identifiers for local development."""

    def send_code(self, destination: str, code: str, purpose: str) -> None:
        del destination
        logger.warning("DEVELOPMENT ONLY OTP (%s): %s", purpose, code)


def get_otp_provider(settings: AuthSettings) -> OTPProvider:
    if settings.otp_provider == "console" and settings.environment != "production":
        return ConsoleOTPProvider()
    raise RuntimeError("Configured OTP provider is unavailable")
