"""Authentication primitives shared by routes and tests."""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import struct
import time
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from argon2.low_level import Type
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException, Request, status
from sqlalchemy import case
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.auth_settings import AuthSettings
from app.models import AuthRateLimit

password_hasher = PasswordHasher(type=Type.ID)


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(encoded_hash: str | None, password: str) -> bool:
    if not encoded_hash:
        return False
    try:
        return password_hasher.verify(encoded_hash, password)
    except (InvalidHashError, VerificationError, VerifyMismatchError):
        return False


def hash_session_token(token: str) -> bytes:
    return hashlib.sha256(token.encode("utf-8")).digest()


def csrf_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def hmac_digest(secret: str, value: str) -> str:
    return hmac.new(secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


def normalized_identifier(value: str) -> str:
    normalized = value.strip()
    return normalized.lower() if "@" in normalized else normalized


def rate_key(settings: AuthSettings, request: Request, action: str, identifier: str) -> str:
    source = request.client.host if request.client else "unknown"
    return hmac_digest(settings.rate_limit_secret, f"{action}:{normalized_identifier(identifier)}:{source}")


def enforce_rate_limit(
    db: Session,
    *,
    subject_hash: str,
    action: str,
    maximum: int,
    window_seconds: int,
) -> None:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=window_seconds)
    next_attempts = case(
        (AuthRateLimit.window_started_at <= cutoff, 1),
        else_=AuthRateLimit.attempts + 1,
    )
    next_window = case(
        (AuthRateLimit.window_started_at <= cutoff, now),
        else_=AuthRateLimit.window_started_at,
    )
    next_block = case(
        (AuthRateLimit.window_started_at <= cutoff, None),
        (next_attempts >= maximum, case((AuthRateLimit.blocked_until.is_(None), now + timedelta(seconds=window_seconds)), else_=AuthRateLimit.blocked_until)),
        else_=AuthRateLimit.blocked_until,
    )
    statement = insert(AuthRateLimit).values(
        subject_hash=subject_hash,
        action=action,
        window_started_at=now,
        attempts=1,
        blocked_until=None,
    ).on_conflict_do_update(
        index_elements=[AuthRateLimit.subject_hash, AuthRateLimit.action],
        set_={"attempts": next_attempts, "window_started_at": next_window, "blocked_until": next_block},
    ).returning(AuthRateLimit.attempts)
    attempts = db.execute(statement).scalar_one()
    db.commit()
    if attempts > maximum:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="RATE_LIMITED")


def new_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _totp_at(secret: str, counter: int) -> str:
    normalized = secret.upper()
    key = base64.b32decode(normalized + "=" * (-len(normalized) % 8))
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return f"{binary % 1_000_000:06d}"


def verify_totp(secret: str, code: str, *, now: float | None = None, last_counter: int | None = None) -> int | None:
    if len(code) != 6 or not code.isdigit():
        return None
    current = int((time.time() if now is None else now) // 30)
    for counter in (current - 1, current, current + 1):
        if counter > (last_counter if last_counter is not None else -1) and hmac.compare_digest(_totp_at(secret, counter), code):
            return counter
    return None


def encrypt_totp_secret(settings: AuthSettings, secret: str) -> str:
    if not settings.mfa_encryption_key:
        raise HTTPException(status_code=503, detail="MFA_ENCRYPTION_KEY_NOT_CONFIGURED")
    try:
        return Fernet(settings.mfa_encryption_key.encode("ascii")).encrypt(secret.encode("ascii")).decode("ascii")
    except (ValueError, TypeError):
        raise HTTPException(status_code=503, detail="MFA_ENCRYPTION_KEY_INVALID") from None


def decrypt_totp_secret(settings: AuthSettings, encrypted: str) -> str:
    if not settings.mfa_encryption_key:
        raise HTTPException(status_code=503, detail="MFA_ENCRYPTION_KEY_NOT_CONFIGURED")
    try:
        return Fernet(settings.mfa_encryption_key.encode("ascii")).decrypt(encrypted.encode("ascii")).decode("ascii")
    except (InvalidToken, ValueError, TypeError):
        raise HTTPException(status_code=503, detail="MFA_SECRET_UNAVAILABLE") from None
