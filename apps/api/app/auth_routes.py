"""Server-side authentication, MFA, CSRF, throttling, and patient-resource checks."""

from __future__ import annotations

import hmac
import logging
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import quote
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth_security import (
    csrf_digest,
    decrypt_totp_secret,
    encrypt_totp_secret,
    enforce_rate_limit,
    hash_password,
    hash_session_token,
    hmac_digest,
    new_totp_secret,
    normalized_identifier,
    rate_key,
    verify_password,
    verify_totp,
)
from app.auth_settings import AuthSettings, validate_auth_settings
from app.database import get_db
from app.models import (
    Appointment,
    AuditLog,
    AuthSession,
    Consent,
    Dentist,
    MedicalRecord,
    MedicalRecordVersion,
    OTPVerification,
    Patient,
    User,
    UserMFA,
)
from app.otp import OTPProvider, get_otp_provider

logger = logging.getLogger("dental.auth")
router = APIRouter(prefix="/api/v1", tags=["authentication"])
SESSION_COOKIE = "__Host-dental-session"
STAFF_ROLES = {"dentist", "receptionist", "clinic_admin", "system_admin"}
ALLOWED_ROLES = STAFF_ROLES | {"patient"}
_DUMMY_PASSWORD_HASH = hash_password("not-a-valid-project-password")


class RegistrationIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=50)
    password: str = Field(min_length=1, max_length=1024)


class LoginIn(BaseModel):
    email_or_phone: str = Field(min_length=1, max_length=320)
    password: str = Field(min_length=1, max_length=1024)
    totp_code: str | None = None


class OTPVerifyIn(BaseModel):
    email_or_phone: str = Field(min_length=1, max_length=320)
    code: str = Field(min_length=6, max_length=6)


class RecoveryIn(BaseModel):
    email_or_phone: str = Field(min_length=1, max_length=320)


class RecoveryVerifyIn(OTPVerifyIn):
    new_password: str = Field(min_length=1, max_length=1024)


class TOTPIn(BaseModel):
    code: str = Field(min_length=6, max_length=6)


class ClinicalNoteIn(BaseModel):
    clinical_notes: str = Field(min_length=1, max_length=20_000)


class ClinicalNotePatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    clinical_notes: str = Field(min_length=1, max_length=20_000)


class ProfilePatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=1, max_length=200)


class ContactChangeIn(BaseModel):
    email_or_phone: str = Field(min_length=1, max_length=320)


class ConsentIn(BaseModel):
    status: str = Field(pattern="^(granted|revoked|withdrawn)$")
    channel: str | None = Field(default=None, pattern="^(email|sms|whatsapp)$")


@dataclass(frozen=True)
class AuthContext:
    user: User
    session: AuthSession


def _settings() -> AuthSettings:
    settings = AuthSettings.from_environment()
    validate_auth_settings(settings)
    return settings


def get_otp_delivery_provider(
    settings: Annotated[AuthSettings, Depends(_settings)],
) -> OTPProvider:
    return get_otp_provider(settings)


def _enforce_auth_limits(
    db: Session,
    request: Request,
    settings: AuthSettings,
    *,
    action: str,
    identifier: str,
    maximum: int,
) -> None:
    for scope in (normalized_identifier(identifier), "__client_ip__"):
        enforce_rate_limit(
            db,
            subject_hash=rate_key(settings, request, action, scope),
            action=action,
            maximum=maximum,
            window_seconds=settings.rate_window_seconds,
        )


def _same_origin(request: Request, settings: Annotated[AuthSettings, Depends(_settings)]) -> None:
    origin = request.headers.get("origin")
    if not origin or origin.rstrip("/") not in settings.trusted_origins:
        raise HTTPException(status_code=403, detail="CSRF_ORIGIN_INVALID")


def _set_session_cookie(response: Response, token: str, ttl: int, secure: bool = True) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=secure,
        samesite="lax" if not secure else "strict",
        path="/",
        max_age=ttl,
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, path="/", httponly=True)


