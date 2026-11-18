"""Private clinical-file storage and short-lived authenticated download signatures."""

from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import tempfile
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException

PDF_MEDIA_TYPE = "application/pdf"
_ACTIVE_PDF_FEATURES = (b"/javascript", b"/js ", b"/launch", b"/embeddedfile", b"/openaction")


@dataclass(frozen=True)
class ClinicalStorageSettings:
    root: Path
    signing_key: bytes
    max_upload_bytes: int
    signed_url_ttl_seconds: int
    environment: str

    @classmethod
    def from_environment(cls) -> "ClinicalStorageSettings":
        root = Path(os.getenv("CLINICAL_STORAGE_ROOT", str(Path(tempfile.gettempdir()) / "dental-private-clinical")))
        return cls(
            root=root,
            signing_key=os.getenv("CLINICAL_SIGNING_KEY", "development-only-clinical-signing-key").encode("utf-8"),
            max_upload_bytes=int(os.getenv("CLINICAL_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024))),
            signed_url_ttl_seconds=int(os.getenv("CLINICAL_SIGNED_URL_TTL_SECONDS", "300")),
            environment=os.getenv("APP_ENV", "development"),
        )


def validate_clinical_storage_settings(settings: ClinicalStorageSettings) -> None:
    if settings.max_upload_bytes < 1 or settings.signed_url_ttl_seconds < 1:
        raise RuntimeError("Clinical storage limits must be positive")
    if settings.environment == "production":
        required = ("CLINICAL_STORAGE_ROOT", "CLINICAL_SIGNING_KEY", "CLINICAL_MAX_UPLOAD_BYTES", "CLINICAL_SIGNED_URL_TTL_SECONDS")
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"Clinical storage policy must be configured: {', '.join(missing)}")
        if len(settings.signing_key) < 32 or settings.signing_key == b"development-only-clinical-signing-key":
            raise RuntimeError("CLINICAL_SIGNING_KEY must be a unique secret of at least 32 bytes")


class PrivateLocalStorage:
    """Filesystem backend rooted outside any web-served directory."""

    def __init__(self, settings: ClinicalStorageSettings) -> None:
        validate_clinical_storage_settings(settings)
        self.settings = settings
        self.root = settings.root.resolve()
        self.root.mkdir(mode=0o700, parents=True, exist_ok=True)
        try:
            self.root.chmod(0o700)
        except OSError:
            if settings.environment == "production":
                raise RuntimeError("Private clinical storage permissions could not be restricted") from None

    def new_storage_key(self) -> str:
        return secrets.token_hex(24)

    def write(self, storage_key: str, content: bytes) -> None:
        path = self._path(storage_key)
        temporary = self.root / f".{storage_key}.{secrets.token_hex(8)}.tmp"
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        descriptor = os.open(temporary, flags, 0o600)
        try:
            with os.fdopen(descriptor, "wb") as output:
                output.write(content)
                output.flush()
                os.fsync(output.fileno())
            os.replace(temporary, path)
            try:
                path.chmod(0o600)
            except OSError:
                if self.settings.environment == "production":
                    path.unlink(missing_ok=True)
                    raise RuntimeError("Private clinical file permissions could not be restricted") from None
        finally:
            temporary.unlink(missing_ok=True)

    def read_path(self, storage_key: str) -> Path:
        path = self._path(storage_key)
        if not path.is_file() or path.is_symlink():
            raise FileNotFoundError(storage_key)
        return path

    def _path(self, storage_key: str) -> Path:
        if not re.fullmatch(r"[0-9a-f]{48}", storage_key):
            raise ValueError("Invalid private storage key")
        path = self.root / f"{storage_key}.pdf"
        if path.parent.resolve() != self.root:
            raise ValueError("Storage path escaped private root")
        return path


def validate_pdf(content: bytes, max_bytes: int) -> str:
    if not content or len(content) > max_bytes:
        raise HTTPException(status_code=413 if len(content) > max_bytes else 415, detail="INVALID_FILE_SIZE")
    if not content.startswith(b"%PDF-") or b"%%EOF" not in content[-2048:]:
        raise HTTPException(status_code=415, detail="INVALID_FILE_CONTENT")
    normalized = content.lower()
    if any(marker in normalized for marker in _ACTIVE_PDF_FEATURES):
        raise HTTPException(status_code=415, detail="UNSAFE_FILE_CONTENT")
    return hashlib.sha256(content).hexdigest()


def sign_download(document_id: UUID, expires: int, settings: ClinicalStorageSettings) -> str:
    message = f"{document_id}:{expires}".encode("ascii")
    return hmac.new(settings.signing_key, message, hashlib.sha256).hexdigest()


def verify_download(document_id: UUID, expires: int, signature: str, settings: ClinicalStorageSettings, now: int) -> bool:
    if expires <= now or expires > now + settings.signed_url_ttl_seconds:
        return False
    expected = sign_download(document_id, expires, settings)
    return hmac.compare_digest(expected, signature)
