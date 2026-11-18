# Production deployment

This repository provides a single-host Docker Compose deployment profile. It is an operational baseline, not a claim of 99.9% availability or legal approval. The hosting provider, clinic domain, operational contacts, and provider adapters remain unresolved. See the launch checklist before using production patient data.

## What runs

- `proxy`: Caddy terminates HTTPS and obtains/renews certificates for the configured domain. It routes `/api/*` to the API and other requests to the web app. Only ports 80 and 443 are published.
- `web`: production Next.js standalone image, non-root user, internal port 3000.
- `api`: production FastAPI image, non-root user, runs Alembic migrations before starting, internal port 8000, and exposes a health check.
- `db`: PostgreSQL 16 with pgvector 0.8.0. It has no published host port.
- `backup`: scheduled database and private clinical-file backup, encrypted to an age public recipient before writing to the host backup directory.

The API needs egress for selected external providers. The `private` network is internal; only the API is also attached to `egress`. Use firewall rules and the host provider to restrict outbound destinations where practical. The proxy is attached to the `edge` network and the internal application network.

## Prerequisites

- A supported Linux host with Docker Engine and Docker Compose v2.
- A DNS name with A/AAAA records pointing to that host; inbound TCP 80/443 and UDP 443 allowed.
- A host directory with restricted permissions for encrypted backups and enough space for retention.
- An age key pair. Keep the private identity in a separate, access-controlled secret store/offline recovery location; do not place it on the deployment host beside the backups.
- Clinic-approved production auth, consent, upload, AI and retention policies; working production OTP and notification provider adapters; approved public clinic content; legal and clinical launch approvals.

## Prepare secrets and configuration

1. Copy `.env.production.example` to `.env.production` on the host. Do not commit it. Set its owner to the deployment operator and permissions to `0600`.
2. Generate values with a trusted host secret generator. Use `openssl rand -hex 32` for `POSTGRES_PASSWORD`, `AUTH_OTP_PEPPER`, `AUTH_RATE_LIMIT_SECRET`, `CLINICAL_SIGNING_KEY`, and `AI_RATE_LIMIT_SECRET`; these hex values are URL-safe for database URL interpolation. Generate `MFA_ENCRYPTION_KEY` as a Fernet-compatible URL-safe base64 key, for example with `python3 -c 'import base64,secrets; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())'` in an approved secure environment.
3. Generate an age key pair with `age-keygen`; put only its public recipient in `BACKUP_AGE_RECIPIENT`. Protect the private identity separately and verify that a recovery operator can retrieve it.
4. Fill policy values only after the accountable clinic owner and relevant clinician/counsel/provider approve them. Required values intentionally have no defaults. This repository currently has no production OTP adapter registered; the API fails closed at startup without one. Notification provider factories are deployment modules and must be included in a reviewed image before use. These are open implementation gates, not values that can be solved by editing this file.
5. Set `BACKUP_DIRECTORY` to an absolute host path. Create it with mode `0700` and ownership matching UID/GID `10001`, the backup image's unprivileged user. Size `BACKUP_TMP_SIZE_BYTES` to accommodate a database dump and clinical-file archive during backup and restore; obtain the expected data size and capacity approval first.
6. Set the clinic domain and certificate email only after clinic ownership and DNS are verified.

Do not put patient records, real passwords, API keys, private age identities, or production environment dumps in tickets, Git, images, or this documentation. Keep encryption recovery material independent from the backup storage failure domain.

## Build and deploy

Run from the repository root on the deployment host:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.production -f docker-compose.prod.yml build --pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

The first successful API startup migrates the database. Check `https://<configured-domain>/` and `https://<configured-domain>/api/v1/health`; do not substitute an invented clinic URL. Check that the certificate is valid, `/api/v1/health` returns 200, and Caddy sets the configured security headers. Do not expose PostgreSQL or the API directly to the public network.

The web image runs the production content check. It intentionally fails while published clinic-specific facts remain `TBD`; resolve and approve `docs/brain/content-bank.md` before attempting a production build. The AI assistant remains disabled until clinician-approved deterministic urgency rules and a provider policy are implemented. Do not enable placeholder urgency rules in production.

## Operations

- Inspect service state: `docker compose --env-file .env.production -f docker-compose.prod.yml ps`.
- Inspect recent service logs: `docker compose --env-file .env.production -f docker-compose.prod.yml logs --since=15m api web proxy db backup`. Logs must not contain patient identifiers, request bodies, clinical content, credentials, or payment data; do not attach raw production logs to support cases.
- Follow [backup and restore](backup-restore.md), [monitoring](monitoring.md), [incident response](incident-response.md), and the [launch checklist](launch-checklist.md).
- Deploy a reviewed image build and preserve a tested rollback image. Do not run `docker compose down --volumes` in production.

## Configuration inventory

The environment template lists deployment values, not their approvals. Ownership of unresolved values is assigned in `launch-checklist.md` and `docs/brain/open-questions.md`. Production release is blocked until those rows are resolved or explicitly accepted by their named owner role, and legal/clinical approvals are recorded.
