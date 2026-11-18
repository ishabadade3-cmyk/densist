# T-015 — Add append-only audit trail

- **Milestone:** M5
- **Requirement IDs:** FR-027,NFR-013,ADM-012
- **Files likely touched:** backend/audit; backend/middleware; backend/api/v1/admin/audit
- **Dependencies:** T-007,T-013
- **Tool:** Codex — Audit event coverage and immutability require backend-wide instrumentation.
- **Size:** M
- **Open question blockers:** TBD:audit_retention

## Acceptance criteria

- Critical clinical, permission and financial changes emit append-only actor/action/resource-class/time events
- logs contain no patient identifiers
- review is permission-scoped.