def _issue_session(
    db: Session,
    user: User,
    response: Response,
    *,
    mfa_verified: bool,
    settings: AuthSettings,
) -> str:
    token = secrets.token_urlsafe(32)
    csrf_token = secrets.token_urlsafe(32)
    session = AuthSession(
        user_id=user.user_id,
        token_hash=hash_session_token(token),
        csrf_token_hash=csrf_digest(csrf_token),
        mfa_verified=mfa_verified,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=settings.session_ttl_seconds),
    )
    db.add(session)
    db.commit()
    is_secure = settings.environment == "production"
    _set_session_cookie(response, token, settings.session_ttl_seconds, secure=is_secure)
    response.headers["Cache-Control"] = "no-store"
    return csrf_token


def get_auth_context(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> AuthContext:
    raw_token = request.cookies.get(SESSION_COOKIE)
    if not raw_token:
        raise HTTPException(status_code=401, detail="UNAUTHENTICATED")
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_session_token(raw_token)))
    now = datetime.now(timezone.utc)
    if session is None or session.revoked_at is not None:
        raise HTTPException(status_code=401, detail="UNAUTHENTICATED")
    expires_at = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
    if expires_at <= now:
        raise HTTPException(status_code=401, detail="UNAUTHENTICATED")
    user = db.get(User, session.user_id)
    if user is None or user.status != "active" or user.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=401, detail="UNAUTHENTICATED")
    return AuthContext(user=user, session=session)


def get_fully_authenticated_context(
    context: Annotated[AuthContext, Depends(get_auth_context)],
) -> AuthContext:
    if context.user.role in STAFF_ROLES and not context.session.mfa_verified:
        raise HTTPException(status_code=403, detail="MFA_REQUIRED")
    return context


def require_roles(*roles: str):
    def dependency(context: Annotated[AuthContext, Depends(get_fully_authenticated_context)]) -> AuthContext:
        if context.user.role not in roles:
            raise HTTPException(status_code=403, detail="FORBIDDEN")
        return context

    return dependency


def require_csrf(
    request: Request,
    context: Annotated[AuthContext, Depends(get_auth_context)],
    settings: Annotated[AuthSettings, Depends(_settings)],
    csrf_token: Annotated[str | None, Header(alias="X-CSRF-Token")] = None,
) -> None:
    if not csrf_token or not hmac.compare_digest(csrf_digest(csrf_token), context.session.csrf_token_hash):
        raise HTTPException(status_code=403, detail="CSRF_INVALID")
    _same_origin(request, settings)


def _find_user(db: Session, identifier: str) -> User | None:
    value = normalized_identifier(identifier)
    condition = User.email == value if "@" in value else User.phone == value
    return db.scalar(select(User).where(condition))


def _otp_code_hash(settings: AuthSettings, identifier: str, purpose: str, code: str) -> str:
    return hmac_digest(settings.otp_pepper, f"{normalized_identifier(identifier)}:{purpose}:{code}")


def _send_otp(
    db: Session,
    request: Request,
    identifier: str,
    purpose: str,
    settings: AuthSettings,
    provider: OTPProvider,
) -> None:
    normalized = normalized_identifier(identifier)
    _enforce_auth_limits(
        db, request, settings, action=f"otp:{purpose}", identifier=normalized,
        maximum=settings.otp_request_limit,
    )
    code = f"{secrets.randbelow(1_000_000):06d}"
    verification = OTPVerification(
        phone_or_email=normalized,
        otp_hash=_otp_code_hash(settings, normalized, purpose, code),
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=settings.otp_ttl_seconds),
        attempts=0,
    )
    db.add(verification)
    db.commit()
    try:
        provider.send_code(normalized, code, purpose)
    except Exception:
        verification.consumed_at = datetime.now(timezone.utc)
        db.commit()
        logger.error("OTP provider delivery failed for purpose=%s", purpose)
        raise HTTPException(status_code=503, detail="OTP_PROVIDER_UNAVAILABLE") from None


def _consume_otp(
    db: Session,
    identifier: str,
    purpose: str,
    code: str,
    settings: AuthSettings,
) -> bool:
    normalized = normalized_identifier(identifier)
    verification = db.scalar(
        select(OTPVerification)
        .where(
            OTPVerification.phone_or_email == normalized,
            OTPVerification.purpose == purpose,
            OTPVerification.consumed_at.is_(None),
        )
        .order_by(OTPVerification.created_at.desc())
        .with_for_update()
    )
    now = datetime.now(timezone.utc)
    valid = (
        verification is not None
        and verification.expires_at > now
        and verification.attempts < settings.otp_max_attempts
        and hmac.compare_digest(verification.otp_hash, _otp_code_hash(settings, normalized, purpose, code))
    )
    if verification is not None:
        if valid:
            verification.consumed_at = now
        else:
            verification.attempts += 1
            if verification.attempts >= settings.otp_max_attempts or verification.expires_at <= now:
                verification.consumed_at = now
        db.commit()
    return bool(valid)


