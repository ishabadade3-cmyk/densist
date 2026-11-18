# T-020 — Add deterministic urgency gate before LLM

- **Milestone:** M7
- **Requirement IDs:** AI-002,AI-007,WF-003
- **Files likely touched:** backend/assistant/urgency_rules; backend/api/v1/assistant/urgency; backend/tests/urgency
- **Dependencies:** T-019
- **Tool:** Codex — The pre-LLM bypass must be provable independently of generated output.
- **Size:** L
- **Open question blockers:** TBD:clinical_triage_signoff; TBD:emergency_contacts; TBD:ai_test_corpus

## Acceptance criteria

- Approved red-flag fixtures return approved handoff
- flagged input causes zero LLM calls
- unapproved rules keep feature disabled
- non-flagged input reaches LLM only after deterministic check.
