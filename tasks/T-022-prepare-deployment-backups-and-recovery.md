# T-022 — Prepare deployment, backups and recovery

- **Milestone:** M8
- **Requirement IDs:** NFR-002,NFR-007,NFR-008,NFR-013
- **Files likely touched:** deploy; infra; ops/runbooks; monitoring
- **Dependencies:** T-021,T-017,T-018
- **Tool:** Codex — Deployment repeatability and restore procedures are operational artifacts needing evidence.
- **Size:** L
- **Open question blockers:** TBD:hosting_provider; TBD:region_approval; TBD:rto_rpo; TBD:incident_contacts

## Acceptance criteria

- Deployment uses approved environment without committed secrets
- HTTPS/health checks work
- encrypted backup restores within approved objectives
- rollback and incident runbooks identify confirmed owners.
