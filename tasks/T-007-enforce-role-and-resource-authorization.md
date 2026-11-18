# T-007 — Enforce role and resource authorization

- **Milestone:** M2
- **Requirement IDs:** FR-007,FR-022,FR-023,ADM-023,NFR-003
- **Files likely touched:** backend/authz; backend/api/v1/dependencies; backend/tests/authz
- **Dependencies:** T-006
- **Tool:** Codex — Central authorization logic needs consistent API-level checks and regression coverage.
- **Size:** M
- **Open question blockers:** TBD:role_permission_matrix; TBD:resource_assignment_policy

## Acceptance criteria

- Patient cannot read another patient's records
- receptionist cannot read clinical notes
- dentist access is scoped
- unauthorized calls return consistent 403/404.
