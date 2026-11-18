"""Empty migration scaffold. Application tables are out of scope for T-001."""
from collections.abc import Sequence

revision: str = "0001_empty"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
