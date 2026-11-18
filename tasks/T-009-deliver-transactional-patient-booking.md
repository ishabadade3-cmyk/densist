# T-009 — Deliver transactional patient booking

- **Milestone:** M3
- **Requirement IDs:** FR-012,FR-013,FR-014,WF-001
- **Files likely touched:** backend/api/v1/appointments; backend/scheduling; frontend/app/book; backend/tests/appointments
- **Dependencies:** T-006,T-008
- **Tool:** Codex — Booking correctness relies on database transactions and exclusion constraints.
- **Size:** L
- **Open question blockers:** TBD:appointment_states; TBD:booking_policy; TBD:operatory_policy

## Acceptance criteria

- Eligible patient can book/request a slot
- concurrent overlaps create at most one active appointment
- conflict response is returned and availability refreshes
- client cannot bypass policy by setting status.
