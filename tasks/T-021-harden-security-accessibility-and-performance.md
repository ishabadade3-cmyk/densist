# T-021 — Harden security, accessibility and performance

- **Milestone:** M8
- **Requirement IDs:** NFR-001,NFR-003,NFR-005,NFR-006,NFR-009,NFR-010,NFR-011,NFR-012,NFR-013,NFR-014
- **Files likely touched:** tests/e2e; tests/security; frontend; backend
- **Dependencies:** T-003 through T-020
- **Tool:** Codex — Cross-cutting verification needs repeatable checks across UI, APIs and authorization boundaries.
- **Size:** L
- **Open question blockers:** TBD:acceptance_baselines; TBD:security_review

## Acceptance criteria

- Representative journeys pass keyboard, contrast, responsive and supported-browser checks
- authorization/injection tests pass
- agreed performance targets are measured
- logs contain no patient identifiers.
