from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, CHAR, DateTime, ForeignKey, Integer, LargeBinary, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base, TimestampMixin, generate_uuid


class AuthSession(TimestampMixin, Base):
    __tablename__ = "auth_sessions"

    session_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash: Mapped[bytes] = mapped_column(LargeBinary(32), unique=True, nullable=False)
    csrf_token_hash: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    mfa_verified: Mapped[bool] = mapped_column(Boolean, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UserMFA(TimestampMixin, Base):
    __tablename__ = "user_mfa"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    secret_ciphertext: Mapped[str] = mapped_column(Text, nullable=False)
    enabled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True, nullable=True)
    last_totp_counter: Mapped[int | None] = mapped_column(BigInteger, nullable=True)


class AuthRateLimit(TimestampMixin, Base):
    __tablename__ = "auth_rate_limits"
    __table_args__ = (
        UniqueConstraint("subject_hash", "action", name="uq_auth_rate_limit_subject_action"),
    )

    rate_limit_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    subject_hash: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    window_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    blocked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True, nullable=True)
