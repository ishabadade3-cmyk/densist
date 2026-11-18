# Dental platform project brain

## 1. Purpose and source of truth
Documentation baseline for a single-clinic dental website, booking platform, patient portal and clinic administration system in India. Source priority: approved decisions (currently missing: `docs/brain/decisions.md`), then SRS `docs/source/SRS.md`, analysis `docs/00-analysis.md`, research `docs/01-research.md`. Research interpretations and legal summaries require verification; they are not approved policy.

## 2. Status
Documentation baseline created from supplied sources. Requirement implementation status is tracked in `docs/brain/requirements.md` and `docs/brain/progress.md`; scaffold, design, public pages, booking/portal, database/auth, and staff API/UI work have varying complete or pending-verification states. This file is a project guide, not an implementation specification for unresolved decisions.

## 3. Requirement and design references
- Traceability: `docs/brain/requirements.md`
- Schema: `docs/brain/data-model.md`
- REST contract: `docs/brain/api-contract.md`
- Visual system: `docs/brain/design-system.md`
- AI safety: `docs/brain/ai-safety.md`
- Legal mapping: `docs/brain/compliance.md`
- Clinic-specific facts: `docs/brain/content-bank.md`
- Unresolved matters: `docs/brain/open-questions.md`
- Progress: `docs/brain/progress.md`

## 4. Non-negotiable safeguards
- AI never diagnoses or prescribes.
- Urgency rules are deterministic and clinician-approved. They run before any LLM call; red-flag paths do not call an LLM.
- Least-privilege access with resource-level checks on every protected resource.
- Payment status comes only from server-side verification or trusted authenticated provider callbacks.
- Database constraints prevent double booking for dentist and operatory time ranges.
- No patient identifiers in logs.
- No model training on patient data.
- Consent before marketing and image use.

## 5. Data and API conventions
Use PostgreSQL, opaque non-guessable public UUIDs, explicit authorization, HTTPS, server-side validation, transactional state changes and documented errors. The schema and API are proposals where source documents do not specify details. Never expose sequential/internal identifiers as public resource IDs. Never trust a client-supplied payment status.

## 6. Clinic content
Do not invent clinic facts or publish sample-looking values. Use `TBD:<key>` only in documentation; all keys belong in `docs/brain/open-questions.md` and `docs/brain/content-bank.md`. Empty content remains unpublished.

## 7. Clinical and AI boundaries
Use only approved clinic knowledge for factual clinic responses. Clinical urgency rules require explicit clinical approval. Hand off uncertainty and high-risk questions. Keep AI logs minimal and pseudonymous; retention and vendor terms remain TBD. Follow `docs/brain/ai-safety.md`.

## 8. Legal and compliance boundaries
Every legal item in `docs/brain/compliance.md` is **NEEDS LEGAL REVIEW**. Verify current rules, applicability, provider terms and clinic-specific facts with qualified counsel and relevant authorities before launch. Research sources are leads, not legal conclusions.

## 9. Accessibility and design
Target WCAG 2.2 AA per SRS NFR-006. Tokens and interaction requirements are in `docs/brain/design-system.md`; only the SRS palette and font direction are source-defined. Other scale values are proposals pending approval.

## 10. Missing user-provided materials
The request referenced an anti-hallucination block and brain.md skeleton, but no text was supplied. This file uses source-grounded safeguards and a compact structure; obtain the intended text if exact conformance is required. `docs/brain/decisions.md` was not present during source review.

## 11. Definition of documentation readiness
Requirements have traceable source IDs; schema lists columns, keys, constraints, indexes, retention and sensitivity; endpoints map to requirements; legal items are review-marked and sourced; clinic-specific facts remain TBD; unresolved decisions are logged. Documentation readiness does not constitute legal, clinical, design, or implementation approval.
