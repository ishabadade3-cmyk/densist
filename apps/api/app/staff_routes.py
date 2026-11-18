"""Role-scoped staff APIs (FR-017, FR-018, ADM-001–ADM-005, ADM-008, ADM-012, ADM-014, ADM-019–ADM-021)."""

from __future__ import annotations

import uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth_routes import AuthContext, require_csrf, require_roles
from app.database import get_db
from app.models import Appointment, AuditLog, Dentist, DentistLeave, DentistSchedule, Patient, Service, User, WebsiteContent

router = APIRouter(prefix="/api/v1", tags=["staff"])


class WalkInIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=320)
    date_of_birth: date | None = None

    @model_validator(mode="after")
    def normalize_fields(self) -> "WalkInIn":
        self.name = self.name.strip()
        self.phone = self.phone.strip() if self.phone and self.phone.strip() else None
        self.email = self.email.strip().lower() if self.email and self.email.strip() else None
        if not self.name:
            raise ValueError("Name must not be empty")
        return self


class WalkInOut(BaseModel):
    patient_id: uuid.UUID
    user_id: uuid.UUID
    status: str


class ServiceIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    service_name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    price_min: float | None = Field(default=None, ge=0)
    price_max: float | None = Field(default=None, ge=0)
    duration_minutes: int | None = Field(default=None, gt=0, le=1440)
    active: bool = True

    @model_validator(mode="after")
    def price_order(self) -> "ServiceIn":
        if self.price_min is not None and self.price_max is not None and self.price_max < self.price_min:
            raise ValueError("price_max must not be less than price_min")
        return self


class ServicePatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    service_name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    price_min: float | None = Field(default=None, ge=0)
    price_max: float | None = Field(default=None, ge=0)
    duration_minutes: int | None = Field(default=None, gt=0, le=1440)
    active: bool | None = None


class ServiceAdminOut(BaseModel):
    service_id: uuid.UUID
    service_name: str
    description: str | None
    price_min: float | None
    price_max: float | None
    duration_minutes: int | None
    active: bool


class ContentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    slug: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=1, max_length=240)
    body: str = Field(min_length=1, max_length=100_000)
    status: str = Field(default="draft", pattern="^(draft|published|archived)$")


class ContentPatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=1, max_length=240)
    body: str | None = Field(default=None, min_length=1, max_length=100_000)
    status: str | None = Field(default=None, pattern="^(draft|published|archived)$")


class ContentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    content_id: uuid.UUID
    slug: str
    title: str
    body: str
    status: str
    published_at: datetime | None


def _service_out(service: Service) -> ServiceAdminOut:
    return ServiceAdminOut(
        service_id=service.service_id,
        service_name=service.service_name,
        description=service.description,
        price_min=float(service.price_min) if service.price_min is not None else None,
        price_max=float(service.price_max) if service.price_max is not None else None,
        duration_minutes=service.duration_minutes,
        active=service.active,
    )


def _audit(db: Session, ctx: AuthContext, action: str, resource_type: str, resource_id: uuid.UUID | None = None) -> None:
    db.add(AuditLog(
        user_id=ctx.user.user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        occurred_at=datetime.now(timezone.utc),
        metadata_={"channel": "staff_api"},
    ))


@router.post(
    "/patients", response_model=WalkInOut, status_code=201,
    dependencies=[Depends(require_csrf)],
)
def register_walk_in(
    payload: WalkInIn,
    db: Annotated[Session, Depends(get_db)],
    ctx: Annotated[AuthContext, Depends(require_roles("receptionist", "clinic_admin"))],
) -> WalkInOut:
    # Match by contact without exposing whether any other account is registered to a different role.
    conditions = []
    if payload.email:
        conditions.append(User.email == payload.email.strip().lower())
    if payload.phone:
        conditions.append(User.phone == payload.phone.strip())
    matches = db.scalars(select(User).where(or_(*conditions))).all() if conditions else []
    if len(matches) > 1:
        raise HTTPException(status_code=409, detail="CONTACTS_MATCH_DIFFERENT_ACCOUNTS")
    user = matches[0] if matches else None
    if user is not None and user.role != "patient":
        raise HTTPException(status_code=409, detail="CONTACT_ALREADY_IN_USE")
    if user is None:
        user = User(
            name=payload.name.strip(),
            email=payload.email.strip().lower() if payload.email else None,
            phone=payload.phone.strip() if payload.phone else None,
            role="patient",
            status="pending",
        )
        db.add(user)
        db.flush()
    patient = db.scalar(select(Patient).where(Patient.user_id == user.user_id))
    if patient is None:
        patient = Patient(user_id=user.user_id, date_of_birth=payload.date_of_birth)
        db.add(patient)
        db.flush()
    _audit(db, ctx, "walk_in_registered", "patient")
    db.commit()
    return WalkInOut(patient_id=patient.patient_id, user_id=user.user_id, status=user.status)


