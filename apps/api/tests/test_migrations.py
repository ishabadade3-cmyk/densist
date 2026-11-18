import os
import subprocess
import sys
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Appointment, Dentist, Patient, Service, User


def test_alembic_revision_chain():
    """Verify that auth storage follows the core schema revision."""
    config = Config("alembic.ini")
    script = ScriptDirectory.from_config(config)

    head = script.get_current_head()
    assert head == "0008_ai_assistant"

    rev_0003 = script.get_revision("0003_auth_rbac")
    assert rev_0003 is not None
    assert rev_0003.down_revision == "0002_core_schema"
    rev_0004 = script.get_revision("0004_staff_content")
    assert rev_0004 is not None
    assert rev_0004.down_revision == "0003_auth_rbac"
    rev_0005 = script.get_revision("0005_clinical_records")
    assert rev_0005 is not None
    assert rev_0005.down_revision == "0004_staff_content"
    rev_0006 = script.get_revision("0006_payments")
    assert rev_0006 is not None
    assert rev_0006.down_revision == "0005_clinical_records"
    rev_0007 = script.get_revision("0007_notifications")
    assert rev_0007 is not None
    assert rev_0007.down_revision == "0006_payments"
    rev_0008 = script.get_revision("0008_ai_assistant")
    assert rev_0008 is not None
    assert rev_0008.down_revision == "0007_notifications"


def test_alembic_offline_sql_generation():
    """Verify that alembic upgrade head --sql executes cleanly and produces expected DDL."""
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head", "--sql"],
        capture_output=True,
        text=True,
        check=True,
    )

    sql = result.stdout
    assert "CREATE EXTENSION IF NOT EXISTS btree_gist" in sql
    assert "CREATE TABLE appointments" in sql
    assert "excl_appointment_dentist_no_overlap" in sql
    assert "excl_appointment_operatory_no_overlap" in sql
    assert "CREATE TABLE patients" in sql
    assert "CREATE TABLE dentists" in sql
    assert "CREATE TABLE invoices" in sql
    assert "CREATE TABLE payment_webhook_events" in sql
    assert "CREATE TABLE payment_refunds" in sql
    assert "provider_order_id" in sql
    assert "CREATE TABLE notification_templates" in sql
    assert "CREATE TABLE notification_attempts" in sql
    assert "CREATE TABLE staff_tasks" in sql
    assert "CREATE EXTENSION IF NOT EXISTS vector" in sql
    assert "CREATE TABLE knowledge_documents" in sql
    assert "CREATE TABLE knowledge_chunks" in sql
    assert "vector NOT NULL" in sql
    assert "CREATE TABLE ai_usage_counters" in sql


def test_postgres_migration_rollback_and_database_overlap_constraint():
    database_url = os.environ.get("TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("TEST_DATABASE_URL is required for PostgreSQL integration checks")

    from sqlalchemy import create_engine

    engine = create_engine(database_url)
    schema = f"migration_test_{uuid.uuid4().hex}"
    try:
        with engine.begin() as connection:
            connection.execute(sa.text(f'CREATE SCHEMA "{schema}"'))
        with engine.connect() as connection:
            connection.execute(sa.text(f'SET search_path TO "{schema}", public'))
            connection.commit()
            config = Config("alembic.ini")
            config.attributes["connection"] = connection
            command.upgrade(config, "head")
            connection.commit()

            tables = set(sa.inspect(connection).get_table_names()) - {"alembic_version"}
            assert tables == {
                "users", "staff", "patients", "dentists", "operatories", "services",
                "appointments", "medical_records", "treatments", "treatment_stages",
                "prescriptions", "invoices", "payments", "notifications", "reviews",
                "consents", "ai_conversations", "ai_messages", "audit_logs",
                "patient_family_links", "dentist_schedules", "dentist_leaves",
                "appointment_waitlist", "patient_clinical_alerts", "otp_verifications",
                "auth_sessions", "user_mfa", "auth_rate_limits",
                "website_content",
                "medical_record_versions", "patient_medical_histories", "clinical_documents",
                "payment_webhook_events", "payment_refunds",
                "notification_templates", "notification_attempts", "staff_tasks",
                "knowledge_documents", "knowledge_chunks", "ai_usage_counters",
            }
            for table_name in tables:
                column_info = {column["name"]: column for column in sa.inspect(connection).get_columns(table_name)}
                assert column_info["created_at"]["nullable"] is False
                assert column_info["updated_at"]["nullable"] is False

            with Session(bind=connection) as session:
                user = User(name="SAMPLE ONLY dentist", role="dentist", status="active")
                patient = Patient()
                dentist = Dentist(user=user, qualification="SAMPLE ONLY qualification")
                service = Service(service_name="[SAMPLE ONLY] Service", active=False)
                session.add_all([user, patient, dentist, service])
                session.flush()
                updated = connection.execute(sa.text(
                    "UPDATE users SET updated_at = '2000-01-01T00:00:00Z' "
                    "WHERE user_id = :user_id RETURNING updated_at"
                ), {"user_id": user.user_id}).scalar_one()
                assert updated > datetime(2000, 1, 1, tzinfo=timezone.utc)
                starts = datetime.now(timezone.utc)
                first = Appointment(
                    patient=patient, dentist=dentist, service=service,
                    start_time=starts,
                    end_time=starts + timedelta(hours=1),
                    status="scheduled",
                )
                session.add(first)
                session.flush()
                second = Appointment(
                    patient=patient, dentist=dentist, service=service,
                    start_time=starts + timedelta(minutes=30),
                    end_time=starts + timedelta(minutes=90),
                    status="scheduled",
                )
                session.add(second)
                with pytest.raises(IntegrityError):
                    session.flush()
                session.rollback()

            command.downgrade(config, "base")
            connection.commit()
            remaining = set(sa.inspect(connection).get_table_names()) - {"alembic_version"}
            assert not remaining
    finally:
        with engine.begin() as connection:
            connection.execute(sa.text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        engine.dispose()
