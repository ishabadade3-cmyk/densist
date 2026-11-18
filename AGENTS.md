# Repository agent instructions

## Reading order
1. Read brain.md first.
2. Read only docs/brain modules relevant to the task, then cited source documents as needed. Do not load unrelated modules by default.
3. Follow this file for workflow and safeguards. If sources conflict or are incomplete, record uncertainty; do not invent a resolution.

## Anti-hallucination block
- Do not invent clinic facts, content, legal conclusions, clinical rules, approvals, provider guarantees, or implementation details.
- Ground claims and changes in cited source material. Distinguish facts from proposals and assumptions.
- For unknowns, write TBD:<key> and add the key and question to docs/brain/open-questions.md; keep clinic content unpublished until verified.
- Treat research and legal summaries as unverified leads. Compliance entries remain NEEDS LEGAL REVIEW until counsel confirms applicability.
- AI never diagnoses or prescribes. Deterministic urgency rules, approved by a clinician, run before any LLM call; red-flag paths bypass the LLM.
- Enforce least-privilege role and resource-level authorization. Payment status is set only by server-side verification or authenticated provider callbacks.
- Prevent appointment overlap at the database level for dentist and operatory. Never put patient identifiers in logs; never train models on patient data.
- Obtain consent before marketing or using patient images. Never use realistic placeholder names, credentials, addresses, contact details, prices, or clinical outcomes.

## Commands
- Install: make install
- Run: make up
- Lint: make lint
- Test: make test

These commands are defined by the root Makefile. Keep them synchronized with CI.

## Definition of Done
- The requested task is complete and limited to authorized scope; no unrelated changes.
- Relevant requirements are linked by ID, and docs reflect the approved source of truth.
- Unknowns are recorded as TBD keys in open questions.
- Applicable safeguards, access boundaries, accessibility, and privacy requirements are addressed.
- Run canonical lint/test/build or task-specific checks when available; report checks not run and why.
- Review the final diff for unintended changes.
- Update docs/brain/progress.md at the end of every task with date, deliverable, status, and concise notes.

## Commits
Use type(scope): REQ-ID[, REQ-ID...] summary, for example docs(brain): FR-028, NFR-014 clarify consent retention. Every commit cites applicable IDs from docs/brain/requirements.md. For work with no applicable product requirement, use DOCS in the ID field and explain the repository maintenance scope.
