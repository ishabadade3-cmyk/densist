from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Optional, TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import UserDefinedType
from app.db import Base, TimestampMixin, generate_uuid, utc_now

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.clinical import Patient


class PgVector(UserDefinedType):
    """pgvector's unconstrained vector type; model/provider dimensions remain configurable."""

    cache_ok = True

    def get_col_spec(self, **_kw: Any) -> str:
        return "vector"


class KnowledgeDocument(TimestampMixin, Base):
    __tablename__ = "knowledge_documents"
    __table_args__ = (
        UniqueConstraint("source_key", "version", name="uq_knowledge_document_source_version"),
        Index("ix_knowledge_documents_approved", "is_approved", "version"),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    source_key: Mapped[str] = mapped_column(Text, nullable=False)
    source_reference: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content_sha256: Mapped[str] = mapped_column(Text, nullable=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    approved_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.user_id"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ingested_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class KnowledgeChunk(TimestampMixin, Base):
    __tablename__ = "knowledge_chunks"
    __table_args__ = (
        UniqueConstraint("document_id", "chunk_number", name="uq_knowledge_chunk_document_number"),
        Index("ix_knowledge_chunks_document", "document_id", "chunk_number"),
    )

    chunk_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("knowledge_documents.document_id"), nullable=False)
    chunk_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(PgVector(), nullable=False)
    embedding_model: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, nullable=False, default=dict)


class AIUsageCounter(TimestampMixin, Base):
    __tablename__ = "ai_usage_counters"
    __table_args__ = (
        UniqueConstraint("subject_hash", "usage_date", name="uq_ai_usage_subject_date"),
        Index("ix_ai_usage_date", "usage_date"),
    )

    usage_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    subject_hash: Mapped[str] = mapped_column(Text, nullable=False)
    usage_date: Mapped[date] = mapped_column(Date, nullable=False)
    request_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    llm_call_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    window_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    window_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_created", "user_id", "created_at"),
        Index("ix_notifications_status_due", "delivery_status", "next_attempt_at"),
    )

    notification_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    channel: Mapped[str] = mapped_column(Text, nullable=False)  # sms, whatsapp, email
    purpose: Mapped[str] = mapped_column(Text, nullable=False, default="care_delivery")
    template_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("notification_templates.template_id"), nullable=True)
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(Text, unique=True, nullable=True)
    variables: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    message_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_status: Mapped[str] = mapped_column(Text, nullable=False, default="queued", index=True)  # queued, sent, delivered, failed, consent_blocked
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    next_attempt_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    last_error_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")


class NotificationTemplate(TimestampMixin, Base):
    __tablename__ = "notification_templates"
    __table_args__ = (
        CheckConstraint("channel IN ('email','sms','whatsapp')", name="channel"),
        CheckConstraint("purpose IN ('care_delivery','clinical_care','appointment_reminders','payment_updates','marketing')", name="purpose"),
        Index("ix_notification_templates_channel_purpose", "channel", "purpose", "is_active"),
    )

    template_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    template_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    channel: Mapped[str] = mapped_column(Text, nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    variable_names: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    variable_types: Mapped[dict[str, str]] = mapped_column(JSONB, nullable=False, default=dict)
    provider_template_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider_sender_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_provider_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class NotificationAttempt(TimestampMixin, Base):
    __tablename__ = "notification_attempts"
    __table_args__ = (Index("ix_notification_attempts_notification_created", "notification_id", "created_at"),)

    attempt_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    notification_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notifications.notification_id"), nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    outcome: Mapped[str] = mapped_column(Text, nullable=False)
    provider_message_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class StaffTask(TimestampMixin, Base):
    __tablename__ = "staff_tasks"
    __table_args__ = (
        Index("ix_staff_tasks_status_created", "status", "created_at"),
        Index("ix_staff_tasks_patient_status", "patient_id", "status"),
    )

    task_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    task_type: Mapped[str] = mapped_column(Text, nullable=False)
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("patients.patient_id"), nullable=True)
    notification_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("notifications.notification_id"), unique=True, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="open")
    description_code: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.user_id"), nullable=True)


class Review(TimestampMixin, Base):
    __tablename__ = "reviews"

    review_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("patients.patient_id"), nullable=True)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approval_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending", index=True)  # pending, approved, rejected



class Consent(TimestampMixin, Base):
    __tablename__ = "consents"
    __table_args__ = (
        Index("ix_consents_patient_purpose", "patient_id", "purpose"),
        Index("ix_consents_patient_channel_purpose_recorded", "patient_id", "channel", "purpose", "recorded_at"),
        Index("ix_consents_recorded_at", "recorded_at"),
    )

    consent_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.patient_id"), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)  # care_delivery, sms_reminders, marketing, public_imagery
    status: Mapped[str] = mapped_column(Text, nullable=False, default="granted")  # granted, revoked
    channel: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # email, sms, whatsapp; null is not channel-specific authorization
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    policy_version: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_ref: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="consents")


class AIConversation(TimestampMixin, Base):
    __tablename__ = "ai_conversations"
    __table_args__ = (
        Index("ix_ai_conv_patient_created", "patient_id", "created_at"),
        Index("ix_ai_conv_expires_at", "expires_at"),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("patients.patient_id"), nullable=True)
    pseudonymous_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(default=generate_uuid, nullable=True)

    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    messages: Mapped[list["AIMessage"]] = relationship("AIMessage", back_populates="conversation")


class AIMessage(TimestampMixin, Base):
    __tablename__ = "ai_messages"
    __table_args__ = (
        Index("ix_ai_messages_conv_created", "conversation_id", "created_at"),
    )

    message_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_conversations.conversation_id"), nullable=False)
    sender: Mapped[str] = mapped_column(Text, nullable=False)  # user, assistant, system
    content_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


    # Relationships
    conversation: Mapped["AIConversation"] = relationship("AIConversation", back_populates="messages")


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_occurred_at", "occurred_at"),
        Index("ix_audit_logs_resource", "resource_type", "resource_id"),
        Index("ix_audit_logs_user_occurred", "user_id", "occurred_at"),
    )

    log_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.user_id"), nullable=True)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    resource_type: Mapped[str] = mapped_column(Text, nullable=False)
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    metadata_: Mapped[Optional[dict[str, Any]]] = mapped_column("metadata", JSONB, nullable=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")


class OTPVerification(TimestampMixin, Base):
    __tablename__ = "otp_verifications"
    __table_args__ = (
        Index("ix_otp_lookup", "phone_or_email", "purpose", "created_at"),
        Index("ix_otp_expires_at", "expires_at"),
    )

    verification_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    phone_or_email: Mapped[str] = mapped_column(Text, nullable=False)
    otp_hash: Mapped[str] = mapped_column(Text, nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)  # login, registration, booking
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    consumed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class WebsiteContent(TimestampMixin, Base):
    __tablename__ = "website_content"
    __table_args__ = (
        Index("ix_website_content_status_slug", "status", "slug"),
    )

    content_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="draft")
    updated_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.user_id"), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

