# T-005 — Create database migrations and core schema

- **Milestone:** M2
- **Requirement IDs:** FR-021,FR-029,FR-034,NFR-003,NFR-013
- **Files likely touched:** backend/db; backend/migrations; backend/models
- **Dependencies:** T-001
- **Tool:** Codex — Migrations and database invariants require deterministic code and review.
- **Size:** L
- **Open question blockers:** TBD:schema_decisions; TBD:retention_period; TBD:operatory_policy

## Acceptance criteria

- Fresh database migrates to approved tables
- IDs are opaque UUIDs
- FK/unique constraints match approved schema
- dentist and operatory overlap constraints reject collisions.
