from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Optional, TYPE_CHECKING

from sqlalchemy import (
    Date,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.appointments import Appointment, DentistSchedule, DentistLeave
    from app.models.financial import Payment, Invoice
    from app.models.communication import Consent


class Patient(TimestampMixin, Base):
    __tablename__ = "patients"

    patient_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.user_id"), unique=True, nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, index=True, nullable=True)
    address: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    profile_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)


    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="patient")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="patient")
    medical_records: Mapped[list["MedicalRecord"]] = relationship("MedicalRecord", back_populates="patient")
    medical_history: Mapped[list["PatientMedicalHistory"]] = relationship("PatientMedicalHistory", back_populates="patient")
    clinical_documents: Mapped[list["ClinicalDocument"]] = relationship("ClinicalDocument", back_populates="patient")
    treatments: Mapped[list["Treatment"]] = relationship("Treatment", back_populates="patient")
    prescriptions: Mapped[list["Prescription"]] = relationship("Prescription", back_populates="patient")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="patient")
    invoices: Mapped[list["Invoice"]] = relationship("Invoice", back_populates="patient")
    consents: Mapped[list["Consent"]] = relationship("Consent", back_populates="patient")
    clinical_alerts: Mapped[list["PatientClinicalAlert"]] = relationship("PatientClinicalAlert", back_populates="patient")


class Dentist(TimestampMixin, Base):
    __tablename__ = "dentists"

    dentist_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id"), unique=True, nullable=False)
    qualification: Mapped[str] = mapped_column(Text, nullable=False)
    specialization: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experience_years: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    languages: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, index=True, default=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="dentist")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="dentist")
    schedules: Mapped[list["DentistSchedule"]] = relationship("DentistSchedule", back_populates="dentist")
    leaves: Mapped[list["DentistLeave"]] = relationship("DentistLeave", back_populates="dentist")
    medical_records: Mapped[list["MedicalRecord"]] = relationship("MedicalRecord", back_populates="dentist")
    treatments: Mapped[list["Treatment"]] = relationship("Treatment", back_populates="dentist")
    prescriptions: Mapped[list["Prescription"]] = relationship("Prescription", back_populates="dentist")


class Operatory(TimestampMixin, Base):
    __tablename__ = "operatories"

    operatory_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, index=True, default=True, nullable=False)

    # Relationships
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="operatory")


class Service(TimestampMixin, Base):
    __tablename__ = "services"

    service_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    service_name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price_min: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    price_max: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, index=True, default=True, nullable=False)

    # Relationships
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="service")


class MedicalRecord(TimestampMixin, Base):
    __tablename__ = "medical_records"
    __table_args__ = (Index("ix_medical_records_patient_created", "patient_id", "created_at"),)

    record_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    dentist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=False)
    clinical_notes: Mapped[str] = mapped_column(Text, nullable=False)


    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="medical_records")
    dentist: Mapped["Dentist"] = relationship("Dentist", back_populates="medical_records")
    versions: Mapped[list["MedicalRecordVersion"]] = relationship("MedicalRecordVersion", back_populates="record", order_by="MedicalRecordVersion.version_number")


class MedicalRecordVersion(TimestampMixin, Base):
    __tablename__ = "medical_record_versions"
    __table_args__ = (
        UniqueConstraint("record_id", "version_number", name="uq_medical_record_version"),
        Index("ix_medical_record_versions_record", "record_id", "version_number"),
    )

    version_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("medical_records.record_id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    clinical_notes: Mapped[str] = mapped_column(Text, nullable=False)
    changed_by_dentist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=False)

    record: Mapped["MedicalRecord"] = relationship("MedicalRecord", back_populates="versions")


class Treatment(TimestampMixin, Base):
    __tablename__ = "treatments"
    __table_args__ = (Index("ix_treatments_patient_status", "patient_id", "status"),)

    treatment_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    dentist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=False)
    treatment_name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)  # proposed, in_progress, completed, paused
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="treatments")
    dentist: Mapped["Dentist"] = relationship("Dentist", back_populates="treatments")
    stages: Mapped[list["TreatmentStage"]] = relationship("TreatmentStage", back_populates="treatment")


class TreatmentStage(TimestampMixin, Base):
    __tablename__ = "treatment_stages"
    __table_args__ = (
        UniqueConstraint("treatment_id", "stage_number", name="uq_treatment_stage_number"),
        Index("ix_treatment_stages_treatment_status", "treatment_id", "status"),
    )

    stage_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    treatment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("treatments.treatment_id"), nullable=False)
    stage_number: Mapped[int] = mapped_column(Integer, nullable=False)
    procedure_name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)  # pending, scheduled, completed
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dentist_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=True)

    # Relationships
    treatment: Mapped["Treatment"] = relationship("Treatment", back_populates="stages")


class Prescription(TimestampMixin, Base):
    __tablename__ = "prescriptions"
    __table_args__ = (Index("ix_prescriptions_patient_issued", "patient_id", "issued_date"),)

    prescription_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    dentist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=False)
    document_reference: Mapped[str] = mapped_column(Text, nullable=False)
    issued_date: Mapped[date] = mapped_column(Date, nullable=False)
    release_status: Mapped[str] = mapped_column(Text, nullable=False, default="draft")  # draft, released, revoked

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="prescriptions")
    dentist: Mapped["Dentist"] = relationship("Dentist", back_populates="prescriptions")


class PatientClinicalAlert(TimestampMixin, Base):
    __tablename__ = "patient_clinical_alerts"
    __table_args__ = (Index("ix_patient_clinical_alerts_patient_type", "patient_id", "alert_type"),)

    alert_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    alert_type: Mapped[str] = mapped_column(Text, nullable=False)  # allergy, medical_condition, bleeding_risk
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(Text, nullable=False, index=True)  # low, medium, high, critical
    created_by_dentist_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=True)

    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="clinical_alerts")


class PatientMedicalHistory(TimestampMixin, Base):
    __tablename__ = "patient_medical_histories"
    __table_args__ = (Index("ix_patient_medical_histories_patient_created", "patient_id", "created_at"),)

    history_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    recorded_by_dentist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dentists.dentist_id"), nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    recorded_on: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="medical_history")


class ClinicalDocument(TimestampMixin, Base):
    __tablename__ = "clinical_documents"
    __table_args__ = (
        UniqueConstraint("storage_key", name="uq_clinical_document_storage_key"),
        Index("ix_clinical_documents_patient_created", "patient_id", "created_at"),
        Index("ix_clinical_documents_patient_release", "patient_id", "release_to_patient", "revoked_at"),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    uploaded_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    kind: Mapped[str] = mapped_column(Text, nullable=False)  # prescription, report
    title: Mapped[str] = mapped_column(Text, nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    media_type: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(Text, nullable=False)
    release_to_patient: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="clinical_documents")


class PatientFamilyLink(TimestampMixin, Base):
    __tablename__ = "patient_family_links"
    __table_args__ = (
        UniqueConstraint(
            "guardian_patient_id",
            "dependent_patient_id",
            "relationship_type",
            name="uq_guardian_dependent_relationship",
        ),
    )

    link_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    guardian_patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False, index=True)
    dependent_patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False, index=True)
    relationship_type: Mapped[str] = mapped_column(Text, nullable=False)  # parent, spouse, legal_guardian
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, index=True, default=True, nullable=False)
