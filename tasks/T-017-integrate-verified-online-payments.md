# T-017 — Integrate verified online payments

- **Milestone:** M6
- **Requirement IDs:** FR-034,FR-036,FR-037,FR-038
- **Files likely touched:** backend/payments/provider; backend/api/v1/payments; backend/tests/payments
- **Dependencies:** T-016
- **Tool:** Codex — Signature validation and idempotent callbacks belong in backend integration.
- **Size:** L
- **Open question blockers:** TBD:payment_provider; TBD:payment_policy; TBD:provider_onboarding

## Acceptance criteria

- Forged callbacks never change state
- valid duplicate callbacks are idempotent
- client return cannot mark payment successful
- transitions are audited.
