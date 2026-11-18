"""Add versioned approved knowledge chunks and minimal AI usage quotas.

Revision ID: 0008_ai_assistant
Revises: 0007_notifications
Requirement IDs: AI-001, AI-002, AI-003, AI-004, AI-007, WF-003
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.models import AIUsageCounter, KnowledgeChunk, KnowledgeDocument

revision: str = "0008_ai_assistant"
down_revision: str | None = "0007_notifications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public")
    bind = op.get_bind()
    for table in (KnowledgeDocument.__table__, KnowledgeChunk.__table__, AIUsageCounter.__table__):
        table.create(bind=bind, checkfirst=False)
        op.execute(
            f'CREATE TRIGGER "trg_{table.name}_updated_at" '
            f'BEFORE UPDATE ON "{table.name}" '
            'FOR EACH ROW EXECUTE FUNCTION set_updated_at_utc()'
        )


def downgrade() -> None:
    bind = op.get_bind()
    has_content = bind.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM knowledge_documents) OR "
        "EXISTS (SELECT 1 FROM knowledge_chunks) OR EXISTS (SELECT 1 FROM ai_usage_counters)"
    )).scalar_one()
    if has_content:
        raise RuntimeError("Refusing to downgrade: knowledge content or AI quota history exists")
    for table in (AIUsageCounter.__table__, KnowledgeChunk.__table__, KnowledgeDocument.__table__):
        op.execute(f'DROP TRIGGER IF EXISTS "trg_{table.name}_updated_at" ON "{table.name}"')
        table.drop(bind=bind, checkfirst=False)
    # Keep the extension: it may have existed before this revision or be used by other schemas.
