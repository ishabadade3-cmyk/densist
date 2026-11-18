"""One-shot removal job for expired pseudonymous AI quota counters."""

from app.ai_service import cleanup_expired_ai_usage
from app.database import _session_factory


def main() -> int:
    with _session_factory()() as db:
        removed = cleanup_expired_ai_usage(db)
    print(f"expired_ai_counters_removed={removed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
