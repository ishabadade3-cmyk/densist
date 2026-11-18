# Dental clinic platform

Monorepo for the dental clinic public site, API, appointment workflows and staff/patient workspaces. Clinic facts, policies and approvals are tracked in `docs/brain`; unknown values remain TBD until their accountable owners resolve them.

## Local development

Prerequisites: Docker Engine with Compose v2, Node.js 22, Python 3.12.7, and GNU Make.

```sh
cp .env.example .env
docker compose up --build
```

Local web: `http://localhost:3000`; API health: `http://localhost:8000/api/v1/health`; PostgreSQL: `localhost:5432`. Values in `.env.example` are local-only development defaults. Never reuse them in production.

Install and check:

```sh
npm ci
python -m pip install -r apps/api/requirements.txt
make lint
make test
```

## Production deployment and operations

Read [`docs/deployment/production.md`](docs/deployment/production.md) before deployment. Production uses the separate `docker-compose.prod.yml` profile, non-root application images, private service networks and Caddy-managed HTTPS. Configure `.env.production` from `.env.production.example` only on the deployment host; the example contains blank values, not credentials.

```sh
make prod-config
make prod-build
make prod-up
```

Production deployment remains gated on verified clinic content, approved policies/provider adapters, security findings, monitoring setup and compliance sign-off. See [`docs/deployment/launch-checklist.md`](docs/deployment/launch-checklist.md). Encrypted backup and isolated restore procedure: [`docs/deployment/backup-restore.md`](docs/deployment/backup-restore.md). Monitoring and incident procedures: [`docs/deployment/monitoring.md`](docs/deployment/monitoring.md), [`docs/deployment/incident-response.md`](docs/deployment/incident-response.md). User handover guides: [`docs/deployment/admin-guide.md`](docs/deployment/admin-guide.md) and [`docs/deployment/staff-guide.md`](docs/deployment/staff-guide.md).

Do not put production secrets, private recovery keys, patient identifiers or clinical data in this repository, container image, general support ticket, or public monitoring payload.

