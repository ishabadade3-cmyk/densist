import json
import sqlite3
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.dialects.postgresql import ARRAY, CITEXT, JSONB, ExcludeConstraint
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

sqlite3.register_adapter(list, json.dumps)
sqlite3.register_adapter(dict, json.dumps)


# Naming convention for constraints to ensure stable Alembic migrations
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


def generate_uuid(*args, **kwargs) -> uuid.UUID:
    """Generate cryptographically secure opaque UUIDv4."""
    return uuid.uuid4()


def utc_now(*args, **kwargs) -> datetime:
    """Return timezone-aware current UTC timestamp."""
    return datetime.now(timezone.utc)


class TimestampMixin:
    """UTC timestamps shared by every persisted entity."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now,
        server_default=func.now(), nullable=False,
    )


# SQLite compilation compatibility for local development & non-postgres testing
@compiles(CITEXT, "sqlite")
def _compile_citext_sqlite(type_, compiler, **kw):
    return "TEXT"


@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


@compiles(ARRAY, "sqlite")
def _compile_array_sqlite(type_, compiler, **kw):
    return "TEXT"


@compiles(ExcludeConstraint, "sqlite")
def _compile_exclude_constraint_sqlite(element, compiler, **kw):
    return None