def _audit(
    db: Session,
    actor: User,
    action: str,
    resource_id: uuid.UUID | None,
    outcome: str,
    *,
    resource_type: str = "patient_clinical_records",
) -> None:
    db.add(AuditLog(
        # Patient identity is deliberately omitted from the audit actor/resource fields.
        user_id=None if actor.role == "patient" else actor.user_id,
        action=action,
        resource_type=resource_type,
        resource_id=None if actor.role == "patient" else resource_id,
        occurred_at=datetime.now(timezone.utc),
        metadata_={"outcome": outcome},
    ))


def _authorized_patient_records(db: Session, patient_id: uuid.UUID, context: AuthContext) -> Patient:
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="NOT_FOUND")
    allowed = context.user.role == "patient" and patient.user_id == context.user.user_id
    if context.user.role == "dentist":
        dentist_id = db.scalar(select(Dentist.dentist_id).where(Dentist.user_id == context.user.user_id))
        allowed = db.scalar(select(Appointment.appointment_id).where(
            Appointment.patient_id == patient_id,
            Appointment.dentist_id == dentist_id,
            Appointment.status.not_in(("cancelled", "rescheduled")),
        ).limit(1).with_for_update()) is not None
    if not allowed:
        _audit(db, context.user, "patient_records.read_denied", None, "denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    return patient


@router.post("/auth/register", status_code=202, dependencies=[Depends(_same_origin)])
def register(
    payload: RegistrationIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[AuthSettings, Depends(_settings)],
    provider: Annotated[OTPProvider, Depends(get_otp_delivery_provider)],
) -> dict[str, bool]:
    email = normalized_identifier(payload.email) if payload.email and payload.email.strip() else None
    phone = payload.phone.strip() if payload.phone and payload.phone.strip() else None
    if bool(email) == bool(phone):
        raise HTTPException(status_code=400, detail="PROVIDE_ONE_CONTACT")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="INVALID_NAME")
    if len(payload.password) < settings.password_min_length:
        raise HTTPException(status_code=400, detail="PASSWORD_TOO_SHORT")
    if email and ("@" not in email or any(char.isspace() for char in email)):
        raise HTTPException(status_code=400, detail="INVALID_EMAIL")
    identifier = email or phone
    assert identifier is not None
    _enforce_auth_limits(
        db, request, settings, action="register", identifier=identifier,
        maximum=settings.otp_request_limit,
    )
    user = User(
        name=payload.name.strip(),
        email=email,
        phone=phone,
        password_hash=hash_password(payload.password),
        role="patient",
        status="pending",
    )
    try:
        db.add(user)
        db.flush()
        db.add(Patient(user_id=user.user_id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="ACCOUNT_CONFLICT") from None
    _send_otp(db, request, identifier, "registration", settings, provider)
    return {"verification_required": True}


@router.post("/auth/login", dependencies=[Depends(_same_origin)])
def login(
    payload: LoginIn,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[AuthSettings, Depends(_settings)],
) -> dict[str, object]:
    _enforce_auth_limits(
        db, request, settings, action="login", identifier=payload.email_or_phone,
        maximum=settings.login_limit,
    )
    user = _find_user(db, payload.email_or_phone)
    password_matches = verify_password(user.password_hash if user else _DUMMY_PASSWORD_HASH, payload.password)
    if user is None or user.status != "active" or user.role not in ALLOWED_ROLES or not password_matches:
        raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")
    mfa_verified = user.role not in STAFF_ROLES
    mfa = db.scalar(select(UserMFA).where(UserMFA.user_id == user.user_id).with_for_update()) if user.role in STAFF_ROLES else None
    mfa_setup_required = False
    if user.role in STAFF_ROLES:
        if mfa is None or mfa.enabled_at is None:
            mfa_setup_required = True
        elif payload.totp_code:
            secret = decrypt_totp_secret(settings, mfa.secret_ciphertext)
            counter = verify_totp(secret, payload.totp_code, last_counter=mfa.last_totp_counter)
            if counter is None:
                raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")
            mfa.last_totp_counter = counter
            db.commit()
            mfa_verified = True
        else:
            mfa_setup_required = False
    csrf_token = _issue_session(db, user, response, mfa_verified=mfa_verified, settings=settings)
    if user.role in STAFF_ROLES and not mfa_verified:
        return {"authenticated": False, "mfa_required": not mfa_setup_required, "mfa_setup_required": mfa_setup_required, "csrf_token": csrf_token}
    return {"authenticated": True, "user_id": str(user.user_id), "role": user.role, "csrf_token": csrf_token}


@router.post("/auth/otp/verify", dependencies=[Depends(_same_origin)])
def verify_registration_otp(
    payload: OTPVerifyIn,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[AuthSettings, Depends(_settings)],
) -> dict[str, object]:
    _enforce_auth_limits(
        db, request, settings, action="otp_verify:registration", identifier=payload.email_or_phone,
        maximum=settings.otp_max_attempts,
    )
    if not _consume_otp(db, payload.email_or_phone, "registration", payload.code, settings):
        raise HTTPException(status_code=401, detail="INVALID_OTP")
    user = _find_user(db, payload.email_or_phone)
    if user is None or user.status != "pending":
        raise HTTPException(status_code=401, detail="INVALID_OTP")
    user.status = "active"
    db.commit()
    csrf_token = _issue_session(db, user, response, mfa_verified=True, settings=settings)
    return {"authenticated": True, "user_id": str(user.user_id), "role": user.role, "csrf_token": csrf_token}


@router.post("/auth/password-recovery", status_code=202, dependencies=[Depends(_same_origin)])
def request_password_recovery(
    payload: RecoveryIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[AuthSettings, Depends(_settings)],
    provider: Annotated[OTPProvider, Depends(get_otp_delivery_provider)],
) -> dict[str, bool]:
    identifier = normalized_identifier(payload.email_or_phone)
    _enforce_auth_limits(
        db, request, settings, action="recovery", identifier=identifier,
        maximum=settings.otp_request_limit,
    )
    user = _find_user(db, identifier)
    if user is not None and user.status == "active":
        try:
            _send_otp(db, request, identifier, "password_recovery", settings, provider)
        except HTTPException:
            # Preserve the same response for unknown accounts, throttled requests, and provider failures.
            pass
    return {"accepted": True}


@router.post("/auth/password-recovery/verify", dependencies=[Depends(_same_origin)])
def recover_password(
    payload: RecoveryVerifyIn,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[AuthSettings, Depends(_settings)],
) -> Response:
    identifier = normalized_identifier(payload.email_or_phone)
    _enforce_auth_limits(
        db, request, settings, action="otp_verify:password_recovery", identifier=identifier,
        maximum=settings.otp_max_attempts,
    )
    if len(payload.new_password) < settings.password_min_length:
        raise HTTPException(status_code=400, detail="PASSWORD_TOO_SHORT")
    if not _consume_otp(db, identifier, "password_recovery", payload.code, settings):
        raise HTTPException(status_code=401, detail="INVALID_OTP")
    user = _find_user(db, identifier)
    if user is None or user.status != "active":
        raise HTTPException(status_code=401, detail="INVALID_OTP")
    user.password_hash = hash_password(payload.new_password)
    _audit(db, user, "auth_credentials.password_recovery", user.user_id, "allowed", resource_type="auth_credentials")
    db.query(AuthSession).filter(AuthSession.user_id == user.user_id, AuthSession.revoked_at.is_(None)).update(
        {AuthSession.revoked_at: datetime.now(timezone.utc)}, synchronize_session=False
    )
    db.commit()
    _clear_session_cookie(response)
    response.status_code = 204
    return response


@router.post("/auth/mfa/enroll", dependencies=[Depends(_same_origin), Depends(require_csrf)])
def enroll_mfa(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_auth_context)],
    settings: Annotated[AuthSettings, Depends(_settings)],
) -> dict[str, str]:
    if context.user.role not in STAFF_ROLES or context.session.mfa_verified:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    existing = db.get(UserMFA, context.user.user_id)
    if existing is not None and existing.enabled_at is not None:
        raise HTTPException(status_code=409, detail="MFA_ALREADY_ENABLED")
    secret = new_totp_secret()
    encrypted = encrypt_totp_secret(settings, secret)
    if existing is None:
        db.add(UserMFA(user_id=context.user.user_id, secret_ciphertext=encrypted))
    else:
        existing.secret_ciphertext = encrypted
    _audit(db, context.user, "auth_mfa.enroll", context.user.user_id, "allowed", resource_type="auth_mfa")
    db.commit()
    account = quote(context.user.email or str(context.user.user_id))
    issuer = quote("Dental Platform")
    uri = f"otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"
    response.headers["Cache-Control"] = "no-store"
    return {"shared_secret": secret, "provisioning_uri": uri}


