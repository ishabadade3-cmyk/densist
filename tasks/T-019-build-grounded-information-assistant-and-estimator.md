# T-019 — Build grounded information assistant and estimator

- **Milestone:** M7
- **Requirement IDs:** AI-001,AI-003,AI-004,AI-007,ADM-010,WF-003
- **Files likely touched:** backend/assistant; backend/knowledge; backend/api/v1/assistant; frontend/components/assistant
- **Dependencies:** T-004,T-007
- **Tool:** Codex — Grounding and fallback are server-side safeguards suitable for focused validation.
- **Size:** L
- **Open question blockers:** TBD:ai_approved_content; TBD:llm_vendor_contract; TBD:service_prices; TBD:ai_retention

## Acceptance criteria

- Answers cite approved clinic content
- unknown questions hand off safely
- estimator uses approved prices and disclaimer
- endpoint is rate-limited
- patient data is not used to train models.
