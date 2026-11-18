# T-008 — Implement service, dentist and availability APIs

- **Milestone:** M3
- **Requirement IDs:** FR-009,FR-010,FR-011,ADM-003,ADM-004
- **Files likely touched:** backend/api/v1/services; backend/api/v1/dentists; backend/api/v1/availability; backend/scheduling
- **Dependencies:** T-005,T-007
- **Tool:** Codex — Slot calculation is deterministic and backed by schedule/leave data.
- **Size:** M
- **Open question blockers:** TBD:service_catalogue; TBD:dentist_schedules; TBD:operatory_policy; TBD:timezone_policy

## Acceptance criteria

- Returned slots fit dentist schedule and service duration, exclude leave, and have free dentist and operatory
- invalid ranges return validation errors.