@router.post("/auth/mfa/verify", dependencies=[Depends(_same_origin), Depends(require_csrf)])
def verify_mfa_enrollment(
    payload: TOTPIn,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_auth_context)],
    settings: Annotated[AuthSettings, Depends(_settings)],
) -> dict[str, object]:
    if context.user.role not in STAFF_ROLES or context.session.mfa_verified:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    _enforce_auth_limits(
        db, request, settings, action="mfa_verify", identifier=str(context.user.user_id),
        maximum=settings.otp_max_attempts,
    )
    mfa = db.scalar(select(UserMFA).where(UserMFA.user_id == context.user.user_id).with_for_update())
    if mfa is None:
        raise HTTPException(status_code=409, detail="MFA_ENROLLMENT_REQUIRED")
    secret = decrypt_totp_secret(settings, mfa.secret_ciphertext)
    counter = verify_totp(secret, payload.code, last_counter=mfa.last_totp_counter)
    if counter is None:
        raise HTTPException(status_code=401, detail="INVALID_OTP")
    now = datetime.now(timezone.utc)
    mfa.last_totp_counter = counter
    mfa.enabled_at = now
    context.session.revoked_at = now
    _audit(db, context.user, "auth_mfa.enable", context.user.user_id, "allowed", resource_type="auth_mfa")
    db.commit()
    csrf_token = _issue_session(db, context.user, response, mfa_verified=True, settings=settings)
    return {"authenticated": True, "user_id": str(context.user.user_id), "role": context.user.role, "csrf_token": csrf_token}


