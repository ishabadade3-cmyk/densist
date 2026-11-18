#!/bin/sh
set -eu

archive="${1:-}"
: "${BACKUP_AGE_IDENTITY_FILE:?Mount the private age identity and set BACKUP_AGE_IDENTITY_FILE}"
: "${PGHOST:?PGHOST is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"

case "$archive" in
  /backups/dental-*.tar.gz.age) ;;
  *) echo "provide one encrypted /backups/dental-*.tar.gz.age archive" >&2; exit 2 ;;
esac
test -r "$BACKUP_AGE_IDENTITY_FILE" || { echo "age identity is not readable" >&2; exit 2; }
work="$(mktemp -d)"
restore_db="restore_verify_$(date -u +%Y%m%d%H%M%S)"
cleanup() {
  dropdb --if-exists --maintenance-db=postgres "$restore_db" >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT HUP INT TERM

age --decrypt --identity "$BACKUP_AGE_IDENTITY_FILE" "$archive" | tar -xzf - -C "$work"
test -s "$work/database.dump"
test -d "$work/clinical-data"
createdb --maintenance-db=postgres "$restore_db"
pg_restore --no-owner --clean --if-exists --dbname="$restore_db" "$work/database.dump"
table_count="$(psql --tuples-only --no-align --dbname="$restore_db" \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")"
file_count="$(find "$work/clinical-data" -type f | wc -l | tr -d ' ')"
test "$table_count" -gt 0
echo "restore_copy_verified tables=${table_count} clinical_files=${file_count} database=${restore_db}"
