# T-006 — Implement authentication and session lifecycle

- **Milestone:** M2
- **Requirement IDs:** FR-001,FR-002,FR-003,FR-004,FR-006,NFR-003
- **Files likely touched:** backend/auth; backend/api/v1/auth; frontend/app/auth
- **Dependencies:** T-005
- **Tool:** Codex — Credentials, OTPs, sessions and recovery need server-side security controls.
- **Size:** L
- **Open question blockers:** TBD:auth_policy; TBD:messaging_provider

## Acceptance criteria

- Valid registration/login/recovery/logout flows work
- expired/invalid credentials fail
- OTP secrets are hashed and expire
- rate limits and secure session expiry are enforced.