@router.post("/auth/csrf", dependencies=[Depends(_same_origin)])
def get_csrf_token(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, str]:
    # A fresh token replaces the previous one and is stored only as a digest server-side.
    token = secrets.token_urlsafe(32)
    context.session.csrf_token_hash = csrf_digest(token)
    db.commit()
    response.headers["Cache-Control"] = "no-store"
    return {"csrf_token": token}


@router.get("/auth/profile")
def get_profile(
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, object]:
    patient = db.scalar(select(Patient).where(Patient.user_id == context.user.user_id))
    _audit(db, context.user, "user_profile.read", context.user.user_id, "allowed", resource_type="user_profile")
    db.commit()
    return {
        "user_id": str(context.user.user_id),
        "patient_id": str(patient.patient_id) if patient else None,
        "name": context.user.name,
        "email": context.user.email,
        "phone": context.user.phone,
        "role": context.user.role,
    }


@router.patch("/auth/profile", dependencies=[Depends(require_csrf)])
def update_profile(
    payload: ProfilePatchIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, str | None]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="NO_PROFILE_FIELDS")
    if "name" in updates and updates["name"] is None:
        raise HTTPException(status_code=400, detail="INVALID_NAME")
    if "name" in updates and not updates["name"].strip():
        raise HTTPException(status_code=400, detail="INVALID_NAME")
    for key, value in updates.items():
        setattr(context.user, key, value.strip() if isinstance(value, str) else value)
    _audit(db, context.user, "user_profile.update", context.user.user_id, "allowed", resource_type="user_profile")
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CONTACT_CONFLICT") from None
    return {"name": context.user.name, "email": context.user.email, "phone": context.user.phone}


