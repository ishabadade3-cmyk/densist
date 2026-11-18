"""Resource-scoped medical history, alerts, treatment plans, and private clinical documents."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth_routes import AuthContext, get_fully_authenticated_context, require_csrf
from app.clinical_storage import (
    ClinicalStorageSettings,
    PDF_MEDIA_TYPE,
    PrivateLocalStorage,
    sign_download,
    validate_pdf,
    verify_download,
)
from app.database import get_db
from app.models import (
    Appointment,
    AuditLog,
    ClinicalDocument,
    Dentist,
    Patient,
    PatientClinicalAlert,
    PatientMedicalHistory,
    Treatment,
    TreatmentStage,
)

router = APIRouter(prefix="/api/v1", tags=["clinical-records"])
STAFF_CLINICAL_ROLES = {"dentist", "clinic_admin"}


class MedicalHistoryIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=12_000)
    recorded_on: date | None = None


class ClinicalAlertIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    alert_type: Literal["allergy", "medical_condition", "bleeding_risk"]
    description: str = Field(min_length=1, max_length=4_000)
    severity: Literal["low", "medium", "high", "critical"]


class ClinicalAlertResolutionIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resolved: bool


class TreatmentStageIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    procedure_name: str = Field(min_length=1, max_length=240)


class TreatmentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    treatment_name: str = Field(min_length=1, max_length=240)
    stages: list[TreatmentStageIn] = Field(min_length=1, max_length=50)


class TreatmentStagePatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["pending", "scheduled", "completed"]
    completed_at: datetime | None = None
    clinical_notes: str | None = Field(default=None, max_length=12_000)


class ReleaseDocumentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    release_to_patient: bool


class ClinicalDocumentOut(BaseModel):
    document_id: uuid.UUID
    patient_id: uuid.UUID
    title: str
    kind: str
    file_url: str
    media_type: str
    size_bytes: int
    created_at: str
    released_by_name: str | None


def _audit(
    db: Session,
    context: AuthContext,
    action: str,
    resource_type: str,
    resource_id: uuid.UUID | None = None,
    *,
    outcome: str = "allowed",
    metadata: dict[str, object] | None = None,
) -> None:
    db.add(AuditLog(
        user_id=None if context.user.role == "patient" else context.user.user_id,
        action=action,
        resource_type=resource_type,
        resource_id=None if context.user.role == "patient" else resource_id,
        occurred_at=datetime.now(timezone.utc),
        metadata_={"outcome": outcome, **(metadata or {})},
    ))


def _patient(db: Session, patient_id: uuid.UUID) -> Patient:
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="NOT_FOUND")
    return patient


def _dentist_for_user(db: Session, user_id: uuid.UUID) -> Dentist:
    dentist = db.scalar(select(Dentist).where(Dentist.user_id == user_id, Dentist.active.is_(True)))
    if dentist is None:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    return dentist


def _dentist_assigned(db: Session, patient_id: uuid.UUID, dentist_id: uuid.UUID) -> bool:
    return db.scalar(
        select(Appointment.appointment_id)
        .where(
            Appointment.patient_id == patient_id,
            Appointment.dentist_id == dentist_id,
            Appointment.status.not_in(("cancelled", "rescheduled")),
        )
        .limit(1)
    ) is not None


def _authorize_patient(
    db: Session,
    context: AuthContext,
    patient_id: uuid.UUID,
    *,
    allow_clinic_admin: bool = False,
) -> Patient:
    patient = _patient(db, patient_id)
    if context.user.role == "patient" and patient.user_id == context.user.user_id:
        return patient
    if context.user.role == "dentist":
        dentist = _dentist_for_user(db, context.user.user_id)
        if _dentist_assigned(db, patient_id, dentist.dentist_id):
            return patient
    if allow_clinic_admin and context.user.role == "clinic_admin":
        return patient
    _audit(db, context, "clinical_resource.access_denied", "patient_clinical_resource", outcome="denied")
    db.commit()
    raise HTTPException(status_code=403, detail="FORBIDDEN")


def _storage() -> tuple[ClinicalStorageSettings, PrivateLocalStorage]:
    settings = ClinicalStorageSettings.from_environment()
    return settings, PrivateLocalStorage(settings)


def _document_out(
    document: ClinicalDocument,
    settings: ClinicalStorageSettings,
) -> ClinicalDocumentOut:
    expires = int(datetime.now(timezone.utc).timestamp()) + settings.signed_url_ttl_seconds
    signature = sign_download(document.document_id, expires, settings)
    file_url = (
        f"/api/v1/clinical-documents/{document.document_id}/download"
        f"?expires={expires}&signature={signature}"
    )
    return ClinicalDocumentOut(
        document_id=document.document_id,
        patient_id=document.patient_id,
        title=document.title,
        kind=document.kind,
        file_url=file_url,
        media_type=document.media_type,
        size_bytes=document.size_bytes,
        created_at=document.created_at.isoformat() if document.created_at else "",
        released_by_name=uploaded_by.name if uploaded_by else None,
    )


@router.get("/patients/{patient_id}/history")
def list_medical_history(
    patient_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[dict[str, object]]:
    _authorize_patient(db, context, patient_id)
    rows = db.scalars(
        select(PatientMedicalHistory)
        .where(PatientMedicalHistory.patient_id == patient_id)
        .order_by(PatientMedicalHistory.created_at)
    ).all()
    _audit(db, context, "clinical_history.read", "patient_medical_history", metadata={"result_count": len(rows)})
    db.commit()
    return [
        {"history_id": row.history_id, "category": row.category, "description": row.description,
         "recorded_on": row.recorded_on, "created_at": row.created_at}
        for row in rows
    ]


@router.post("/patients/{patient_id}/history", status_code=201, dependencies=[Depends(require_csrf)])
def add_medical_history(
    patient_id: uuid.UUID,
    payload: MedicalHistoryIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, object]:
    if context.user.role != "dentist":
        _audit(db, context, "clinical_history.write_denied", "patient_medical_history", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    _authorize_patient(db, context, patient_id)
    dentist = _dentist_for_user(db, context.user.user_id)
    row = PatientMedicalHistory(
        patient_id=patient_id,
        recorded_by_dentist_id=dentist.dentist_id,
        category=payload.category.strip(),
        description=payload.description.strip(),
        recorded_on=payload.recorded_on,
    )
    db.add(row)
    db.flush()
    _audit(db, context, "clinical_history.create", "patient_medical_history", row.history_id)
    db.commit()
    return {"history_id": row.history_id, "created_at": row.created_at}


@router.get("/patients/{patient_id}/alerts")
def list_clinical_alerts(
    patient_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[dict[str, object]]:
    _authorize_patient(db, context, patient_id)
    rows = db.scalars(
        select(PatientClinicalAlert)
        .where(PatientClinicalAlert.patient_id == patient_id)
        .order_by(PatientClinicalAlert.created_at.desc())
    ).all()
    _audit(db, context, "clinical_alerts.read", "patient_clinical_alert", metadata={"result_count": len(rows)})
    db.commit()
    return [
        {"alert_id": row.alert_id, "alert_type": row.alert_type, "description": row.description,
         "severity": row.severity, "created_at": row.created_at, "resolved_at": row.resolved_at}
        for row in rows
    ]


@router.post("/patients/{patient_id}/alerts", status_code=201, dependencies=[Depends(require_csrf)])
def create_clinical_alert(
    patient_id: uuid.UUID,
    payload: ClinicalAlertIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, object]:
    if context.user.role != "dentist":
        _audit(db, context, "clinical_alert.write_denied", "patient_clinical_alert", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    _authorize_patient(db, context, patient_id)
    dentist = _dentist_for_user(db, context.user.user_id)
    row = PatientClinicalAlert(
        patient_id=patient_id,
        created_by_dentist_id=dentist.dentist_id,
        alert_type=payload.alert_type,
        description=payload.description.strip(),
        severity=payload.severity,
    )
    db.add(row)
    db.flush()
    _audit(db, context, "clinical_alert.create", "patient_clinical_alert", row.alert_id)
    db.commit()
    return {"alert_id": row.alert_id, "alert_type": row.alert_type, "severity": row.severity}


@router.patch("/patients/{patient_id}/alerts/{alert_id}", dependencies=[Depends(require_csrf)])
def resolve_clinical_alert(
    patient_id: uuid.UUID,
    alert_id: uuid.UUID,
    payload: ClinicalAlertResolutionIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, object]:
    if context.user.role != "dentist":
        _audit(db, context, "clinical_alert.write_denied", "patient_clinical_alert", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    _authorize_patient(db, context, patient_id)
    row = db.get(PatientClinicalAlert, alert_id)
    if row is None or row.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="ALERT_NOT_FOUND")
    row.resolved_at = datetime.now(timezone.utc) if payload.resolved else None
    _audit(db, context, "clinical_alert.resolve" if payload.resolved else "clinical_alert.reopen", "patient_clinical_alert", row.alert_id)
    db.commit()
    return {"alert_id": row.alert_id, "resolved_at": row.resolved_at}


def _treatment_response(row: Treatment, include_notes: bool = False) -> dict[str, object]:
    stages = sorted(row.stages, key=lambda stage: stage.stage_number)
    return {
        "treatment_id": row.treatment_id,
        "patient_id": row.patient_id,
        "dentist_id": row.dentist_id,
        "treatment_name": row.treatment_name,
        "status": row.status,
        "start_date": row.start_date,
        "end_date": row.end_date,
        "stages": [
            {"stage_id": stage.stage_id, "stage_number": stage.stage_number,
             "procedure_name": stage.procedure_name, "status": stage.status,
             "completed_at": stage.completed_at,
             **({"clinical_notes": stage.clinical_notes} if include_notes else {})}
            for stage in stages
        ],
    }


@router.get("/patients/{patient_id}/treatments")
def list_treatment_plans(
    patient_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[dict[str, object]]:
    _authorize_patient(db, context, patient_id)
    query = select(Treatment).options(selectinload(Treatment.stages)).where(Treatment.patient_id == patient_id)
    if context.user.role == "patient":
        query = query.where(Treatment.status.in_(("in_progress", "completed")))
    rows = db.scalars(query.order_by(Treatment.created_at.desc())).all()
    _audit(db, context, "treatment_plans.read", "treatment", metadata={"result_count": len(rows)})
    db.commit()
    return [_treatment_response(row, include_notes=context.user.role == "dentist") for row in rows]


@router.post("/patients/{patient_id}/treatments", status_code=201, dependencies=[Depends(require_csrf)])
def create_treatment_plan(
    patient_id: uuid.UUID,
    payload: TreatmentIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, object]:
    if context.user.role != "dentist":
        _audit(db, context, "treatment_plan.write_denied", "treatment", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    _authorize_patient(db, context, patient_id)
    dentist = _dentist_for_user(db, context.user.user_id)
    treatment = Treatment(
        patient_id=patient_id,
        dentist_id=dentist.dentist_id,
        treatment_name=payload.treatment_name.strip(),
        status="proposed",
    )
    db.add(treatment)
    db.flush()
    for number, item in enumerate(payload.stages, start=1):
        db.add(TreatmentStage(
            treatment_id=treatment.treatment_id,
            stage_number=number,
            procedure_name=item.procedure_name.strip(),
            status="pending",
            dentist_id=dentist.dentist_id,
        ))
    _audit(db, context, "treatment_plan.create", "treatment", treatment.treatment_id)
    db.commit()
    db.refresh(treatment)
    return _treatment_response(treatment, include_notes=True)


@router.patch("/treatments/{treatment_id}/stages/{stage_id}", dependencies=[Depends(require_csrf)])
def update_treatment_stage(
    treatment_id: uuid.UUID,
    stage_id: uuid.UUID,
    payload: TreatmentStagePatchIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, object]:
    if context.user.role != "dentist":
        _audit(db, context, "treatment_stage.write_denied", "treatment_stage", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    treatment = db.get(Treatment, treatment_id)
    stage = db.get(TreatmentStage, stage_id)
    dentist = _dentist_for_user(db, context.user.user_id)
    if treatment is None or stage is None or stage.treatment_id != treatment_id:
        raise HTTPException(status_code=404, detail="TREATMENT_STAGE_NOT_FOUND")
    if treatment.dentist_id != dentist.dentist_id or not _dentist_assigned(db, treatment.patient_id, dentist.dentist_id):
        _audit(db, context, "treatment_stage.write_denied", "treatment_stage", stage_id, outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    if payload.status == "completed":
        stage.completed_at = payload.completed_at or datetime.now(timezone.utc)
    else:
        stage.completed_at = None
    stage.status = payload.status
    if payload.clinical_notes is not None:
        stage.clinical_notes = payload.clinical_notes
    _audit(db, context, "treatment_stage.update", "treatment_stage", stage_id)
    db.commit()
    return {"stage_id": stage.stage_id, "status": stage.status, "completed_at": stage.completed_at}


@router.post(
    "/patients/{patient_id}/documents",
    response_model=ClinicalDocumentOut,
    status_code=201,
    dependencies=[Depends(require_csrf)],
)
async def upload_clinical_document(
    patient_id: uuid.UUID,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
    kind: Literal["prescription", "report"],
    title: str = Query(min_length=1, max_length=240),
    release_to_patient: bool = False,
) -> ClinicalDocumentOut:
    if context.user.role not in STAFF_CLINICAL_ROLES:
        _audit(db, context, "clinical_document.write_denied", "clinical_document", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    _authorize_patient(db, context, patient_id, allow_clinic_admin=True)
    media_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if media_type != PDF_MEDIA_TYPE:
        raise HTTPException(status_code=415, detail="UNSUPPORTED_FILE_TYPE")
    settings, storage = _storage()
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            declared_length = int(content_length)
        except ValueError:
            raise HTTPException(status_code=400, detail="INVALID_CONTENT_LENGTH") from None
        if declared_length < 0:
            raise HTTPException(status_code=400, detail="INVALID_CONTENT_LENGTH")
        if declared_length > settings.max_upload_bytes:
            raise HTTPException(status_code=413, detail="INVALID_FILE_SIZE")
    chunks: list[bytes] = []
    total = 0
    async for chunk in request.stream():
        total += len(chunk)
        if total > settings.max_upload_bytes:
            raise HTTPException(status_code=413, detail="INVALID_FILE_SIZE")
        chunks.append(chunk)
    content = b"".join(chunks)
    sha256 = validate_pdf(content, settings.max_upload_bytes)
    cleaned_title = title.strip()
    if not cleaned_title:
        raise HTTPException(status_code=400, detail="INVALID_TITLE")
    document_id = uuid.uuid4()
    storage_key = storage.new_storage_key()
    storage.write(storage_key, content)
    now = datetime.now(timezone.utc)
    document = ClinicalDocument(
        document_id=document_id,
        patient_id=patient_id,
        uploaded_by_user_id=context.user.user_id,
        kind=kind,
        title=cleaned_title,
        storage_key=storage_key,
        media_type=PDF_MEDIA_TYPE,
        size_bytes=len(content),
        sha256=sha256,
        release_to_patient=release_to_patient,
        released_at=now if release_to_patient else None,
    )
    db.add(document)
    db.flush()
    _audit(db, context, "clinical_document.upload", "clinical_document", document.document_id)
    try:
        db.commit()
    except Exception:
        db.rollback()
        storage.read_path(storage_key).unlink(missing_ok=True)
        raise
    return _document_out(document, settings)


@router.patch("/patients/{patient_id}/documents/{document_id}", dependencies=[Depends(require_csrf)])
def update_document_release(
    patient_id: uuid.UUID,
    document_id: uuid.UUID,
    payload: ReleaseDocumentIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, object]:
    if context.user.role not in STAFF_CLINICAL_ROLES:
        _audit(db, context, "clinical_document.release_denied", "clinical_document", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    _authorize_patient(db, context, patient_id, allow_clinic_admin=True)
    document = db.get(ClinicalDocument, document_id)
    if document is None or document.patient_id != patient_id or document.revoked_at is not None:
        raise HTTPException(status_code=404, detail="DOCUMENT_NOT_FOUND")
    release = payload.release_to_patient
    document.release_to_patient = release
    document.released_at = datetime.now(timezone.utc) if release else None
    _audit(db, context, "clinical_document.release" if release else "clinical_document.unrelease", "clinical_document", document_id)
    db.commit()
    return {"document_id": document.document_id, "release_to_patient": document.release_to_patient, "released_at": document.released_at}


def _list_documents(
    patient_id: uuid.UUID,
    db: Session,
    context: AuthContext,
    *,
    patient_view: bool,
) -> list[ClinicalDocumentOut]:
    patient = _authorize_patient(db, context, patient_id, allow_clinic_admin=not patient_view)
    if patient_view and context.user.role != "patient":
        _audit(db, context, "clinical_document.read_denied", "clinical_document", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    query = select(ClinicalDocument).where(
        ClinicalDocument.patient_id == patient_id,
        ClinicalDocument.revoked_at.is_(None),
    )
    if context.user.role == "patient":
        query = query.where(ClinicalDocument.release_to_patient.is_(True))
    documents = db.scalars(query.order_by(ClinicalDocument.created_at.desc())).all()
    settings, _ = _storage()
    result = []
    for document in documents:
        result.append(_document_out(document, settings))
    _audit(db, context, "clinical_documents.read", "clinical_document_collection", metadata={"result_count": len(result)})
    db.commit()
    return result


@router.get("/patients/me/documents", response_model=list[ClinicalDocumentOut])
def list_my_clinical_documents(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[ClinicalDocumentOut]:
    del request
    patient = db.scalar(select(Patient).where(Patient.user_id == context.user.user_id)) if context.user.role == "patient" else None
    if patient is None:
        _audit(db, context, "clinical_document.read_denied", "clinical_document_collection", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    return _list_documents(patient.patient_id, db, context, patient_view=True)


@router.get("/patients/{patient_id}/documents", response_model=list[ClinicalDocumentOut])
def list_patient_clinical_documents(
    patient_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[ClinicalDocumentOut]:
    return _list_documents(patient_id, db, context, patient_view=False)


@router.get("/clinical-documents/{document_id}/download", name="download_clinical_document")
def download_clinical_document(
    document_id: uuid.UUID,
    expires: int,
    signature: str,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> Response:
    settings, storage = _storage()
    if not verify_download(document_id, expires, signature, settings, int(datetime.now(timezone.utc).timestamp())):
        _audit(db, context, "clinical_document.download_denied", "clinical_document", outcome="denied")
        db.commit()
        raise HTTPException(status_code=403, detail="SIGNED_URL_INVALID_OR_EXPIRED")
    document = db.get(ClinicalDocument, document_id)
    if document is None or document.revoked_at is not None:
        _audit(db, context, "clinical_document.download_denied", "clinical_document", outcome="denied")
        db.commit()
        raise HTTPException(status_code=404, detail="DOCUMENT_NOT_FOUND")
    allowed = False
    if context.user.role == "patient":
        patient = db.scalar(select(Patient).where(Patient.user_id == context.user.user_id))
        allowed = bool(patient and patient.patient_id == document.patient_id and document.release_to_patient)
    elif context.user.role == "dentist":
        dentist = _dentist_for_user(db, context.user.user_id)
        allowed = _dentist_assigned(db, document.patient_id, dentist.dentist_id)
    elif context.user.role == "clinic_admin":
        allowed = True
    if not allowed:
        _audit(db, context, "clinical_document.download_denied", "clinical_document", document.document_id, outcome="denied")
        db.commit()
        raise HTTPException(status_code=404 if context.user.role == "patient" else 403, detail="FORBIDDEN")
    try:
        path = storage.read_path(document.storage_key)
    except (OSError, ValueError):
        _audit(db, context, "clinical_document.download_failed", "clinical_document", document.document_id, outcome="missing_blob")
        db.commit()
        raise HTTPException(status_code=404, detail="DOCUMENT_NOT_FOUND") from None
    _audit(db, context, "clinical_document.download", "clinical_document", document.document_id)
    db.commit()
    return FileResponse(
        path,
        media_type=document.media_type,
        filename=f"clinical-document-{document.document_id}.pdf",
        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"},
    )
