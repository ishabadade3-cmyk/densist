from __future__ import annotations

import uuid
from typing import Optional, TYPE_CHECKING

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.clinical import Patient, Dentist
    from app.models.communication import Notification, AuditLog


class User(TimestampMixin, Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(CITEXT, unique=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(Text, unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(Text, index=True, nullable=False)
    status: Mapped[str] = mapped_column(Text, index=True, nullable=False, default="active")

    # Relationships
    patient: Mapped[Optional["Patient"]] = relationship("Patient", back_populates="user", uselist=False)
    dentist: Mapped[Optional["Dentist"]] = relationship("Dentist", back_populates="user", uselist=False)
    staff: Mapped[Optional["Staff"]] = relationship("Staff", back_populates="user", uselist=False)
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="user")


class Staff(TimestampMixin, Base):
    __tablename__ = "staff"

    staff_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id"), unique=True, nullable=False)
    designation: Mapped[str] = mapped_column(Text, index=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="staff")
