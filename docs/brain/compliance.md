# Compliance checklist — review required

Every legal or regulatory item below is marked **NEEDS LEGAL REVIEW**. Research citations point to the source entries in `docs/01-research.md`; findings there may be incorrect, stale, or incomplete and are not legal advice.

| Checklist item | Feature mapping | Status | Research source | Owner role |
|---|---|---|---|---|
| Determine applicable DPDPA commencement, notices, rights, breach duties and consent design | FR-008, FR-028, NFR-014, POR-008 | NEEDS LEGAL REVIEW | `docs/01-research.md` A.1.1–A.1.5 | Clinic owner + qualified Indian counsel |
| Confirm child-data handling and verifiable guardian authority/consent | FR-028, POR-007, family links | NEEDS LEGAL REVIEW | A.1.3 | Clinic owner + qualified Indian counsel |
| Confirm IT Act/SPDI transition, security practices and privacy disclosures | NFR-003, NFR-014 | NEEDS LEGAL REVIEW | A.2.1 | Clinic owner + qualified Indian counsel + security lead |
| Confirm CERT-In reporting, India log storage and NTP requirements | NFR-008, NFR-013, incident process | NEEDS LEGAL REVIEW | A.3.1–A.3.3 | Clinic owner + qualified Indian counsel + infrastructure lead |
| Confirm clinic establishment, municipal, shop registration, biomedical waste and radiation licensing applicability | public clinic facts, ADM-013 | NEEDS LEGAL REVIEW | A.4.1–A.4.3 | Clinic owner + qualified Indian counsel |
| Confirm dental advertising, professional conduct, testimonials, gallery, dentist facts and preview restrictions | FR-044–047, PUB-004/005, AI-005 | NEEDS LEGAL REVIEW | A.5.1; recommended changes §“Recommended SRS Changes” item 1–2 | Clinic owner + qualified Indian counsel + clinical lead |
| Review healthcare marketing claims, outcomes, prices and consumer-facing content | FR-030, FR-044–047, PUB-001–007 | NEEDS LEGAL REVIEW | A.6.1–A.6.2 | Clinic owner + qualified Indian counsel |
| Confirm e-commerce disclosures, grievance officer, refunds/cancellation and online payment obligations | FR-034–038, PUB-007 | NEEDS LEGAL REVIEW | A.6.3; Q-002, Q-010 in `docs/00-analysis.md` | Clinic owner + qualified Indian counsel + finance lead |
| Confirm TRAI DLT registration, templates, consent and SMS purpose rules | FR-003, FR-039–043 | NEEDS LEGAL REVIEW | B.1.1–B.1.2 | Clinic owner + qualified Indian counsel + messaging provider owner |
| Do not dispatch SMS unless a clinic-approved DLT template ID and sender ID are recorded; preserve approved template text and bounded typed variables, and confirm current provider scrubbing requirements before production | FR-039–043 | NEEDS LEGAL REVIEW | `docs/01-research.md` B.1.1–B.1.2; research findings require counsel/provider confirmation | Clinic owner + qualified Indian counsel + messaging provider owner |
| Confirm WhatsApp opt-in, approved templates and business platform rules | FR-039–043 | NEEDS LEGAL REVIEW | B.2.1–B.2.2 | Clinic owner + qualified Indian counsel + messaging provider owner |
| Confirm payment gateway onboarding, webhook verification, refund and PCI scope | FR-034–038, ADM-007/022 | NEEDS LEGAL REVIEW | C.1.1–C.1.5 | Clinic owner + qualified Indian counsel + finance lead |
| Confirm retention periods, deletion holds, medical record retention and family access | FR-027–028, NFR-014 | NEEDS LEGAL REVIEW | SRS §14; analysis §4.3, Q-004; research A.1 | Clinic owner + qualified Indian counsel + clinical lead |
| Approve urgency questionnaire/red flags, emergency language and escalation destinations | AI-002, AI-007, WF-003 | NEEDS LEGAL REVIEW | E.4.1 (explicit clinician review only); Q-007 | Clinical lead + clinic owner + qualified Indian counsel |
| Verify AI provider DPA, retention, residency, training and vendor terms | AI-001/007, NFR-014 | NEEDS LEGAL REVIEW | E.1.1–E.3.1 | Clinic owner + privacy/legal lead + AI provider owner |
| Confirm GST/SAC treatment for each service and invoice fields | FR-035–037, ADM-007 | NEEDS LEGAL REVIEW | Recommended SRS Changes item 5; analysis §8 Part C.13 | Clinic owner + qualified Indian counsel + finance lead |
| Confirm document consent, patient image use and marketing consent separation | FR-008, FR-047, ADM-009 | NEEDS LEGAL REVIEW | SRS §14.2; A.5.1; A.6.1 | Clinic owner + qualified Indian counsel + content approver |

No legal position is resolved by this checklist. Confirm current law and applicability with qualified Indian counsel and relevant clinical/regulatory authorities before release.

Deployment open-item status, including technical gates and named owner roles, is maintained in [`docs/deployment/launch-checklist.md`](../deployment/launch-checklist.md). Owner roles are accountable assignments, not evidence of completion or legal approval.
