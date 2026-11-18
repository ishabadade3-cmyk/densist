"""Add persisted admin-managed website content.

Revision ID: 0004_staff_content
Revises: 0003_auth_rbac
Requirement IDs: FR-044, ADM-008
"""
from collections.abc import Sequence

from alembic import op

from app.models import WebsiteContent

revision: str = "0004_staff_content"
down_revision: str | None = "0003_auth_rbac"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    WebsiteContent.__table__.create(bind=op.get_bind(), checkfirst=False)
    op.execute(
        'CREATE TRIGGER "trg_website_content_updated_at" '
        'BEFORE UPDATE ON "website_content" '
        'FOR EACH ROW EXECUTE FUNCTION set_updated_at_utc()'
    )


def downgrade() -> None:
    op.execute('DROP TRIGGER IF EXISTS "trg_website_content_updated_at" ON "website_content"')
    WebsiteContent.__table__.drop(bind=op.get_bind(), checkfirst=False)
