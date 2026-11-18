from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

from app.auth_routes import router as auth_router
from app.auth_settings import AuthSettings, validate_auth_settings
from app.clinical_routes import router as clinical_router
from app.clinical_records_routes import router as clinical_records_router
from app.clinical_storage import ClinicalStorageSettings, validate_clinical_storage_settings
from app.otp import get_otp_provider
from app.payment_routes import router as payment_router
from app.notification_routes import router as notification_router
from app.ai_routes import router as ai_router
from app.staff_routes import router as staff_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = AuthSettings.from_environment()
    validate_auth_settings(settings)
    validate_clinical_storage_settings(ClinicalStorageSettings.from_environment())
    # Fail closed if production has no real delivery provider registered.
    if settings.environment == "production":
        get_otp_provider(settings)
    yield

app = FastAPI(title="Dental Clinic API", version="0.1.0", lifespan=lifespan)
startup_settings = AuthSettings.from_environment()
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(startup_settings.trusted_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)
if startup_settings.environment == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
app.include_router(auth_router)
app.include_router(clinical_records_router)
app.include_router(clinical_router)
app.include_router(staff_router)
app.include_router(payment_router)
app.include_router(notification_router)
app.include_router(ai_router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request, _exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": "VALIDATION_ERROR"})


@app.get("/api/v1/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
