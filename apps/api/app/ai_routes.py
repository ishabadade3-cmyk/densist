"""Assistant, knowledge approval and deterministic cost-estimate APIs."""

from __future__ import annotations

import hashlib
import os
import uuid
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai_providers import AIProviderUnavailable, load_ai_providers
from app.ai_safety import deterministic_urgency_check
from app.ai_service import (
    QuotaExceeded,
    assistant_message,
    consume_quota,
    deterministic_cost_estimate,
    ingest_knowledge_document,
)
from app.auth_routes import AuthContext, require_csrf, require_roles
from app.clinical_routes import get_optional_auth_context
from app.database import get_db
from app.models import AuditLog, KnowledgeDocument

router = APIRouter(prefix="/api/v1", tags=["assistant"])


class MessageIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    session_id: uuid.UUID | None = None
    message: str = Field(min_length=1, max_length=2000)


class CostEstimateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    service_id: uuid.UUID
    units: int = Field(ge=1, le=100)


class UrgencyIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    questionnaire_answers: dict[str, str | bool | int] = Field(min_length=1, max_length=40)


class KnowledgeIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source_key: str = Field(min_length=2, max_length=160, pattern=r"^[A-Za-z0-9._:/-]+$")
    source_reference: str = Field(min_length=1, max_length=500)
    version: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    content: str = Field(min_length=1, max_length=500_000)


def _identity(request: Request, context: AuthContext | None) -> str:
    if context is not None:
        return "user:" + str(context.user.user_id)
    address = request.client.host if request.client else "unknown"
    return "visitor:" + hashlib.sha256(address.encode()).hexdigest()


def _check_assistant_enabled() -> bool:
    if os.getenv("APP_ENV", "development").lower() == "production":
        # A placeholder flag can never authorize production operation.
        raise HTTPException(status_code=503, detail="CLINICIAN_APPROVED_URGENCY_RULESET_REQUIRED")
    if os.getenv("AI_ENABLE_PLACEHOLDER_RULES", "false").lower() != "true":
        raise HTTPException(status_code=503, detail="DEVELOPMENT_PLACEHOLDER_RULES_DISABLED")
    return True


def _quota_or_429(db: Session, identity: str, *, llm_call: bool = False) -> None:
    try:
        consume_quota(db, identity, llm_call=llm_call)
    except QuotaExceeded:
        raise HTTPException(status_code=429, detail="AI_QUOTA_EXCEEDED") from None
    except RuntimeError:
        raise HTTPException(status_code=503, detail="AI_QUOTA_POLICY_NOT_CONFIGURED") from None


@router.post("/assistant/messages")
def assistant_messages(
    payload: MessageIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext | None, Depends(get_optional_auth_context)],
) -> dict[str, Any]:
    placeholder = _check_assistant_enabled()
    message = payload.message.strip()
    # Do the deterministic intercept here before even loading a provider adapter.
    urgency = deterministic_urgency_check(message)
    identity = _identity(request, context)
    if urgency.escalated:
        _quota_or_429(db, identity)
        db.commit()
        return {
            "response": urgency.guidance or "I can't help with that request. I can hand this to clinic staff.",
            "sources": [],
            "handoff": True,
            "handoff_target": "human",
            "ruleset_version": urgency.ruleset_version,
            "placeholder_rules": placeholder,
        }
    try:
        embedding_provider, model_provider = load_ai_providers()
    except AIProviderUnavailable:
        embedding_provider = model_provider = None
    try:
        return assistant_message(
            db,
            message=message,
            identity=identity,
            embedding_provider=embedding_provider,
            model_provider=model_provider,
            placeholder_rules_enabled=placeholder,
        )
    except QuotaExceeded:
        raise HTTPException(status_code=429, detail="AI_QUOTA_EXCEEDED") from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None
    except Exception:
        db.rollback()
        # Never log exception details from provider/database calls here.
        raise HTTPException(status_code=503, detail="ASSISTANT_TEMPORARILY_UNAVAILABLE") from None