@router.get("/admin/services", response_model=list[ServiceAdminOut])
def admin_services_list(
    db: Annotated[Session, Depends(get_db)],
    _ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin"))],
) -> list[ServiceAdminOut]:
    return [_service_out(item) for item in db.scalars(select(Service).order_by(Service.service_name)).all()]


@router.post("/admin/services", response_model=ServiceAdminOut, status_code=201, dependencies=[Depends(require_csrf)])
def admin_services_create(
    payload: ServiceIn,
    db: Annotated[Session, Depends(get_db)],
    ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin"))],
) -> ServiceAdminOut:
    service = Service(**payload.model_dump())
    db.add(service)
    try:
        _audit(db, ctx, "service_created", "service")
        db.commit()
        db.refresh(service)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="SERVICE_NAME_CONFLICT") from None
    return _service_out(service)


@router.patch("/admin/services/{service_id}", response_model=ServiceAdminOut, dependencies=[Depends(require_csrf)])
def admin_services_patch(
    service_id: uuid.UUID,
    payload: ServicePatchIn,
    db: Annotated[Session, Depends(get_db)],
    ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin"))],
) -> ServiceAdminOut:
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="SERVICE_NOT_FOUND")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    if service.price_min is not None and service.price_max is not None and service.price_max < service.price_min:
        raise HTTPException(status_code=400, detail="INVALID_PRICE_RANGE")
    try:
        _audit(db, ctx, "service_updated", "service", service_id)
        db.commit()
        db.refresh(service)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="SERVICE_NAME_CONFLICT") from None
    return _service_out(service)


@router.get("/admin/content", response_model=list[ContentOut])
def admin_content_list(
    db: Annotated[Session, Depends(get_db)],
    _ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin"))],
) -> list[ContentOut]:
    return db.scalars(select(WebsiteContent).order_by(WebsiteContent.slug)).all()


@router.post("/admin/content", response_model=ContentOut, status_code=201, dependencies=[Depends(require_csrf)])
def admin_content_create(
    payload: ContentIn,
    db: Annotated[Session, Depends(get_db)],
    ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin"))],
) -> WebsiteContent:
    content = WebsiteContent(**payload.model_dump(), updated_by_user_id=ctx.user.user_id)
    if content.status == "published":
        content.published_at = datetime.now(timezone.utc)
    db.add(content)
    try:
        _audit(db, ctx, "content_created", "website_content")
        db.commit()
        db.refresh(content)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CONTENT_SLUG_CONFLICT") from None
    return content


@router.patch("/admin/content/{slug}", response_model=ContentOut, dependencies=[Depends(require_csrf)])
def admin_content_patch(
    slug: str,
    payload: ContentPatchIn,
    db: Annotated[Session, Depends(get_db)],
    ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin"))],
) -> WebsiteContent:
    content = db.scalar(select(WebsiteContent).where(WebsiteContent.slug == slug))
    if content is None:
        raise HTTPException(status_code=404, detail="CONTENT_NOT_FOUND")
    before = content.status
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(content, field, value)
    if content.status == "published" and before != "published":
        content.published_at = datetime.now(timezone.utc)
    if content.status != "published":
        content.published_at = None
    content.updated_by_user_id = ctx.user.user_id
    _audit(db, ctx, "content_updated", "website_content", content.content_id)
    db.commit()
    db.refresh(content)
    return content


@router.get("/admin/schedules")
def admin_schedule_calendar(
    db: Annotated[Session, Depends(get_db)],
    _ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin"))],
    dentist_id: uuid.UUID | None = None,
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
) -> dict[str, list[dict[str, object]]]:
    if to_date < from_date or (to_date - from_date).days > 93:
        raise HTTPException(status_code=400, detail="INVALID_DATE_RANGE")
    schedule_query = select(DentistSchedule).where(
        (DentistSchedule.effective_from.is_(None)) | (DentistSchedule.effective_from <= to_date),
        (DentistSchedule.effective_to.is_(None)) | (DentistSchedule.effective_to >= from_date),
    )
    leave_query = select(DentistLeave).where(
        DentistLeave.start_date <= to_date,
        DentistLeave.end_date >= from_date,
    )
    if dentist_id:
        schedule_query = schedule_query.where(DentistSchedule.dentist_id == dentist_id)
        leave_query = leave_query.where(DentistLeave.dentist_id == dentist_id)
    schedules = db.scalars(schedule_query.order_by(DentistSchedule.dentist_id, DentistSchedule.day_of_week)).all()
    leaves = db.scalars(leave_query.order_by(DentistLeave.start_date)).all()
    return {
        "schedules": [
            {"schedule_id": str(s.schedule_id), "dentist_id": str(s.dentist_id), "day_of_week": s.day_of_week,
             "start_time": s.start_time.isoformat(), "end_time": s.end_time.isoformat(),
             "slot_duration_minutes": s.slot_duration_minutes, "effective_from": s.effective_from,
             "effective_to": s.effective_to}
            for s in schedules
        ],
        "leaves": [
            {"leave_id": str(item.leave_id), "dentist_id": str(item.dentist_id),
             "start_date": item.start_date, "end_date": item.end_date}
            for item in leaves
        ],
    }


