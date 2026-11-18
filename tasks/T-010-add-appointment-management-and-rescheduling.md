# T-010 — Add appointment management and rescheduling

- **Milestone:** M3
- **Requirement IDs:** FR-015,FR-016,FR-017,FR-018,FR-033,ADM-020,WF-004
- **Files likely touched:** backend/api/v1/appointments; frontend/app/admin/appointments; frontend/app/dentist/appointments
- **Dependencies:** T-009,T-007
- **Tool:** Codex — Role-scoped transitions and revalidation are backend state-machine work.
- **Size:** M
- **Open question blockers:** TBD:cancellation_policy; TBD:appointment_states

## Acceptance criteria

- Patient can request changes only to own appointment
- staff can perform permitted transitions
- reschedule revalidates availability transactionally
- dentist sees assigned bookings only.