@router.post("/assistant/urgency-check")
def assistant_urgency_check(
    payload: UrgencyIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext | None, Depends(get_optional_auth_context)],
) -> dict[str, Any]:
    placeholder = _check_assistant_enabled()
    combined = " ".join(f"{key} {value}" for key, value in payload.questionnaire_answers.items())
    if len(combined) > 2000:
        raise HTTPException(status_code=400, detail="INVALID_QUESTIONNAIRE_SIZE")
    result = deterministic_urgency_check(combined)
    _quota_or_429(db, _identity(request, context))
    db.commit()
    return {
        "status": "human_review_required",
        "escalated": result.escalated,
        "guidance": result.guidance,
        "handoff": True,
        "handoff_target": "human",
        "ruleset_version": result.ruleset_version,
        "placeholder_rules": placeholder,
    }


@router.post("/assistant/cost-estimate")
def assistant_cost_estimate(
    payload: CostEstimateIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext | None, Depends(get_optional_auth_context)],
) -> dict[str, Any]:
    _quota_or_429(db, _identity(request, context))
    try:
        result = deterministic_cost_estimate(db, payload.service_id, payload.units)
        db.commit()
        return result
    except LookupError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from None
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from None


@router.post("/assistant/knowledge", status_code=201, dependencies=[Depends(require_csrf)])
def ingest_knowledge(
    payload: KnowledgeIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("clinic_admin", "system_admin"))],
) -> dict[str, Any]:
    try:
        embedding_provider, _ = load_ai_providers()
        document = ingest_knowledge_document(
            db,
            title=payload.title,
            source_key=payload.source_key,
            source_reference=payload.source_reference,
            version=payload.version,
            content=payload.content,
            actor_user_id=context.user.user_id,
            embedding_provider=embedding_provider,
        )
    except AIProviderUnavailable:
        raise HTTPException(status_code=503, detail="EMBEDDING_PROVIDER_NOT_CONFIGURED") from None
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from None
    except Exception:
        db.rollback()
        raise HTTPException(status_code=503, detail="KNOWLEDGE_INGESTION_UNAVAILABLE") from None
    db.add(AuditLog(
        user_id=context.user.user_id,
        action="ai.knowledge_ingested_unapproved",
        resource_type="knowledge_document",
        resource_id=document.document_id,
        occurred_at=datetime.now(timezone.utc),
        metadata_={"source_key": document.source_key, "version": document.version},
    ))
    db.commit()
    return {
        "document_id": document.document_id,
        "source_key": document.source_key,
        "version": document.version,
        "content_sha256": document.content_sha256,
        "is_approved": False,
        "is_active": False,
    }


@router.post("/assistant/knowledge/{document_id}/approve", dependencies=[Depends(require_csrf)])
def approve_knowledge(
    document_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("clinic_admin", "system_admin"))],
) -> dict[str, Any]:
    document = db.scalar(select(KnowledgeDocument).where(
        KnowledgeDocument.document_id == document_id,
    ).with_for_update())
    if document is None:
        raise HTTPException(status_code=404, detail="KNOWLEDGE_DOCUMENT_NOT_FOUND")
    db.query(KnowledgeDocument).filter(
        KnowledgeDocument.source_key == document.source_key,
        KnowledgeDocument.document_id != document.document_id,
    ).update({KnowledgeDocument.is_active: False}, synchronize_session=False)
    document.is_approved = True
    document.approved_by_user_id = context.user.user_id
    document.approved_at = datetime.now(timezone.utc)
    document.is_active = True
    db.add(AuditLog(
        user_id=context.user.user_id,
        action="ai.knowledge_approved",
        resource_type="knowledge_document",
        resource_id=document.document_id,
        occurred_at=datetime.now(timezone.utc),
        metadata_={"source_key": document.source_key, "version": document.version},
    ))
    db.commit()
    return {"document_id": document.document_id, "is_approved": True, "is_active": True}