@router.post("/auth/profile/contact-verification", status_code=202, dependencies=[Depends(require_csrf)])
def request_contact_change_verification(
    payload: ContactChangeIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
    settings: Annotated[AuthSettings, Depends(_settings)],
    provider: Annotated[OTPProvider, Depends(get_otp_delivery_provider)],
) -> dict[str, bool]:
    _same_origin(request, settings)
    identifier = normalized_identifier(payload.email_or_phone)
    if "@" in identifier and ("@" not in identifier or any(char.isspace() for char in identifier)):
        raise HTTPException(status_code=400, detail="INVALID_EMAIL")
    current_value = context.user.email if "@" in identifier else context.user.phone
    if current_value == identifier:
        raise HTTPException(status_code=400, detail="CONTACT_UNCHANGED")
    if _find_user(db, identifier) is not None:
        raise HTTPException(status_code=409, detail="CONTACT_CONFLICT")
    _send_otp(db, request, identifier, "contact_change", settings, provider)
    return {"verification_required": True}


@router.post("/auth/profile/contact-verification/verify", dependencies=[Depends(require_csrf)])
def verify_contact_change(
    payload: OTPVerifyIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
    settings: Annotated[AuthSettings, Depends(_settings)],
) -> dict[str, str | None]:
    _same_origin(request, settings)
    identifier = normalized_identifier(payload.email_or_phone)
    _enforce_auth_limits(
        db, request, settings, action="otp_verify:contact_change", identifier=identifier,
        maximum=settings.otp_max_attempts,
    )
    if not _consume_otp(db, identifier, "contact_change", payload.code, settings):
        raise HTTPException(status_code=401, detail="INVALID_OTP")
    existing_user = _find_user(db, identifier)
    if existing_user is not None and existing_user.user_id != context.user.user_id:
        raise HTTPException(status_code=409, detail="CONTACT_CONFLICT")
    if "@" in identifier:
        context.user.email = identifier
    else:
        context.user.phone = identifier
    _audit(db, context.user, "user_profile.contact_update", context.user.user_id, "allowed", resource_type="user_profile")
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="CONTACT_CONFLICT") from None
    return {"email": context.user.email, "phone": context.user.phone}


@router.get("/auth/consents")
def get_consents(
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("patient"))],
) -> list[dict[str, object]]:
    patient = db.scalar(select(Patient).where(Patient.user_id == context.user.user_id))
    if patient is None:
        raise HTTPException(status_code=404, detail="NOT_FOUND")
    consents = db.scalars(
        select(Consent).where(Consent.patient_id == patient.patient_id).order_by(Consent.recorded_at.desc())
    ).all()
    _audit(db, context.user, "consents.read", patient.patient_id, "allowed", resource_type="consents")
    db.commit()
    return [
        {"consent_id": str(item.consent_id), "purpose": item.purpose, "channel": item.channel, "status": item.status, "recorded_at": item.recorded_at}
        for item in consents
    ]


@router.put("/auth/consents/{purpose}", dependencies=[Depends(require_csrf)])
def update_consent(
    purpose: str,
    payload: ConsentIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(require_roles("patient"))],
    settings: Annotated[AuthSettings, Depends(_settings)],
) -> dict[str, str]:
    if purpose not in {"care_delivery", "appointment_reminders", "sms_reminders", "payment_updates", "clinical_care", "marketing", "public_imagery"}:
        raise HTTPException(status_code=400, detail="INVALID_CONSENT_PURPOSE")
    if not settings.consent_policy_version:
        raise HTTPException(status_code=503, detail="CONSENT_POLICY_NOT_CONFIGURED")
    patient = db.scalar(select(Patient).where(Patient.user_id == context.user.user_id))
    if patient is None:
        raise HTTPException(status_code=404, detail="NOT_FOUND")
    consent = Consent(
        patient_id=patient.patient_id,
        purpose=purpose,
        status="revoked" if payload.status == "withdrawn" else payload.status,
        channel=payload.channel,
        recorded_at=datetime.now(timezone.utc),
        policy_version=settings.consent_policy_version,
    )
    db.add(consent)
    _audit(db, context.user, "consents.update", patient.patient_id, "allowed", resource_type="consents")
    db.commit()
    return {"consent_id": str(consent.consent_id), "status": consent.status}


