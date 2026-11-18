#!/bin/bash
set -euo pipefail
umask 077

: "${PGHOST:?PGHOST is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"
: "${BACKUP_AGE_RECIPIENT:?BACKUP_AGE_RECIPIENT is required}"
: "${BACKUP_INTERVAL_SECONDS:?BACKUP_INTERVAL_SECONDS is required}"
: "${BACKUP_RETENTION_DAYS:?BACKUP_RETENTION_DAYS is required}"
: "${CLINICAL_STORAGE_ROOT:?CLINICAL_STORAGE_ROOT is required}"

case "$BACKUP_INTERVAL_SECONDS:$BACKUP_RETENTION_DAYS" in
  *[!0-9:]*|0:*|*:0) echo "backup policy values must be positive integers" >&2; exit 2 ;;
esac
mkdir -p /backups

while :; do
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  output="/backups/dental-${stamp}.tar.gz.age"
  work="$(mktemp -d)"
  trap 'rm -rf "$work"; rm -f "${output}.tmp"' EXIT HUP INT TERM

  if pg_dump --format=custom --no-owner --file "$work/database.dump"; then
    mkdir "$work/clinical-data"
    tar -C "$CLINICAL_STORAGE_ROOT" -cf - . | tar -C "$work/clinical-data" -xf -
    tar -czf - -C "$work" database.dump clinical-data \
      | age --encrypt --recipient "$BACKUP_AGE_RECIPIENT" --output "${output}.tmp"
    mv "${output}.tmp" "$output"
    find /backups -type f -name 'dental-*.tar.gz.age' -mtime "+$BACKUP_RETENTION_DAYS" -delete
    echo "encrypted_backup_completed utc=${stamp}"
  else
    echo "encrypted_backup_failed utc=${stamp} code=pg_dump_failed" >&2
  fi

  rm -rf "$work"
  trap - EXIT HUP INT TERM
  sleep "$BACKUP_INTERVAL_SECONDS"
done
