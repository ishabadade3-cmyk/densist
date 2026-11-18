# T-016 — Implement invoices and offline payments

- **Milestone:** M6
- **Requirement IDs:** FR-034,FR-035,FR-036,FR-038,ADM-007,ADM-022,POR-006
- **Files likely touched:** backend/api/v1/invoices; backend/api/v1/payments; frontend/app/admin/billing
- **Dependencies:** T-005,T-007
- **Tool:** Codex — Billing arithmetic and partial payment states need deterministic server logic.
- **Size:** M
- **Open question blockers:** TBD:tax_rules; TBD:invoice_policy; TBD:payment_policy

## Acceptance criteria

- Staff can issue invoice and record offline payment
- partial payments reconcile
- invalid transitions are rejected
- patient reads only own billing history.
