"""Security settings; production secrets must be supplied outside source control."""

from __future__ import annotations

import os
from dataclasses import dataclass

from cryptography.fernet import Fernet


@dataclass(frozen=True)
class AuthSettings:
    session_ttl_seconds: int
    otp_ttl_seconds: int
    otp_max_attempts: int
    login_limit: int
    otp_request_limit: int
    rate_window_seconds: int
    password_min_length: int
    otp_pepper: str
    rate_limit_secret: str
    mfa_encryption_key: str | None
    environment: str
    otp_provider: str
    consent_policy_version: str | None
    trusted_origins: frozenset[str]

    @classmethod
    def from_environment(cls) -> "AuthSettings":
        # These values are development defaults only; production requires explicit policy.
        return cls(
            session_ttl_seconds=int(os.getenv("AUTH_SESSION_TTL_SECONDS", "3600")),
            otp_ttl_seconds=int(os.getenv("AUTH_OTP_TTL_SECONDS", "300")),
            otp_max_attempts=int(os.getenv("AUTH_OTP_MAX_ATTEMPTS", "5")),
            login_limit=int(os.getenv("AUTH_LOGIN_ATTEMPTS", "5")),
            otp_request_limit=int(os.getenv("AUTH_OTP_REQUESTS", "3")),
            rate_window_seconds=int(os.getenv("AUTH_RATE_WINDOW_SECONDS", "900")),
            password_min_length=int(os.getenv("AUTH_PASSWORD_MIN_LENGTH", "12")),
            otp_pepper=os.getenv("AUTH_OTP_PEPPER", "development-only-otp-pepper"),
            rate_limit_secret=os.getenv("AUTH_RATE_LIMIT_SECRET", "development-only-rate-limit-secret"),
            mfa_encryption_key=os.getenv("MFA_ENCRYPTION_KEY"),
            environment=os.getenv("APP_ENV", "development"),
            otp_provider=os.getenv("OTP_PROVIDER", "console"),
            consent_policy_version=os.getenv("CONSENT_POLICY_VERSION"),
            trusted_origins=frozenset(
                origin.strip().rstrip("/")
                for origin in os.getenv(
                    "AUTH_TRUSTED_ORIGINS",
                    "http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000,https://127.0.0.1:3000",
                ).split(",")
                if origin.strip()
            ),
        )


def validate_auth_settings(settings: AuthSettings) -> None:
    if settings.environment == "production":
        required_policy = (
            "AUTH_SESSION_TTL_SECONDS",
            "AUTH_OTP_TTL_SECONDS",
            "AUTH_OTP_MAX_ATTEMPTS",
            "AUTH_LOGIN_ATTEMPTS",
            "AUTH_OTP_REQUESTS",
            "AUTH_RATE_WINDOW_SECONDS",
            "AUTH_PASSWORD_MIN_LENGTH",
            "AUTH_TRUSTED_ORIGINS",
        )
        missing_policy = [name for name in required_policy if not os.getenv(name)]
        if missing_policy:
            raise RuntimeError(f"Authentication policy must be configured: {', '.join(missing_policy)}")
        if settings.otp_provider == "console":
            raise RuntimeError("The console OTP provider is not permitted in production")
        if len(settings.otp_pepper) < 32 or settings.otp_pepper == "development-only-otp-pepper":
            raise RuntimeError("AUTH_OTP_PEPPER must be a unique secret of at least 32 characters")
        if len(settings.rate_limit_secret) < 32 or settings.rate_limit_secret == "development-only-rate-limit-secret":
            raise RuntimeError("AUTH_RATE_LIMIT_SECRET must be a unique secret of at least 32 characters")
        if not settings.mfa_encryption_key:
            raise RuntimeError("MFA_ENCRYPTION_KEY must be configured in production")
        try:
            Fernet(settings.mfa_encryption_key.encode("ascii"))
        except (ValueError, TypeError, UnicodeEncodeError):
            raise RuntimeError("MFA_ENCRYPTION_KEY must be a valid Fernet key") from None
    if min(
        settings.session_ttl_seconds,
        settings.otp_ttl_seconds,
        settings.otp_max_attempts,
        settings.login_limit,
        settings.otp_request_limit,
        settings.rate_window_seconds,
        settings.password_min_length,
    ) < 1:
        raise RuntimeError("Authentication settings must be positive")
