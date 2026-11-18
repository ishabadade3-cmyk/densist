"""Clinical, booking wizard, and patient portal API routes (WF-001, SRS Section 6)."""

from __future__ import annotations

import logging
import secrets
import uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.auth_routes import (
    SESSION_COOKIE,
    AuthContext,
    _audit,
    _issue_session,
    _settings,
    get_fully_authenticated_context,
    get_otp_delivery_provider,
    require_csrf,
)
from app.auth_security import hash_session_token
from app.auth_settings import AuthSettings
from app.database import get_db
from app.models.appointments import Appointment
from app.models.auth import AuthSession
from app.models.clinical import Dentist, Operatory, Patient, Service
from app.models.communication import AuditLog, OTPVerification
from app.models.users import User
from app.otp import OTPProvider

logger = logging.getLogger("dental.clinical")

router = APIRouter(prefix="/api/v1", tags=["clinical"])


# --- Schemas ---

class ServiceOut(BaseModel):
    service_id: uuid.UUID
    service_name: str
    category: Optional[str] = None
    description: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    duration_minutes: int
    active: bool

    class Config:
        from_attributes = True


class DentistOut(BaseModel):
    dentist_id: uuid.UUID
    user_id: uuid.UUID
    name: str
    qualification: str
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[list[str]] = None
    active: bool

    class Config:
        from_attributes = True


class SlotOut(BaseModel):
    slot_id: str
    dentist_id: uuid.UUID
    dentist_name: str
    start_time: str
    end_time: str
    available: bool


class BookingIn(BaseModel):
    service_id: uuid.UUID
    dentist_id: uuid.UUID
    start_time: str
    end_time: Optional[str] = None
    patient_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=20)
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None


class AppointmentOut(BaseModel):
    appointment_id: uuid.UUID
    patient_id: uuid.UUID
    dentist_id: uuid.UUID
    dentist_name: str
    service_id: uuid.UUID
    service_name: str
    start_time: str
    end_time: str
    status: str
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class AppointmentPatchIn(BaseModel):
    status: Optional[str] = None
    cancellation_reason: Optional[str] = None
    new_start_time: Optional[str] = None
    new_dentist_id: Optional[uuid.UUID] = None


class AppointmentConfirmIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(default="confirmed", pattern="^confirmed$")


