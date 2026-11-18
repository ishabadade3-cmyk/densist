.PHONY: install up down logs lint test test-api test-web health reconcile-payments dispatch-notifications cleanup-ai-usage red-team-ai clean prod-config prod-build prod-up prod-down prod-logs

install:
	npm ci
	python -m pip install -r apps/api/requirements.txt

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

lint:
	npm run lint:web
	docker compose run --rm api ruff check app tests migrations

test: test-api test-web

test-api:
	docker compose run --rm api pytest

test-web:
	npm run test:web

health:
	curl --fail http://localhost:8000/api/v1/health

reconcile-payments:
	docker compose run --rm api python -m app.payment_reconciliation

dispatch-notifications:
	docker compose run --rm api python -m app.notification_worker

cleanup-ai-usage:
	docker compose run --rm api python -m app.ai_usage_cleanup

red-team-ai:
	docker compose run --rm api python -m app.ai_red_team_runner

clean:
	docker compose down --volumes --remove-orphans

prod-config:
	docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet

prod-build:
	docker compose --env-file .env.production -f docker-compose.prod.yml build --pull

prod-up:
	docker compose --env-file .env.production -f docker-compose.prod.yml up -d

prod-down:
	docker compose --env-file .env.production -f docker-compose.prod.yml down

prod-logs:
	docker compose --env-file .env.production -f docker-compose.prod.yml logs -f

