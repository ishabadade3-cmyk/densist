# Encrypted backup and restore

The `backup` service takes recurring PostgreSQL custom-format dumps and a copy of the private clinical storage volume. It packages both, encrypts the archive with the configured age public recipient, writes only the encrypted archive to `BACKUP_DIRECTORY`, and removes expired encrypted archives according to the configured retention period. Output contains only timestamps and operation codes. The backup interval and retention are unresolved policy values; set them only after approval.

## First backup check

After deployment, inspect `docker compose ... logs backup` for `encrypted_backup_completed`. Verify that a new `dental-<UTC timestamp>.tar.gz.age` exists in the protected backup directory and has non-zero size. A missing file, `.tmp` file, or `encrypted_backup_failed` line means the backup is not accepted. Monitor free disk space and alert on stale backup age.

## Demonstrate a restore into a disposable copy

Run this before launch and periodically thereafter. It creates a separate database named `restore_verify_<UTC timestamp>`, restores the archive into it, checks that database tables and the restored clinical-file copy are readable, reports counts only, then drops the temporary database and removes the temporary files. It does not overwrite the production database or clinical volume.

1. Retrieve the matching age private identity from the separate recovery store. On the deployment host, stage it in a protected temporary file outside the repository; restrict permissions to the recovery operator and remove it after the exercise.
2. Select a specific encrypted archive. Do not decrypt to the persistent backup directory.
3. Run from repository root, substituting the actual archive filename and protected identity path:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm \
  --entrypoint /usr/local/bin/restore-copy \
  -e BACKUP_AGE_IDENTITY_FILE=/run/restore/identity \
  -v /secure/recovery/age-identity.txt:/run/restore/identity:ro \
  backup /backups/dental-<timestamp>.tar.gz.age
```

4. Accept only `restore_copy_verified tables=<count> clinical_files=<count> database=restore_verify_<timestamp>` with non-zero table count and successful process exit. Record archive timestamp, elapsed time, counts, outcome, operator role, and follow-up issue in the recovery log. Do not record patient names, identifiers, clinical values, or archive contents.
5. Confirm the disposable database was dropped, securely remove the staged identity according to the host's media policy, and confirm the normal backup loop is still healthy.

For actual disaster recovery, restore into an isolated replacement environment, validate schema and application health, verify storage files, then obtain the named incident commander and clinic owner approval before traffic cutover. Never test restores against the only production database or live storage volume.

## Recovery targets and limitations

RTO, RPO, backup interval, retention period, off-host replication, age key custody, and clinical record retention are not specified by approved sources. Track them as open items in `launch-checklist.md`; backups on the same host do not survive host loss. Choose off-host encrypted replication and recovery objectives with the hosting owner before launch.