@router.get("/admin/reports")
def admin_aggregate_reports(
    db: Annotated[Session, Depends(get_db)],
    _ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin"))],
    date_from: date = Query(alias="date_from"),
    date_to: date = Query(alias="date_to"),
    aggregate_by: str = Query(default="day", pattern="^(day|status)$"),
) -> dict[str, object]:
    if date_to < date_from or (date_to - date_from).days > 366:
        raise HTTPException(status_code=400, detail="INVALID_DATE_RANGE")
    start = datetime.combine(date_from, datetime.min.time(), tzinfo=timezone.utc)
    end = datetime.combine(date_to, datetime.max.time(), tzinfo=timezone.utc)
    grouped = func.date(Appointment.start_time) if aggregate_by == "day" else Appointment.status
    rows = db.execute(
        select(grouped, func.count(Appointment.appointment_id))
        .where(Appointment.start_time >= start, Appointment.start_time <= end)
        .group_by(grouped)
        .order_by(grouped)
    ).all()
    # Deliberately return aggregate buckets only: no patient, staff, appointment or clinical fields.
    return {
        "date_from": date_from,
        "date_to": date_to,
        "aggregate_by": aggregate_by,
        "appointment_count": sum(count for _, count in rows),
        "buckets": [{"key": str(key), "count": count} for key, count in rows],
    }


# --- Staff calendar with patient names (FR-017, FR-018, ADM-014, ADM-020, ADM-021) ---

class StaffAppointmentOut(BaseModel):
    appointment_id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: str
    dentist_id: uuid.UUID
    dentist_name: str
    service_id: uuid.UUID
    service_name: str
    start_time: str
    end_time: str
    status: str
    created_at: str


class RescheduleIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    new_start_time: str = Field(min_length=10)
    new_dentist_id: uuid.UUID | None = None
    reason: str | None = Field(default=None, max_length=500)


def _build_staff_appt(a: Appointment, db: Session) -> StaffAppointmentOut:
    patient = db.get(Patient, a.patient_id)
    patient_name = "Patient"
    if patient:
        p_user = db.get(User, patient.user_id)
        if p_user:
            patient_name = p_user.name
    dentist = db.get(Dentist, a.dentist_id)
    dentist_name = "Dentist"
    if dentist:
        d_user = db.get(User, dentist.user_id)
        if d_user:
            dentist_name = d_user.name
    service = db.get(Service, a.service_id)
    service_name = service.service_name if service else "Dental Service"
    return StaffAppointmentOut(
        appointment_id=a.appointment_id,
        patient_id=a.patient_id,
        patient_name=patient_name,
        dentist_id=a.dentist_id,
        dentist_name=dentist_name,
        service_id=a.service_id,
        service_name=service_name,
        start_time=a.start_time.isoformat(),
        end_time=a.end_time.isoformat(),
        status=a.status,
        created_at=(a.created_at or datetime.now(timezone.utc)).isoformat(),
    )


