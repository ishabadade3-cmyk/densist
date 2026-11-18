from __future__ import annotations

import os
import uuid
from collections.abc import Generator
from types import SimpleNamespace

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from app.auth_routes import get_otp_delivery_provider
from app.database import get_db
from app.main import app


class CapturingOTPProvider:
    def __init__(self) -> None:
        self.codes: dict[tuple[str, str], str] = {}

    def send_code(self, destination: str, code: str, purpose: str) -> None:
        self.codes[(destination, purpose)] = code


@pytest.fixture
def auth_app(monkeypatch: pytest.MonkeyPatch, tmp_path) -> Generator[SimpleNamespace, None, None]:
    database_url = os.environ.get("TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("TEST_DATABASE_URL is required for auth integration tests")

    schema = f"auth_test_{uuid.uuid4().hex}"
    admin_engine = create_engine(database_url)
    with admin_engine.begin() as connection:
        connection.execute(sa.text(f'CREATE SCHEMA "{schema}"'))
    admin_engine.dispose()

    engine = create_engine(database_url)

    @event.listens_for(engine, "connect")
    def set_test_search_path(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute(f'SET search_path TO "{schema}", public')
        cursor.close()

    connection = engine.connect()
    config = Config("alembic.ini")
    config.attributes["connection"] = connection
    command.upgrade(config, "head")
    connection.commit()

    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("MFA_ENCRYPTION_KEY", Fernet.generate_key().decode("ascii"))
    monkeypatch.setenv("AUTH_OTP_PEPPER", "test-only-otp-pepper")
    monkeypatch.setenv("AUTH_RATE_LIMIT_SECRET", "test-only-rate-secret")
    monkeypatch.setenv("AUTH_TRUSTED_ORIGINS", "https://testserver")
    monkeypatch.setenv("CLINICAL_STORAGE_ROOT", str(tmp_path / "private-clinical"))
    monkeypatch.setenv("CLINICAL_SIGNING_KEY", "test-only-clinical-signing-key-0123456789")
    provider = CapturingOTPProvider()

    def override_db() -> Generator[Session, None, None]:
        with Session(engine, expire_on_commit=False) as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_otp_delivery_provider] = lambda: provider
    try:
        with TestClient(app, base_url="https://testserver") as client:
            yield SimpleNamespace(client=client, engine=engine, provider=provider, schema=schema)
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_otp_delivery_provider, None)
        try:
            command.downgrade(config, "base")
            connection.commit()
        finally:
            connection.close()
            engine.dispose()
            with admin_engine.begin() as cleanup:
                cleanup.execute(sa.text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
            admin_engine.dispose()
