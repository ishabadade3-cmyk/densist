"""Staff management and enqueue API for consent-gated notifications (FR-039–FR-043)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_routes import AuthContext, require_csrf, require_roles
from app.database import get_db
from app.models import AuditLog, NotificationTemplate, StaffTask
from app.notification_service import enqueue_notification

router = APIRouter(prefix="/api/v1", tags=["notifications"])


class NotificationEnqueueIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    recipient_user_id: uuid.UUID
    template_key: str = Field(min_length=1, max_length=120)
    idempotency_key: str = Field(min_length=8, max_length=128, pattern=r"^[A-Za-z0-9._:-]+$")
    variables: dict[str, str | int | float] = Field(default_factory=dict, max_length=20)
    resource_id: uuid.UUID | None = None
    scheduled_at: datetime | None = None


class TemplateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    template_key: str = Field(min_length=1, max_length=120, pattern=r"^[a-z0-9][a-z0-9._-]+$")
    channel: Literal["email", "sms", "whatsapp"]
    purpose: Literal["care_delivery", "clinical_care", "appointment_reminders", "payment_updates", "marketing"]
    subject: str | None = Field(default=None, max_length=200)
    body: str = Field(min_length=1, max_length=5000)
    variable_names: list[str] = Field(default_factory=list, max_length=20)
    variable_types: dict[str, Literal["numeric", "alphanumeric"]] = Field(default_factory=dict, max_length=20)
    provider_template_id: str | None = Field(default=None, max_length=160)
    provider_sender_id: str | None = Field(default=None, max_length=100)
    is_active: bool = False
    is_provider_approved: bool = False


def _template_out(item: NotificationTemplate) -> dict[str, Any]:
    return {
        "template_id": item.template_id,
        "template_key": item.template_key,
        "channel": item.channel,
        "purpose": item.purpose,
        "subject": item.subject,
        "body": item.body,
        "variable_names": item.variable_names,
        "variable_types": item.variable_types,
        "provider_template_id": item.provider_template_id,
        "provider_sender_id": item.provider_sender_id,
        "is_active": item.is_active,
        "is_provider_approved": item.is_provider_approved,
    }


def _audit(
    db: Session,
    context: AuthContext,
    action: str,
    resource_type: str,
    resource_id: uuid.UUID | None = None,
) -> None:
    db.add(AuditLog(
        user_id=context.user.user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        occurred_at=datetime.now(timezone.utc),
        metadata_={"source": "notification_api"},
    ))


@router.post("/notifications/templates", status_code=201, dependencies=[Depends(require_csrf)])
def create_template(
    payload: TemplateIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("clinic_admin", "system_admin"))],
) -> dict[str, Any]:
    if payload.channel == "email" and not payload.subject:
        raise HTTPException(status_code=400, detail="EMAIL_SUBJECT_REQUIRED")
    if payload.channel == "sms" and payload.is_active and (
        not payload.is_provider_approved or not payload.provider_template_id or not payload.provider_sender_id
    ):
        raise HTTPException(status_code=400, detail="DLT_TEMPLATE_APPROVAL_REQUIRED")
    if payload.channel == "whatsapp" and payload.is_active and (
        not payload.is_provider_approved or not payload.provider_template_id
    ):
        raise HTTPException(status_code=400, detail="WHATSAPP_TEMPLATE_APPROVAL_REQUIRED")
    if db.scalar(select(NotificationTemplate).where(NotificationTemplate.template_key == payload.template_key)):
        raise HTTPException(status_code=409, detail="TEMPLATE_KEY_EXISTS")
    item = NotificationTemplate(**payload.model_dump())
    db.add(item)
    db.flush()
    _audit(db, context, "notification.template_created", "notification_template", item.template_id)
    db.commit()
    db.refresh(item)
    return _template_out(item)


@router.get("/notifications/templates")
def list_templates(
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("clinic_admin", "system_admin"))],
) -> list[dict[str, Any]]:
    result = [_template_out(item) for item in db.scalars(select(NotificationTemplate).order_by(NotificationTemplate.template_key)).all()]
    _audit(db, context, "notification.templates_read", "notification_template")
    db.commit()
    return result


@router.post("/notifications/dispatch", status_code=202, dependencies=[Depends(require_csrf)])
def dispatch_notification(
    payload: NotificationEnqueueIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("receptionist", "clinic_admin", "system_admin"))],
) -> dict[str, Any]:
    try:
        item = enqueue_notification(
            db,
            recipient_user_id=payload.recipient_user_id,
            template_key=payload.template_key,
            idempotency_key=payload.idempotency_key,
            variables=payload.variables,
            resource_id=payload.resource_id,
            scheduled_at=payload.scheduled_at,
        )
    except PermissionError as exc:
        db.rollback()
        code = str(exc)
        raise HTTPException(status_code=403, detail=code) from None
    except LookupError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from None
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from None
    db.flush()
    _audit(db, context, "notification.queued", "notification", item.notification_id)
    db.commit()
    return {"notification_id": item.notification_id, "status": item.delivery_status, "scheduled_at": item.scheduled_at}


@router.get("/notifications/tasks")
def list_notification_tasks(
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("receptionist", "clinic_admin", "system_admin"))],
) -> list[dict[str, Any]]:
    rows = db.scalars(select(StaffTask).where(
        StaffTask.task_type == "notification_delivery",
        StaffTask.status == "open",
    ).order_by(StaffTask.created_at)).all()
    _audit(db, context, "notification.tasks_read", "staff_task")
    db.commit()
    # Tasks are terse operational codes; patient IDs and message text are deliberately omitted.
    return [{"task_id": item.task_id, "task_type": item.task_type, "status": item.status, "description_code": item.description_code} for item in rows]