class AddressModel(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None


class EmergencyContactModel(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class PatientProfileOut(BaseModel):
    patient_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[AddressModel] = None
    emergency_contact: Optional[EmergencyContactModel] = None


class PatientProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[AddressModel] = None
    emergency_contact: Optional[EmergencyContactModel] = None


class DocumentOut(BaseModel):
    document_id: uuid.UUID
    patient_id: uuid.UUID
    title: str
    kind: str  # prescription, lab_report, invoice, treatment_plan
    file_url: str
    created_at: str
    released_by_name: str


class OTPRequestIn(BaseModel):
    email_or_phone: str
    purpose: str = "booking"


class OTPResponseOut(BaseModel):
    verification_required: bool
    dev_code: Optional[str] = None


# --- Optional Auth Helper ---

def get_optional_auth_context(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> Optional[AuthContext]:
    raw_token = request.cookies.get(SESSION_COOKIE)
    if not raw_token:
        return None
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_session_token(raw_token)))
    if session is None or session.revoked_at is not None:
        return None
    expires_at = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
    if expires_at <= datetime.now(timezone.utc):
        return None
    user = db.get(User, session.user_id)
    if user is None or user.status != "active":
        return None
    return AuthContext(user=user, session=session)


# --- Seed Helper ---

def ensure_seed_data(db: Session) -> None:
    """Ensure baseline services, dentists, and operatories exist."""
    existing_services = db.scalars(select(Service)).all()
    if not existing_services:
        services_data = [
            ("Root Canal Treatment (Endodontics)", "Endodontics", "Precision rotary endodontic therapy designed to eliminate tooth infection painlessly.", 4500.0, 7500.0, 60),
            ("Single & Multi-Tooth Dental Implants", "Implantology", "Biocompatible titanium fixtures surgically placed to replace missing tooth roots.", 25000.0, 45000.0, 90),
            ("Laser Teeth Whitening", "Cosmetic Dentistry", "In-office laser-activated tooth brightening for safe aesthetic rejuvenation.", 8000.0, 15000.0, 60),
            ("Clear Aligners & Orthodontics", "Orthodontics", "Discreet transparent aligners and modern braces to correct malocclusion.", 35000.0, 120000.0, 60),
            ("Comprehensive Oral Examination & RVG Digital X-Rays", "Preventive Care", "Detailed intraoral examination, cancer screening, and low-radiation digital radiography.", 500.0, 1000.0, 30),
            ("Ultrasonic Scaling & Periodontal Therapy", "Periodontics", "Gentle piezo-ultrasonic scaling and polishing to remove plaque and tartar.", 1500.0, 3000.0, 45),
            ("Tooth-Coloured Composite Restorations", "Restorative Dentistry", "Direct biomimetic composite resin fillings that blend invisibly with enamel.", 2000.0, 4000.0, 45),
            ("Porcelain & Zirconia Crowns", "Prosthodontics", "CAD/CAM milled aesthetic crowns and bridges providing structural longevity.", 6000.0, 14000.0, 60),
            ("Wisdom Tooth & Surgical Extractions", "Oral Surgery", "Minimally invasive surgical removal of impacted third molars under local anaesthesia.", 4000.0, 8500.0, 45),
            ("Pediatric Preventive Dental Care", "Pediatric Dentistry", "Child-friendly dental assessments, pit-and-fissure sealants, and topical fluoride applications.", 1500.0, 3000.0, 45),
        ]
        for name, cat, desc, p_min, p_max, dur in services_data:
            s = Service(
                service_id=uuid.uuid4(),
                service_name=name,
                description=desc,
                price_min=p_min,
                price_max=p_max,
                duration_minutes=dur,
                active=True,
            )
            db.add(s)
        db.commit()

    existing_dentists = db.scalars(select(Dentist)).all()
    if not existing_dentists:
        # Create user accounts for dentists
        dentists_data = [
            ("Dr. Aisha Sharma", "lead-dentist@clinic.local", "Chief Dental Surgeon & Implantologist", "BDS, MDS - Prosthodontics & Implantology", "Prosthodontics & Implantology", 14, ["English", "Hindi", "Marathi"]),
            ("Dr. Rajesh Patel", "endodontist@clinic.local", "Senior Consultant Endodontist", "BDS, MDS - Conservative Dentistry & Endodontics", "Microscopic Endodontics", 10, ["English", "Hindi", "Gujarati"]),
            ("Dr. Sneha Reddy", "orthodontist@clinic.local", "Consultant Orthodontist & Dentofacial Orthopedist", "BDS, MDS - Orthodontics", "Clear Aligners & Lingual Braces", 8, ["English", "Hindi", "Telugu"]),
        ]
        for name, email, role_title, qual, spec, exp, langs in dentists_data:
            u = User(
                user_id=uuid.uuid4(),
                name=name,
                email=email,
                role="dentist",
                status="active",
            )
            db.add(u)
            db.flush()
            d = Dentist(
                dentist_id=uuid.uuid4(),
                user_id=u.user_id,
                qualification=qual,
                specialization=spec,
                experience_years=exp,
                languages=langs,
                active=True,
            )
            db.add(d)
        db.commit()

    existing_operatories = db.scalars(select(Operatory)).all()
    if not existing_operatories:
        for i in range(1, 4):
            op = Operatory(
                operatory_id=uuid.uuid4(),
                name=f"Operatory Suite {i}",
                is_active=True,
            )
            db.add(op)
        db.commit()


# --- Public / Booking Endpoints ---

@router.get("/services", response_model=list[ServiceOut])
def list_services(db: Annotated[Session, Depends(get_db)]) -> list[ServiceOut]:
    ensure_seed_data(db)
    services = db.scalars(select(Service).where(Service.active.is_(True)).order_by(Service.service_name)).all()
    return [
        ServiceOut(
            service_id=s.service_id,
            service_name=s.service_name,
            category=None,
            description=s.description,
            price_min=float(s.price_min) if s.price_min is not None else None,
            price_max=float(s.price_max) if s.price_max is not None else None,
            duration_minutes=s.duration_minutes or 45,
            active=s.active,
        )
        for s in services
    ]


@router.get("/dentists", response_model=list[DentistOut])
def list_dentists(
    db: Annotated[Session, Depends(get_db)],
    service_id: Optional[uuid.UUID] = None,
) -> list[DentistOut]:
    del service_id
    ensure_seed_data(db)
    dentists = db.scalars(select(Dentist).where(Dentist.active.is_(True))).all()
    result: list[DentistOut] = []
    for d in dentists:
        user = db.get(User, d.user_id)
        dentist_name = user.name if user else "Dentist"
        result.append(
            DentistOut(
                dentist_id=d.dentist_id,
                user_id=d.user_id,
                name=dentist_name,
                qualification=d.qualification,
                specialization=d.specialization,
                experience_years=d.experience_years,
                languages=d.languages,
                active=d.active,
            )
        )
    return result


@router.get("/availability", response_model=list[SlotOut])
def get_availability(
    service_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    dentist_id: Optional[uuid.UUID] = None,
    slot_date: Optional[str] = Query(None, alias="date"),
) -> list[SlotOut]:
    """Calculate realistic available slots for the given date, service and dentist."""
    ensure_seed_data(db)
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="SERVICE_NOT_FOUND")

    duration = service.duration_minutes or 45
    target_date_str = slot_date or (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    try:
        parsed_date = date.fromisoformat(target_date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID_DATE_FORMAT") from None

    dentists_query = select(Dentist).where(Dentist.active.is_(True))
    if dentist_id:
        dentists_query = dentists_query.where(Dentist.dentist_id == dentist_id)
    dentists = db.scalars(dentists_query).all()

    # Clinic hours: 09:00 to 18:00
    start_hour = 9
    end_hour = 18

    # Query existing active appointments for target date to respect FR-013 exclusion
    day_start = datetime.combine(parsed_date, time(0, 0), tzinfo=timezone.utc)
    day_end = datetime.combine(parsed_date, time(23, 59, 59), tzinfo=timezone.utc)

    existing_appts = db.scalars(
        select(Appointment).where(
            Appointment.start_time >= day_start,
            Appointment.start_time <= day_end,
            Appointment.status.notin_(["cancelled", "rescheduled"]),
        )
    ).all()

    slots: list[SlotOut] = []
    for d in dentists:
        user = db.get(User, d.user_id)
        dentist_name = user.name if user else "Dentist"
        current_time = datetime.combine(parsed_date, time(start_hour, 0), tzinfo=timezone.utc)
        closing_time = datetime.combine(parsed_date, time(end_hour, 0), tzinfo=timezone.utc)

        while current_time + timedelta(minutes=duration) <= closing_time:
            slot_end = current_time + timedelta(minutes=duration)

            def _ensure_tz(dt: datetime) -> datetime:
                return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

            # Check overlap with existing appointments for this dentist
            is_booked = any(
                appt.dentist_id == d.dentist_id and
                max(_ensure_tz(appt.start_time), current_time) < min(_ensure_tz(appt.end_time), slot_end)
                for appt in existing_appts
            )

            slot_id = f"{d.dentist_id}_{current_time.strftime('%Y%m%d%H%M')}"
            slots.append(
                SlotOut(
                    slot_id=slot_id,
                    dentist_id=d.dentist_id,
                    dentist_name=dentist_name,
                    start_time=current_time.isoformat(),
                    end_time=slot_end.isoformat(),
                    available=not is_booked,
                )
            )
            current_time += timedelta(minutes=duration)

    return slots


@router.post("/auth/otp/send", response_model=OTPResponseOut)
def send_otp(
    payload: OTPRequestIn,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[AuthSettings, Depends(_settings)],
    provider: Annotated[OTPProvider, Depends(get_otp_delivery_provider)],
) -> OTPResponseOut:
    """Generate and deliver OTP. Returns dev_code for testing in non-production environments."""
    identifier = payload.email_or_phone.strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="INVALID_IDENTIFIER")

    code = f"{secrets.randbelow(1_000_000):06d}"
    # In non-production, log or return the OTP
    verification = OTPVerification(
        phone_or_email=identifier,
        otp_hash=code,  # For dev simplicity or matching auth hash
        purpose=payload.purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=settings.otp_ttl_seconds),
        attempts=0,
    )
    db.add(verification)
    db.commit()

    try:
        provider.send_code(identifier, code, payload.purpose)
    except Exception:
        logger.warning("Mock OTP delivery sent for %s", identifier)

    dev_code = code if settings.environment != "production" else None
    return OTPResponseOut(verification_required=True, dev_code=dev_code)


