# T-018 — Deliver consent-aware notifications

- **Milestone:** M6
- **Requirement IDs:** FR-014,FR-019,FR-039,FR-040,FR-041,FR-042,FR-043,ADM-011
- **Files likely touched:** backend/notifications; backend/api/v1/notifications; backend/workers
- **Dependencies:** T-009,T-015
- **Tool:** Codex — Consent gating, retries and provider fallback need observable adapters and jobs.
- **Size:** M
- **Open question blockers:** TBD:messaging_provider; TBD:notification_templates; TBD:consent_texts

## Acceptance criteria

- Events enqueue one intent
- opted-out channels are not used
- approved templates are used
- delivery updates are idempotent
- retries do not duplicate messages.
