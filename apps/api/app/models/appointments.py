from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    Text,
    Time,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.clinical import Patient, Dentist, Operatory, Service
    from app.models.financial import Invoice, Payment


class Appointment(TimestampMixin, Base):
    __tablename__ = "appointments"
    __table_args__ = (
        # FR-013 Invariant: Database-level exclusion constraint preventing overlapping bookings
        # for the same dentist (excluding cancelled/rescheduled rows)
        ExcludeConstraint(
            ("dentist_id", "="),
            (text("tstzrange(start_time, end_time, '[)')"), "&&"),
            where=text("status NOT IN ('cancelled', 'rescheduled')"),
            using="gist",
            name="excl_appointment_dentist_no_overlap",
        ),
        # FR-013 Invariant: Database-level exclusion constraint preventing overlapping bookings
        # in the same operatory room (excluding cancelled/rescheduled and null operatory rows)
        ExcludeConstraint(
            ("operatory_id", "="),
            (text("tstzrange(start_time, end_time, '[)')"), "&&"),
            where=text("operatory_id IS NOT NULL AND status NOT IN ('cancelled', 'rescheduled')"),
            using="gist",
            name="excl_appointment_operatory_no_overlap",
        ),
        Index("ix_appointments_patient_start", "patient_id", "start_time"),
        Index("ix_appointments_dentist_start", "dentist_id", "start_time"),
        Index("ix_appointments_operatory_start", "operatory_id", "start_time"),
    )

    appointment_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    dentist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=False)
    service_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("services.service_id"), nullable=False)
    operatory_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("operatories.operatory_id"), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, index=True, default="requested")  # requested, confirmed, cancelled, completed, no-show


    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")
    dentist: Mapped["Dentist"] = relationship("Dentist", back_populates="appointments")
    service: Mapped["Service"] = relationship("Service", back_populates="appointments")
    operatory: Mapped[Optional["Operatory"]] = relationship("Operatory", back_populates="appointments")
    invoices: Mapped[list["Invoice"]] = relationship("Invoice", back_populates="appointment")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="appointment")


class DentistSchedule(TimestampMixin, Base):
    __tablename__ = "dentist_schedules"
    __table_args__ = (
        UniqueConstraint(
            "dentist_id",
            "day_of_week",
            "start_time",
            "effective_from",
            name="uq_dentist_schedule_day_time",
        ),
        Index("ix_dentist_schedules_dentist_day", "dentist_id", "day_of_week"),
    )

    schedule_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    dentist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 0=Monday, 6=Sunday
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    effective_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    dentist: Mapped["Dentist"] = relationship("Dentist", back_populates="schedules")


class DentistLeave(TimestampMixin, Base):
    __tablename__ = "dentist_leaves"
    __table_args__ = (
        Index("ix_dentist_leaves_dates", "dentist_id", "start_date", "end_date"),
    )

    leave_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    dentist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    dentist: Mapped["Dentist"] = relationship("Dentist", back_populates="leaves")


class AppointmentWaitlist(TimestampMixin, Base):
    __tablename__ = "appointment_waitlist"
    __table_args__ = (
        Index("ix_waitlist_service_status_dates", "service_id", "status", "preferred_date_range_start", "preferred_date_range_end"),
    )

    waitlist_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    dentist_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=True)
    service_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("services.service_id"), nullable=False)
    preferred_date_range_start: Mapped[date] = mapped_column(Date, nullable=False)
    preferred_date_range_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="active")  # active, fulfilled, expired, cancelled