@router.post("/appointments", response_model=AppointmentOut, status_code=201)
def create_appointment(
    payload: BookingIn,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[AuthSettings, Depends(_settings)],
    auth_ctx: Annotated[Optional[AuthContext], Depends(get_optional_auth_context)],
) -> AppointmentOut:
    """Create appointment booking (WF-001). Supports new visitor or authenticated patient."""
    ensure_seed_data(db)
    service = db.get(Service, payload.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="SERVICE_NOT_FOUND")

    dentist = db.get(Dentist, payload.dentist_id)
    if not dentist:
        raise HTTPException(status_code=404, detail="DENTIST_NOT_FOUND")

    try:
        start_dt = datetime.fromisoformat(payload.start_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID_START_TIME") from None

    duration = service.duration_minutes or 45
    if payload.end_time:
        try:
            end_dt = datetime.fromisoformat(payload.end_time.replace("Z", "+00:00"))
        except ValueError:
            end_dt = start_dt + timedelta(minutes=duration)
    else:
        end_dt = start_dt + timedelta(minutes=duration)

    # FR-013 Check: Database and application double-booking prevention for dentist
    conflict = db.scalar(
        select(Appointment).where(
            Appointment.dentist_id == payload.dentist_id,
            Appointment.status.notin_(["cancelled", "rescheduled"]),
            Appointment.start_time < end_dt,
            Appointment.end_time > start_dt,
        ).limit(1)
    )
    if conflict:
        raise HTTPException(status_code=409, detail="TIME_SLOT_CONFLICT")

    # Resolve or create Patient
    patient: Optional[Patient] = None
    if auth_ctx and auth_ctx.user:
        patient = db.scalar(select(Patient).where(Patient.user_id == auth_ctx.user.user_id))
        if not patient:
            patient = Patient(patient_id=uuid.uuid4(), user_id=auth_ctx.user.user_id)
            db.add(patient)
            db.flush()
    else:
        # Find user by phone or email, or create new patient user
        user = db.scalar(
            select(User).where(
                (User.phone == payload.phone) |
                (User.email == payload.email if payload.email else False)
            )
        )
        if not user:
            user = User(
                user_id=uuid.uuid4(),
                name=payload.patient_name.strip(),
                phone=payload.phone.strip(),
                email=payload.email.strip().lower() if payload.email else None,
                role="patient",
                status="active",
            )
            db.add(user)
            db.flush()

        patient = db.scalar(select(Patient).where(Patient.user_id == user.user_id))
        if not patient:
            parsed_dob = None
            if payload.date_of_birth:
                try:
                    parsed_dob = date.fromisoformat(payload.date_of_birth)
                except ValueError:
                    pass
            patient = Patient(
                patient_id=uuid.uuid4(),
                user_id=user.user_id,
                date_of_birth=parsed_dob,
            )
            db.add(patient)
            db.flush()

        # Automatically issue session for the new/verified patient
        _issue_session(db, user, response, mfa_verified=True, settings=settings)

    # Find an available operatory
    operatory = db.scalar(select(Operatory).where(Operatory.is_active.is_(True)).limit(1))
    operatory_id = operatory.operatory_id if operatory else None

    appointment = Appointment(
        appointment_id=uuid.uuid4(),
        patient_id=patient.patient_id,
        dentist_id=payload.dentist_id,
        service_id=payload.service_id,
        operatory_id=operatory_id,
        start_time=start_dt,
        end_time=end_dt,
        status="confirmed",
    )
    db.add(appointment)
    db.commit()

    dentist_user = db.get(User, dentist.user_id)
    dentist_name = dentist_user.name if dentist_user else "Dentist"

    return AppointmentOut(
        appointment_id=appointment.appointment_id,
        patient_id=appointment.patient_id,
        dentist_id=appointment.dentist_id,
        dentist_name=dentist_name,
        service_id=appointment.service_id,
        service_name=service.service_name,
        start_time=appointment.start_time.isoformat(),
        end_time=appointment.end_time.isoformat(),
        status=appointment.status,
        notes=payload.notes,
        created_at=appointment.created_at.isoformat() if appointment.created_at else datetime.now(timezone.utc).isoformat(),
    )


# --- Patient Portal Endpoints (SRS Section 6) ---

@router.get("/appointments", response_model=list[AppointmentOut])
def list_appointments(
    db: Annotated[Session, Depends(get_db)],
    auth_ctx: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    status: Optional[str] = Query(default=None),
    cursor: Optional[uuid.UUID] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[AppointmentOut]:
    """List appointments within the caller's permitted resource scope."""
    if date_from and date_to and date_to < date_from:
        raise HTTPException(status_code=400, detail="INVALID_DATE_RANGE")
    query = select(Appointment)
    if auth_ctx.user.role == "patient":
        patient = db.scalar(select(Patient).where(Patient.user_id == auth_ctx.user.user_id))
        if not patient:
            return []
        query = query.where(Appointment.patient_id == patient.patient_id)
    elif auth_ctx.user.role == "dentist":
        dentist = db.scalar(select(Dentist).where(Dentist.user_id == auth_ctx.user.user_id))
        if not dentist:
            return []
        query = query.where(Appointment.dentist_id == dentist.dentist_id)
    elif auth_ctx.user.role not in {"receptionist", "clinic_admin"}:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    if date_from:
        query = query.where(Appointment.start_time >= datetime.combine(date_from, time.min, tzinfo=timezone.utc))
    if date_to:
        query = query.where(Appointment.start_time < datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=timezone.utc))
    if status:
        query = query.where(Appointment.status == status)
    if cursor:
        cursor_row = db.scalar(query.where(Appointment.appointment_id == cursor))
        if cursor_row is None:
            raise HTTPException(status_code=400, detail="INVALID_CURSOR")
        query = query.where(
            (Appointment.start_time < cursor_row.start_time)
            | ((Appointment.start_time == cursor_row.start_time) & (Appointment.appointment_id < cursor_row.appointment_id))
        )
    appts = db.scalars(query.order_by(desc(Appointment.start_time), desc(Appointment.appointment_id)).limit(limit)).all()

    result: list[AppointmentOut] = []
    for a in appts:
        dentist = db.get(Dentist, a.dentist_id)
        dentist_name = "Dentist"
        if dentist:
            d_user = db.get(User, dentist.user_id)
            if d_user:
                dentist_name = d_user.name
        service = db.get(Service, a.service_id)
        service_name = service.service_name if service else "Dental Service"

        result.append(
            AppointmentOut(
                appointment_id=a.appointment_id,
                patient_id=a.patient_id,
                dentist_id=a.dentist_id,
                dentist_name=dentist_name,
                service_id=a.service_id,
                service_name=service_name,
                start_time=a.start_time.isoformat(),
                end_time=a.end_time.isoformat(),
                status=a.status,
                notes=None,
                created_at=a.created_at.isoformat() if a.created_at else datetime.now(timezone.utc).isoformat(),
            )
        )
    if auth_ctx.user.role in {"dentist", "receptionist", "clinic_admin"}:
        db.add(AuditLog(
            user_id=auth_ctx.user.user_id,
            action="appointment_calendar.read",
            resource_type="appointment_calendar",
            resource_id=None,
            occurred_at=datetime.now(timezone.utc),
            metadata_={"result_count": len(result)},
        ))
        db.commit()
    return result


@router.get("/appointments/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    auth_ctx: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> AppointmentOut:
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="APPOINTMENT_NOT_FOUND")

    patient = db.scalar(select(Patient).where(Patient.user_id == auth_ctx.user.user_id))
    if auth_ctx.user.role == "patient":
        if not patient or appt.patient_id != patient.patient_id:
            raise HTTPException(status_code=403, detail="FORBIDDEN")
    elif auth_ctx.user.role == "dentist":
        dentist_ctx = db.scalar(select(Dentist).where(Dentist.user_id == auth_ctx.user.user_id))
        if not dentist_ctx or appt.dentist_id != dentist_ctx.dentist_id:
            raise HTTPException(status_code=403, detail="FORBIDDEN")
    elif auth_ctx.user.role not in {"receptionist", "clinic_admin"}:
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    if auth_ctx.user.role in {"dentist", "receptionist", "clinic_admin"}:
        _audit(db, auth_ctx.user, "appointment.read", appt.appointment_id, "allowed", resource_type="appointment")
        db.commit()

    dentist = db.get(Dentist, appt.dentist_id)
    dentist_name = "Dentist"
    if dentist:
        d_user = db.get(User, dentist.user_id)
        if d_user:
            dentist_name = d_user.name
    service = db.get(Service, appt.service_id)
    service_name = service.service_name if service else "Dental Service"

    return AppointmentOut(
        appointment_id=appt.appointment_id,
        patient_id=appt.patient_id,
        dentist_id=appt.dentist_id,
        dentist_name=dentist_name,
        service_id=appt.service_id,
        service_name=service_name,
        start_time=appt.start_time.isoformat(),
        end_time=appt.end_time.isoformat(),
        status=appt.status,
        notes=None,
        created_at=appt.created_at.isoformat() if appt.created_at else datetime.now(timezone.utc).isoformat(),
    )


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOut, dependencies=[Depends(require_csrf)])
def patch_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentPatchIn,
    db: Annotated[Session, Depends(get_db)],
    auth_ctx: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> AppointmentOut:
    """Reschedule or cancel appointment (FR-015, FR-016)."""
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="APPOINTMENT_NOT_FOUND")

    patient = db.scalar(select(Patient).where(Patient.user_id == auth_ctx.user.user_id))
    if auth_ctx.user.role == "patient":
        if not patient or appt.patient_id != patient.patient_id:
            raise HTTPException(status_code=403, detail="FORBIDDEN")
        if payload.status not in (None, "cancelled"):
            raise HTTPException(status_code=403, detail="FORBIDDEN")
    elif auth_ctx.user.role not in {"receptionist", "clinic_admin"}:
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    transitions = {
        "requested": {"confirmed", "cancelled"},
        "confirmed": {"cancelled", "completed", "no-show"},
        "cancelled": set(),
        "completed": set(),
        "no-show": set(),
    }
    if appt.status not in transitions:
        raise HTTPException(status_code=409, detail="UNKNOWN_APPOINTMENT_STATE")
    target_status = payload.status
    if payload.new_start_time is not None or payload.new_dentist_id is not None:
        raise HTTPException(status_code=409, detail="RESCHEDULE_POLICY_UNCONFIGURED")
    if target_status is not None:
        if target_status not in transitions[appt.status]:
            raise HTTPException(status_code=409, detail="INVALID_STATUS_TRANSITION")
        if target_status in {"completed", "no-show"}:
            appointment_end = appt.end_time.replace(tzinfo=timezone.utc) if appt.end_time.tzinfo is None else appt.end_time
            if appointment_end > datetime.now(timezone.utc):
                raise HTTPException(status_code=409, detail="APPOINTMENT_NOT_ENDED")
        previous_status = appt.status
        appt.status = target_status
        db.add(AuditLog(
            user_id=auth_ctx.user.user_id,
            action="appointment.status_change",
            resource_type="appointment",
            resource_id=appt.appointment_id,
            occurred_at=datetime.now(timezone.utc),
            metadata_={"from": previous_status, "to": target_status},
        ))
    elif payload.cancellation_reason is not None:
        raise HTTPException(status_code=400, detail="STATUS_REQUIRED")

    db.commit()

    dentist = db.get(Dentist, appt.dentist_id)
    dentist_name = "Dentist"
    if dentist:
        d_user = db.get(User, dentist.user_id)
        if d_user:
            dentist_name = d_user.name
    service = db.get(Service, appt.service_id)
    service_name = service.service_name if service else "Dental Service"

    return AppointmentOut(
        appointment_id=appt.appointment_id,
        patient_id=appt.patient_id,
        dentist_id=appt.dentist_id,
        dentist_name=dentist_name,
        service_id=appt.service_id,
        service_name=service_name,
        start_time=appt.start_time.isoformat(),
        end_time=appt.end_time.isoformat(),
        status=appt.status,
        notes=None,
        created_at=appt.created_at.isoformat() if appt.created_at else datetime.now(timezone.utc).isoformat(),
    )


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentOut, dependencies=[Depends(require_csrf)])
def cancel_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentPatchIn,
    db: Annotated[Session, Depends(get_db)],
    auth_ctx: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> AppointmentOut:
    """Convenient endpoint for cancellation (FR-015)."""
    payload.status = "cancelled"
    return patch_appointment(appointment_id, payload, db, auth_ctx)


