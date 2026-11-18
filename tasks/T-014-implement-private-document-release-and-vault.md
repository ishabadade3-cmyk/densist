# T-014 — Implement private document release and vault

- **Milestone:** M5
- **Requirement IDs:** FR-025,FR-026,FR-027,POR-005,ADM-017
- **Files likely touched:** backend/storage; backend/api/v1/documents; frontend/app/portal/documents
- **Dependencies:** T-013,T-007
- **Tool:** Codex — File validation, private storage and release authorization are security-sensitive.
- **Size:** M
- **Open question blockers:** TBD:storage_provider; TBD:document_release_policy; TBD:retention_period

## Acceptance criteria

- Disallowed file types/sizes are rejected
- objects are private
- patient retrieves only released own documents
- access/release is audited without identifiers in logs.
