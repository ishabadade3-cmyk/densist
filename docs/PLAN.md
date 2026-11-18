# Delivery plan

Plan derived from `brain.md`, `docs/brain/requirements.md`, `data-model.md`, and `api-contract.md`. Tasks are ordered vertical slices across the requested milestones. Task detail and acceptance criteria live in the referenced `tasks/T-*.md` files. Sizes follow the repository convention: S <2 hours, M ~half day, L ~one day; nothing is planned above L. All dates and durations remain estimates until open blockers are resolved.

## Milestones and tasks

| Milestone | Slice | Tasks |
|---|---|---|
| M0 — Scaffold and design system | Establish reproducible applications, command scripts, tokens and accessible UI foundations. | [T-001](../tasks/T-001-scaffold-applications-and-canonical-commands.md), [T-002](../tasks/T-002-establish-accessible-design-system.md) |
| M1 — Static public site | Responsive shell and verified-information pages; missing clinic facts remain unpublished. | [T-003](../tasks/T-003-create-public-site-shell-and-homepage.md), [T-004](../tasks/T-004-create-static-service-team-about-and-contact-pages.md) |
| M2 — Database, auth and RBAC | Core migrations, secure account flows and resource-scoped authorization. | [T-005](../tasks/T-005-create-database-migrations-and-core-schema.md), [T-006](../tasks/T-006-implement-authentication-and-session-lifecycle.md), [T-007](../tasks/T-007-enforce-role-and-resource-authorization.md) |
| M3 — Appointments end to end | Availability, collision-safe booking and appointment administration. | [T-008](../tasks/T-008-implement-service-dentist-and-availability-apis.md), [T-009](../tasks/T-009-deliver-transactional-patient-booking.md), [T-010](../tasks/T-010-add-appointment-management-and-rescheduling.md) |
| M4 — Patient portal and staff dashboards | Patient self-service and scoped clinic workspaces. | [T-011](../tasks/T-011-build-patient-portal-profile-and-appointment-views.md), [T-012](../tasks/T-012-build-staff-and-dentist-dashboards.md) |
| M5 — Clinical records, documents and audit | Authorized clinical workflows, released documents and append-only audit events. | [T-013](../tasks/T-013-implement-clinical-records-and-treatment-journey.md), [T-014](../tasks/T-014-implement-private-document-release-and-vault.md), [T-015](../tasks/T-015-add-append-only-audit-trail.md) |
| M6 — Payments and notifications | Invoice, online/offline payment state, consent-aware delivery. | [T-016](../tasks/T-016-implement-invoices-and-offline-payments.md), [T-017](../tasks/T-017-integrate-verified-online-payments.md), [T-018](../tasks/T-018-deliver-consent-aware-notifications.md) |
| M7 — AI assistant | Grounded clinic information and cost estimate, plus deterministic clinical urgency gate. | [T-019](../tasks/T-019-build-grounded-information-assistant-and-estimator.md), [T-020](../tasks/T-020-add-deterministic-urgency-gate-before-llm.md) |
| M8 — Hardening, deploy and handover | Security/accessibility/performance evidence, operations readiness, legal/content review and handover. | [T-021](../tasks/T-021-harden-security-accessibility-and-performance.md), [T-022](../tasks/T-022-prepare-deployment-backups-and-recovery.md), [T-023](../tasks/T-023-complete-legal-content-review-and-handover.md) |

## Parking lot — deferred, not scheduled

- **AI-005 Virtual Smile Preview:** marked Later in requirements; also requires legal review, consent, deletion and image provider decisions.
- **AI-006 AI Analytics:** marked Later; avoid adding analytics processing before scope, privacy and aggregation requirements are approved.
- **FR-020 Waiting list:** v1.1 requirement; the API/data model can support it later, but no delivery task is scheduled.
- **FR-045 / FR-046 Public reviews and moderation:** v1.1 and legal-sensitive; no public review feature is planned pending legal review.
- **POR-007 Family Profiles:** v1.1; guardian authority and child consent process remain unresolved.
- **ADM-009 Smile gallery / patient-consent proof tooling:** legal disposition of public imagery is unresolved; no gallery publication task is scheduled.

## Critical path

`T-001 → T-005 → T-006 → T-007 → T-008 → T-009 → T-010 → T-013 → T-014/T-015 → T-016 → T-017/T-018 → T-019 → T-020 → T-021 → T-022 → T-023`.

The design/public branch `T-001 → T-002 → T-003 → T-004` can proceed in parallel with backend foundation and feeds approved clinic knowledge into M7. M4 portal/dashboard tasks proceed once authorization and appointment APIs are stable. The production launch gate is T-023; legal review and verified content are prerequisites for public release, not assumptions to bypass.

## Three biggest schedule risks

1. **Unresolved product and schema decisions:** booking states, auth/MFA, operatory capacity, retention, prescription shape and payment rules affect migrations and multiple downstream slices. Resolve OQ-004–OQ-017 before freezing schema or booking workflows.
2. **External onboarding and approvals:** payment, messaging, hosting and AI provider setup may require contracts, KYC, sender registration, data processing terms and regional approval. Delays block M2, M6, M7 or M8 integrations.
3. **Clinical and legal sign-off:** urgency rules cannot be enabled before clinician approval; legal review, advertising constraints, content verification and retention applicability can block AI and public launch. Do not substitute assumptions for approvals.