@router.get("/staff/calendar", response_model=list[StaffAppointmentOut])
def staff_calendar(
    db: Annotated[Session, Depends(get_db)],
    ctx: Annotated[AuthContext, Depends(require_roles("receptionist", "dentist", "clinic_admin"))],
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    status: str | None = Query(default=None),
    dentist_id: uuid.UUID | None = Query(default=None),
) -> list[StaffAppointmentOut]:
    """Role-scoped appointment list with patient names for staff operational views."""
    query = select(Appointment)
    if ctx.user.role == "dentist":
        # Dentist sees only their own assigned appointments.
        d = db.scalar(select(Dentist).where(Dentist.user_id == ctx.user.user_id))
        if not d:
            return []
        query = query.where(Appointment.dentist_id == d.dentist_id)
    elif dentist_id:
        # Receptionist/admin can filter by dentist.
        query = query.where(Appointment.dentist_id == dentist_id)

    today = date.today()
    effective_from = date_from or today
    effective_to = date_to or (today + timedelta(days=30))
    if effective_to < effective_from or (effective_to - effective_from).days > 93:
        raise HTTPException(status_code=400, detail="INVALID_DATE_RANGE")

    start_dt = datetime.combine(effective_from, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(effective_to, time.max, tzinfo=timezone.utc)
    query = query.where(Appointment.start_time >= start_dt, Appointment.start_time <= end_dt)
    if status:
        query = query.where(Appointment.status == status)
    appts = db.scalars(query.order_by(Appointment.start_time)).all()
    return [_build_staff_appt(a, db) for a in appts]


@router.post(
    "/appointments/{appointment_id}/reschedule",
    response_model=StaffAppointmentOut,
    dependencies=[Depends(require_csrf)],
)
def reschedule_appointment(
    appointment_id: uuid.UUID,
    payload: RescheduleIn,
    db: Annotated[Session, Depends(get_db)],
    ctx: Annotated[AuthContext, Depends(require_roles("receptionist", "clinic_admin"))],
) -> StaffAppointmentOut:
    """Reschedule an appointment to a new time (FR-016, ADM-020)."""
    appt = db.get(Appointment, appointment_id)
    if appt is None:
        raise HTTPException(status_code=404, detail="APPOINTMENT_NOT_FOUND")
    if appt.status in {"cancelled", "completed", "no-show"}:
        raise HTTPException(status_code=409, detail="APPOINTMENT_NOT_RESCHEDULABLE")
    try:
        new_start = datetime.fromisoformat(payload.new_start_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID_START_TIME") from None
    if new_start <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="SLOT_IN_THE_PAST")
    duration = int((appt.end_time - appt.start_time).total_seconds() // 60)
    new_end = new_start + timedelta(minutes=duration)
    new_dentist_id = payload.new_dentist_id or appt.dentist_id
    # Conflict check: any active appointment for this dentist overlapping the new slot.
    conflict = db.scalar(
        select(Appointment).where(
            Appointment.dentist_id == new_dentist_id,
            Appointment.appointment_id != appointment_id,
            Appointment.status.not_in(["cancelled", "rescheduled"]),
            Appointment.start_time < new_end,
            Appointment.end_time > new_start,
        )
    )
    if conflict:
        raise HTTPException(status_code=409, detail="TIME_SLOT_CONFLICT")
    old_start = appt.start_time
    appt.status = "rescheduled"
    db.flush()
    from app.models.appointments import Appointment as ApptModel
    new_appt = ApptModel(
        patient_id=appt.patient_id,
        dentist_id=new_dentist_id,
        service_id=appt.service_id,
        operatory_id=appt.operatory_id,
        start_time=new_start,
        end_time=new_end,
        status="confirmed",
    )
    db.add(new_appt)
    db.add(AuditLog(
        user_id=ctx.user.user_id,
        action="appointment_rescheduled",
        resource_type="appointment",
        resource_id=appointment_id,
        occurred_at=datetime.now(timezone.utc),
        metadata_={"old_start": old_start.isoformat(), "new_start": new_start.isoformat(), "reason": payload.reason},
    ))
    db.commit()
    db.refresh(new_appt)
    return _build_staff_appt(new_appt, db)


@router.get("/admin/stats/today")
def admin_today_stats(
    db: Annotated[Session, Depends(get_db)],
    _ctx: Annotated[AuthContext, Depends(require_roles("clinic_admin", "receptionist"))],
) -> dict[str, object]:
    """Today's operational stats for the admin dashboard (ADM-001)."""
    today = date.today()
    day_start = datetime.combine(today, time.min, tzinfo=timezone.utc)
    day_end = datetime.combine(today, time.max, tzinfo=timezone.utc)
    today_appts = db.scalars(
        select(Appointment).where(
            Appointment.start_time >= day_start,
            Appointment.start_time <= day_end,
        )
    ).all()
    confirmed = sum(1 for a in today_appts if a.status == "confirmed")
    completed = sum(1 for a in today_appts if a.status == "completed")
    cancelled = sum(1 for a in today_appts if a.status == "cancelled")
    no_show = sum(1 for a in today_appts if a.status == "no-show")
    total_patients = db.scalar(select(func.count(Patient.patient_id))) or 0
    return {
        "date": today.isoformat(),
        "total_today": len(today_appts),
        "confirmed": confirmed,
        "completed": completed,
        "cancelled": cancelled,
        "no_show": no_show,
        "total_patients": total_patients,
    }