@router.post("/appointments/{appointment_id}/confirm", response_model=AppointmentOut, dependencies=[Depends(require_csrf)])
def confirm_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentConfirmIn,
    db: Annotated[Session, Depends(get_db)],
    auth_ctx: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> AppointmentOut:
    if auth_ctx.user.role not in {"receptionist", "clinic_admin"}:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    return patch_appointment(appointment_id, AppointmentPatchIn(status=payload.status), db, auth_ctx)


@router.get("/patients/me", response_model=PatientProfileOut)
def get_my_patient_profile(
    db: Annotated[Session, Depends(get_db)],
    auth_ctx: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> PatientProfileOut:
    """Return profile for currently logged in patient (SRS §6.2, POR-002)."""
    patient = db.scalar(select(Patient).where(Patient.user_id == auth_ctx.user.user_id))
    if not patient:
        patient = Patient(
            patient_id=uuid.uuid4(),
            user_id=auth_ctx.user.user_id,
        )
        db.add(patient)
        db.commit()

    addr = AddressModel(**patient.address) if patient.address and isinstance(patient.address, dict) else None
    emg = EmergencyContactModel(**patient.profile_data["emergency_contact"]) if patient.profile_data and isinstance(patient.profile_data.get("emergency_contact"), dict) else None

    return PatientProfileOut(
        patient_id=patient.patient_id,
        user_id=auth_ctx.user.user_id,
        name=auth_ctx.user.name,
        phone=auth_ctx.user.phone,
        email=auth_ctx.user.email,
        date_of_birth=patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        address=addr,
        emergency_contact=emg,
    )


@router.patch("/patients/me", response_model=PatientProfileOut)
def update_my_patient_profile(
    payload: PatientProfileUpdateIn,
    db: Annotated[Session, Depends(get_db)],
    auth_ctx: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> PatientProfileOut:
    """Update profile details for currently logged in patient."""
    patient = db.scalar(select(Patient).where(Patient.user_id == auth_ctx.user.user_id))
    if not patient:
        patient = Patient(patient_id=uuid.uuid4(), user_id=auth_ctx.user.user_id)
        db.add(patient)

    if payload.name and payload.name.strip():
        auth_ctx.user.name = payload.name.strip()
    if payload.phone and payload.phone.strip():
        auth_ctx.user.phone = payload.phone.strip()
    if payload.email and payload.email.strip():
        auth_ctx.user.email = payload.email.strip().lower()

    if payload.date_of_birth:
        try:
            patient.date_of_birth = date.fromisoformat(payload.date_of_birth)
        except ValueError:
            pass

    if payload.address is not None:
        patient.address = payload.address.model_dump()

    if payload.emergency_contact is not None:
        current_data = patient.profile_data or {}
        current_data["emergency_contact"] = payload.emergency_contact.model_dump()
        patient.profile_data = current_data

    db.commit()

    addr = AddressModel(**patient.address) if patient.address and isinstance(patient.address, dict) else None
    emg = EmergencyContactModel(**patient.profile_data["emergency_contact"]) if patient.profile_data and isinstance(patient.profile_data.get("emergency_contact"), dict) else None

    return PatientProfileOut(
        patient_id=patient.patient_id,
        user_id=auth_ctx.user.user_id,
        name=auth_ctx.user.name,
        phone=auth_ctx.user.phone,
        email=auth_ctx.user.email,
        date_of_birth=patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        address=addr,
        emergency_contact=emg,
    )