@router.post("/auth/logout", dependencies=[Depends(require_csrf)])
def logout(
    response: Response,
    context: Annotated[AuthContext, Depends(get_auth_context)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    context.session.revoked_at = datetime.now(timezone.utc)
    db.commit()
    _clear_session_cookie(response)
    response.status_code = 204
    return response


@router.get("/patients/{patient_id}/records")
def list_patient_records(
    patient_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[dict[str, object]]:
    _authorized_patient_records(db, patient_id, context)
    records = db.scalars(select(MedicalRecord).where(MedicalRecord.patient_id == patient_id).order_by(MedicalRecord.created_at)).all()
    _audit(db, context.user, "patient_records.read", None, "allowed")
    db.commit()
    result = []
    for record in records:
        version_count = db.scalar(select(func.max(MedicalRecordVersion.version_number)).where(
            MedicalRecordVersion.record_id == record.record_id,
        )) or 1
        result.append({
            "record_id": str(record.record_id),
            "clinical_notes": record.clinical_notes,
            "version": version_count,
            "created_at": record.created_at,
        })
    return result


@router.post("/patients/{patient_id}/records", status_code=201, dependencies=[Depends(require_csrf)])
def create_patient_record(
    patient_id: uuid.UUID,
    payload: ClinicalNoteIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, str]:
    if context.user.role != "dentist":
        _audit(db, context.user, "patient_records.write_denied", None, "denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    patient = _authorized_patient_records(db, patient_id, context)
    dentist = db.scalar(select(Dentist).where(Dentist.user_id == context.user.user_id))
    if dentist is None:
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    record = MedicalRecord(patient_id=patient.patient_id, dentist_id=dentist.dentist_id, clinical_notes=payload.clinical_notes)
    db.add(record)
    db.flush()
    db.add(MedicalRecordVersion(
        record_id=record.record_id,
        version_number=1,
        clinical_notes=payload.clinical_notes,
        changed_by_dentist_id=dentist.dentist_id,
    ))
    _audit(db, context.user, "patient_records.create", record.record_id, "allowed")
    db.commit()
    return {"record_id": str(record.record_id), "version": "1", "created_at": record.created_at.isoformat()}


@router.patch("/patients/{patient_id}/records/{record_id}", dependencies=[Depends(require_csrf)])
def update_patient_record(
    patient_id: uuid.UUID,
    record_id: uuid.UUID,
    payload: ClinicalNotePatchIn,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> dict[str, str | int]:
    if context.user.role != "dentist":
        _audit(db, context.user, "patient_records.write_denied", None, "denied")
        db.commit()
        raise HTTPException(status_code=403, detail="FORBIDDEN")
    _authorized_patient_records(db, patient_id, context)
    dentist = db.scalar(select(Dentist).where(Dentist.user_id == context.user.user_id))
    record = db.get(MedicalRecord, record_id)
    if dentist is None or record is None or record.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="RECORD_NOT_FOUND")
    versions = db.scalars(
        select(MedicalRecordVersion)
        .where(MedicalRecordVersion.record_id == record_id)
        .order_by(MedicalRecordVersion.version_number.desc())
        .with_for_update()
    ).all()
    current_version = versions[0].version_number if versions else 0
    if current_version == 0:
        db.add(MedicalRecordVersion(
            record_id=record.record_id,
            version_number=1,
            clinical_notes=record.clinical_notes,
            changed_by_dentist_id=record.dentist_id,
        ))
        current_version = 1
    record.clinical_notes = payload.clinical_notes
    db.add(MedicalRecordVersion(
        record_id=record.record_id,
        version_number=current_version + 1,
        clinical_notes=payload.clinical_notes,
        changed_by_dentist_id=dentist.dentist_id,
    ))
    _audit(db, context.user, "patient_records.update", record.record_id, "allowed")
    db.commit()
    return {"record_id": str(record.record_id), "version": current_version + 1}


@router.get("/patients/{patient_id}/records/{record_id}/versions")
def list_patient_record_versions(
    patient_id: uuid.UUID,
    record_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    context: Annotated[AuthContext, Depends(get_fully_authenticated_context)],
) -> list[dict[str, object]]:
    _authorized_patient_records(db, patient_id, context)
    record = db.get(MedicalRecord, record_id)
    if record is None or record.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="RECORD_NOT_FOUND")
    versions = db.scalars(
        select(MedicalRecordVersion)
        .where(MedicalRecordVersion.record_id == record_id)
        .order_by(MedicalRecordVersion.version_number)
    ).all()
    _audit(db, context.user, "patient_records.versions.read", record_id, "allowed")
    db.commit()
    return [
        {"version_id": str(item.version_id), "version": item.version_number,
         "clinical_notes": item.clinical_notes, "created_at": item.created_at}
        for item in versions
    ]
