# T-013 — Implement clinical records and treatment journey

- **Milestone:** M5
- **Requirement IDs:** FR-023,FR-024,FR-027,FR-031,FR-032,ADM-015,ADM-016,ADM-017,WF-002
- **Files likely touched:** backend/api/v1/records; backend/api/v1/treatments; frontend/app/dentist/patients
- **Dependencies:** T-005,T-007
- **Tool:** Codex — Clinical write authorization and traceability require backend enforcement.
- **Size:** L
- **Open question blockers:** TBD:clinical_workflow_signoff; TBD:schema_decisions; TBD:retention_period

## Acceptance criteria

- Only authorized clinicians can create/update notes, alerts, plans and stages
- writes record actor/time
- patient view includes only released fields
- receptionist access tests deny notes.
