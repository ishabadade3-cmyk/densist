# T-011 — Build patient portal profile and appointment views

- **Milestone:** M4
- **Requirement IDs:** FR-005,FR-022,FR-026,POR-001,POR-002,POR-003,POR-008
- **Files likely touched:** frontend/app/portal; frontend/components/portal; backend/api/v1/patients/me
- **Dependencies:** T-007,T-009
- **Tool:** Antigravity — Portal workflows require interaction and responsive review against scoped APIs.
- **Size:** M
- **Open question blockers:** TBD:privacy_notice; TBD:consent_texts

## Acceptance criteria

- Patient sees own profile and appointments
- permitted profile edits persist
- loading/empty/error states exist
- consent reflects server state
- keyboard/narrow-screen use works.
