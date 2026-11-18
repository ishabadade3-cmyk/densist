# Open questions

No decisions are inferred from unresolved inputs. `TBD:<key>` references identify missing facts or approvals; resolve each here before implementing dependent behavior.

| ID | Open item | TBD key | Source / blocker |
|---|---|---|---|
| OQ-001 | `docs/brain/decisions.md` does not exist; provide authoritative decisions or confirm none exist. | TBD:decision_record | User-designated source missing |
| OQ-002 | Anti-hallucination block and brain.md skeleton referenced by request were not included. | TBD:provided_skeleton_and_rules | User-designated material absent |
| OQ-003 | Choose clinic legal/public identity, brand, address and contacts. | TBD:clinic_legal_name and content-bank keys | SRS §1, §3 |
| OQ-004 | Confirm booking semantics, temporary slot hold, status transition graph and policy-driven cancellation/rescheduling behavior. | TBD:appointment_states; TBD:appointment_transition_policy; TBD:appointment_cancellation_policy; TBD:appointment_reschedule_policy | Analysis Q-001; current T-008 transition proposal is requested→confirmed/cancelled, confirmed→cancelled/completed/no-show, with terminal outcomes; clinic settings and operational policy are not approved |
| OQ-005 | Confirm chair count and whether specialists share operatories. | TBD:operatory_policy | Analysis Q-003 |
| OQ-006 | Select auth flow and privileged MFA approach. | TBD:auth_policy | SRS §4.1; research recommended change 3 |
| OQ-007 | Confirm payment timing, gateway and payment-to-invoice allocations. | TBD:payment_policy | Analysis Q-002; SRS §4.5 |
| OQ-008 | Confirm clinical/legal retention, deletion holds and log partitioning. | TBD:retention_period | Analysis Q-004; research recommended change 6 |
| OQ-009 | Confirm pediatric support, guardian identity/authority verification and family access. | TBD:guardian_process | Analysis Q-005; research A.1.3 |
| OQ-010 | Decide structured prescriptions vs file upload and final prescription fields. | TBD:prescription_schema | Analysis Q-006 |
| OQ-011 | Clinician approve urgency rules and emergency destinations. | TBD:clinical_triage_signoff; TBD:emergency_contacts | Analysis Q-007; research E.4.1 |
| OQ-012 | Decide smile preview and public gallery policy after legal review. | TBD:gallery_policy | Analysis Q-008; research recommended changes 1–2 |
| OQ-013 | Confirm SMS DLT/provider credentials and communication templates. | TBD:messaging_provider | Analysis Q-009; research B.1–B.2 |
| OQ-014 | Confirm cancellation/refund policy and applicable disclosures. | TBD:cancellation_policy | Analysis Q-010 |
| OQ-015 | Confirm GST/SAC per service and invoice numbering/tax policy. | TBD:tax_rules | Analysis §8 Part C.13; research recommended change 5 |
| OQ-016 | Confirm model provider, DPA, data residency, retention, and no-training contract. | TBD:llm_vendor_contract | Research E.1 |
| OQ-017 | Set data types, nullability, status enums, FK delete rules, and uniqueness/index choices with clinic owner. | TBD:schema_decisions | Data model proposals and missing SRS details |
| OQ-018 | Confirm public CMS/API shapes and content publishing workflow. | TBD:public_content_contract | API contract TBD note |
| OQ-019 | Approve design scale, font licenses, motion values and final component states. | TBD:design_tokens | SRS §12.2 specifies only palette/font direction |
| OQ-020 | Define AI and audit conversation retention and approved test fixtures. | TBD:ai_retention; TBD:ai_test_corpus | SRS §5.7, research E.2–E.3 |
| OQ-021 | Legal review of every item in compliance checklist. | TBD:legal_signoff | SRS §14.3; research Topic A–C |
| OQ-022 | Confirm exact requirement inventory and priority for ADM-023 discrepancy: analysis prose says ADM-001–022 but table includes ADM-023. | TBD:inventory_approval | Analysis §1/table and progress.md conflict |
| OQ-028 | Approve session lifetime, OTP lifetime, OTP/login attempt limits, rate-limit window, password minimum, and trusted web origins before production. | TBD:auth_security_policy; TBD:auth_trusted_origins | T-005 development defaults are configurable; no source sets these values |
| OQ-029 | Configure production OTP delivery provider and approve OTP retention/deletion timing. | TBD:auth_otp_production_provider; TBD:otp_retention | SRS §4.1 / §15; only a development console provider is implemented |
| OQ-061 | Select production hosting provider, domain/DNS owner and host hardening baseline. | TBD:hosting_provider; TBD:public_domain | T-017 production deployment; owner: Clinic owner + infrastructure lead |
| OQ-062 | Approve encrypted backup interval, retention, off-host replication and backup directory operations. | TBD:backup_interval; TBD:backup_retention; TBD:offsite_backup | SRS NFR-007; owner: Clinic owner + infrastructure lead |
| OQ-063 | Define age private-key custody, access recovery, rotation and loss procedure. | TBD:backup_key_custody | SRS NFR-007; owner: Infrastructure lead + clinic owner |
| OQ-064 | Approve recovery time and recovery point objectives and restore test cadence. | TBD:rto_rpo; TBD:restore_test_cadence | SRS NFR-008; owner: Clinic owner + infrastructure lead |
| OQ-065 | Select error-tracking provider and approve SDK, data processing, retention, residency and redaction policy. | TBD:error_tracking_provider | SRS §10.2, NFR-003/NFR-014; owner: Security/privacy lead + infrastructure lead |
| OQ-066 | Select independent uptime monitor, probe interval, alert destination and on-call coverage. | TBD:uptime_provider; TBD:uptime_alert_route | SRS NFR-002; owner: Infrastructure lead + clinic owner |
| OQ-067 | Name incident commander, technical on-call, clinical, privacy/legal, finance and communications contacts and deputies. | TBD:incident_contacts | SRS NFR-008; owner: Clinic owner |
| OQ-068 | Verify all clinic-specific public facts and obtain content approval so the production build gate passes. | TBD:verified_clinic_content | SRS §3/§17; owner: Clinic owner + content approver |
| OQ-069 | Supply and production-test OTP and notification provider adapters. | TBD:production_provider_adapters | SRS §4.1/§4.6/§15; owner: Clinic operations + integration lead |
| OQ-070 | Resolve current high-severity OTP plaintext storage and identifier logging finding before launch. | TBD:security_review_otp | T-015 review; owner: API owner + security lead |
| OQ-071 | Size and resource-limit backup/restore scratch storage from measured database and clinical-file volume. | TBD:backup_scratch_capacity | T-017 restore image uses bounded tmpfs; owner: Infrastructure lead |
| OQ-030 | Approve dentist-to-patient assignment semantics; current authorization uses any non-cancelled/non-rescheduled appointment linking them. | TBD:auth_assigned_patient_policy | SRS §2.3 / §16.2; analysis OQ-PLAN-77c51a |
| OQ-031 | Define MFA encryption-key storage, rotation, and recovery procedure. | TBD:auth_mfa_key_management | T-005 encrypts TOTP secrets with an externally configured Fernet key; operations policy is absent |
| OQ-032 | Configure the approved consent policy version before patient consent writes are enabled. | TBD:consent_policy_version | SRS §4.1 / §14.2; user-supplied policy text/version absent |
| OQ-033 | Decide how any pre-existing `staff` or `admin` role values should map to the canonical role set before importing legacy accounts. | TBD:legacy_role_mapping | Existing model comments used broad role labels; T-005 accepts only canonical API roles |
| OQ-034 | Set purge/retention periods for server sessions, MFA/security state and rate-limit records. | TBD:session_retention; TBD:security_retention; TBD:rate_limit_retention | T-005 schema retention notes; no policy source specifies durations |
| OQ-035 | Set retention and revision-history policy for admin-managed website content. | TBD:content_retention | T-008 introduces the persisted CMS entity required by FR-044 / ADM-008; sources do not specify retention/versioning |
| OQ-036 | Confirm walk-in account activation rules and approve the CMS publication authorization workflow. | TBD:walkin_account_activation; TBD:content_publication_approval | T-008 requires safe defaults; clinic workflows were not specified in the contract |
| OQ-037 | Confirm maximum date ranges for admin schedule-calendar and aggregate-report queries. | TBD:staff_calendar_query_range; TBD:staff_report_query_range | T-008 currently caps schedule queries at 93 days and aggregate reports at 366 days as bounded-query safeguards; clinic/reporting policy is unspecified |
| OQ-038 | Confirm approved document file types and maximum upload size. Current implementation accepts PDF only; configurable default limit is 10 MiB. | TBD:clinical_document_upload_policy | FR-025; source does not specify accepted types or limit |
| OQ-039 | Select production private-object-storage provider and approve encryption-at-rest, backup, malware scanning and deletion controls. Current implementation uses a private local filesystem volume with structural PDF checks only. | TBD:clinical_file_storage_controls | FR-025, NFR-003; production storage controls and malware scanning are not established by source |
| OQ-040 | Approve the short-lived download-link lifetime and whether downloads must also require an authenticated session. Current default is five minutes and download checks both signature and session/resource access. | TBD:clinical_document_link_policy | FR-026; policy value and access model require clinic/security approval |
| OQ-041 | Confirm which clinical history, alert and treatment-plan details patients may view, including visibility of proposed plans. Current API exposes own history and alerts and only in-progress/completed plans, omitting stage notes. | TBD:patient_clinical_visibility | FR-023, FR-031, FR-032; SRS does not define patient portal visibility at this level |
| OQ-042 | Confirm whether clinic administrators may view/download all patients' clinical documents and whether release actions require a second reviewer. Current role permits access and release with audit events. | TBD:clinical_admin_document_scope | FR-025, FR-026, NFR-003; role matrix and release workflow need approval |
| OQ-043 | Approve invoice numbering, line-item details, issue/void workflow and whether the current manually entered amount breakdown is sufficient. | TBD:invoice_issuance_policy | FR-035; SRS requires clinic-configured invoices/receipts but omits line-item and numbering rules |
| OQ-044 | Approve invoice status behavior for partial payments and refunds and decide how legacy `verified` payment rows should be reconciled. Existing rows are preserved and are not upgraded to a trusted success status. | TBD:payment_reconciliation_policy; TBD:legacy_payment_reconciliation | FR-036, FR-037; legacy data has no guaranteed provider evidence |
| OQ-045 | Configure the production reconciliation cadence, alerting, stale-checkout age and operator recovery process. A one-shot CLI job exists, but no scheduler is deployed. | TBD:payment_reconciliation_schedule | FR-037; deployment scheduler and operational response are not specified |
| OQ-046 | Confirm whether offline refunds should be recorded through staff with evidence or processed only outside the platform. Current refund endpoint is limited to online Razorpay payments. | TBD:offline_refund_workflow | FR-034, FR-036; no offline refund workflow specified |
| OQ-047 | Complete Razorpay merchant onboarding and configure test/live API and webhook credentials only in deployment environment secrets. | TBD:razorpay_merchant_onboarding | Research C.1.1–C.1.4; credentials and merchant configuration are not supplied |
| OQ-048 | Approve accepted offline method codes and the clinic's currency/tax convention. Current codes are cash, bank_transfer, upi and other; payment currency is INR. | TBD:offline_payment_methods; TBD:payment_currency_tax_policy | FR-034, FR-035; clinic-specific payment and tax policy absent |
| OQ-049 | Confirm whether the generated receipt should remain a JSON-renderable receipt record or produce a signed/downloadable PDF with clinic-specific content. | TBD:payment_receipt_format | FR-035; receipt document format and clinic branding are unspecified |

## Additional TBD key register

Each key below is unresolved and must be answered before the referenced design is finalized.

| Key | Status |
|---|---|
| TBD:accessibility_contact | Open |
| TBD:ai_approved_content | Open |
| TBD:ai_audit_retention | Open |
| TBD:ai_handoff_process | Open |
| TBD:blog_content | Open |
| TBD:booking_policy | Open |
| TBD:clinic_address | Open |
| TBD:clinic_brand | Open |
| TBD:clinic_email | Open |
| TBD:clinic_emergency_contacts | Open |
| TBD:clinic_facilities | Open |
| TBD:clinic_geo | Open |
| TBD:clinic_hours | Open |
| TBD:clinic_licenses | Open |
| TBD:clinic_phone | Open |
| TBD:clinic_story | Open |
| TBD:clinic_whatsapp | Open |
| TBD:consent_texts | Open |
| TBD:dentist_credentials | Open |
| TBD:dentist_roster | Open |
| TBD:dentist_schedules | Open |
| TBD:font_license | Open |
| TBD:gallery_assets | Open |
| TBD:grievance_contact | Open |
| TBD:locale_preferences | Open |
| TBD:motion_standard | Open |
| TBD:notification_templates | Open |
| TBD:otp_retention | Open |
| TBD:payment_methods | Open |
| TBD:privacy_notice | Open |
| TBD:public_claims | Open |
| TBD:retention_policy | Open |
| TBD:review_retention | Open |
| TBD:service_catalogue | Open |
| TBD:service_durations | Open |
| TBD:service_prices | Open |
| TBD:terms | Open |
| TBD:waitlist_retention | Open |
| TBD:auth_session_ttl | Open |
| TBD:auth_otp_ttl | Open |
| TBD:auth_rate_limit_policy | Open |
| TBD:auth_password_policy | Open |
| TBD:auth_security_policy | Open |
| TBD:auth_trusted_origins | Open |
| TBD:auth_otp_production_provider | Open |
| TBD:auth_assigned_patient_policy | Open |
| TBD:auth_mfa_key_management | Open |
| TBD:consent_policy_version | Open |
| TBD:legacy_role_mapping | Open |
| TBD:session_retention | Open |
| TBD:security_retention | Open |
| TBD:rate_limit_retention | Open |
| TBD:clinical_document_upload_policy | Open |
| TBD:clinical_file_storage_controls | Open |
| TBD:clinical_document_link_policy | Open |
| TBD:patient_clinical_visibility | Open |
| TBD:clinical_admin_document_scope | Open |
| TBD:invoice_issuance_policy | Open |
| TBD:payment_reconciliation_policy | Open |
| TBD:legacy_payment_reconciliation | Open |
| TBD:payment_reconciliation_schedule | Open |
| TBD:offline_refund_workflow | Open |
| TBD:razorpay_merchant_onboarding | Open |
| TBD:offline_payment_methods | Open |
| TBD:payment_currency_tax_policy | Open |
| TBD:payment_receipt_format | Open |
| TBD:notification_provider_adapters | Open |
| TBD:notification_template_approval | Open |
| TBD:notification_retry_policy | Open |
| TBD:notification_reminder_schedule | Open |
| TBD:notification_retention | Open |
| TBD:notification_template_retention | Open |
| TBD:staff_task_retention | Open |
| TBD:notification_channel_cascade | Open |
| TBD:ai_provider_adapter | Open |
| TBD:ai_chunking_and_embedding | Open |
| TBD:ai_retrieval_threshold | Open |
| TBD:ai_quota_policy | Open |
| TBD:ai_knowledge_retention | Open |

## Notifications questions

| ID | Open item | TBD key | Source / blocker |
|---|---|---|---|
| OQ-050 | Select and configure production email and SMS providers, credentials, data-processing terms, delivery callbacks, and an executable adapter factory. WhatsApp remains an interface stub for v1.1. | TBD:notification_provider_adapters | FR-039–FR-043; provider selections are absent; compliance B.1/B.2 |
| OQ-051 | Define the approved notification template inventory, per-purpose wording, variable schema, provider approval workflow, and how changes retain prior approved versions. | TBD:notification_template_approval | FR-039–FR-042; SRS content and production provider templates are not supplied |
| OQ-052 | Approve retry count/backoff, staff task ownership/closure workflow, provider delivery-status callback behavior, and job-runner cadence. Current code defaults to three attempts and exponential backoff starting at 60 seconds. | TBD:notification_retry_policy | FR-043; operational service targets are unspecified |
| OQ-053 | Approve reminder lead times, timezone, channels, template keys and schedule cadence. The CLI requires an explicit lead-time environment value; no clinic schedule is assumed. | TBD:notification_reminder_schedule | FR-040; clinic scheduling policy is unspecified |
| OQ-054 | Set retention/purge periods for queued variables, notification attempts, templates and related staff tasks; avoid retaining rendered message content. | TBD:notification_retention; TBD:notification_template_retention; TBD:staff_task_retention | FR-043, NFR-003; legal and operational retention policy absent |
| OQ-055 | Decide whether to adopt the research-proposed WhatsApp-first/SMS-fallback/email cascade, and define delivery acknowledgment timeout and channel-specific consent semantics before enabling automatic fallback. | TBD:notification_channel_cascade | `docs/01-research.md` Topic B recommended change 9 is a proposal, not an approved clinic workflow |
| OQ-056 | Select and contract the AI model and embedding providers, configure no-training/data-residency/retention controls, and supply deployment adapter modules. The implementation provides provider interfaces only. | TBD:ai_provider_adapter; TBD:llm_vendor_contract | AI-001, AI-003, AI-007; source research E.1 provides comparison candidates, not an approved provider |
| OQ-057 | Approve embedding model/dimensions, tokenizer, chunk size/overlap, vector index strategy, source metadata conventions and re-embedding/version migration policy. Current chunking uses 2,400 characters with 300-character overlap; retrieval uses exact cosine-distance search pending stable dimensions. | TBD:ai_chunking_and_embedding | Research D.3 describes 400–600 tokens/50-token overlap, but tokenizer/model choice is unresolved |
| OQ-058 | Set and validate the retrieval similarity threshold and grounding evaluation set against approved clinic documents. Current cosine-distance cutoff defaults to 0.35. | TBD:ai_retrieval_threshold; TBD:ai_test_corpus | AI-001, AI-003; no approved corpus/evaluation baseline supplied |
| OQ-059 | Approve per-minute/daily quotas, cost limits, identity aggregation, and a scheduled cleanup cadence. Current development defaults are 5 requests/minute, 50/day and 7-day counter retention. | TBD:ai_quota_policy; TBD:ai_retention | AI-007; operational/security targets are unspecified |
| OQ-060 | Approve knowledge source retention, review cadence, revocation/deactivation and purge rules, and ensure only approved public clinic information is ingested. | TBD:ai_knowledge_retention; TBD:ai_approved_content | AI-001, AI-003, AI-007; governance and retention policy are not supplied |


| OQ-PLAN-2b0aa2 | Resolve planning blocker: acceptance_baselines. | TBD:acceptance_baselines | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-ce7b16 | Resolve planning blocker: audit_retention. | TBD:audit_retention | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-58757a | Resolve planning blocker: clinic_content_approval. | TBD:clinic_content_approval | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-d58a41 | Resolve planning blocker: clinical_workflow_signoff. | TBD:clinical_workflow_signoff | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-96f6f0 | Resolve planning blocker: document_release_policy. | TBD:document_release_policy | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-611ca9 | Resolve planning blocker: handover_owner. | TBD:handover_owner | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-4b02aa | Resolve planning blocker: hosting_provider. | TBD:hosting_provider | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-76375c | Resolve planning blocker: incident_contacts. | TBD:incident_contacts | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-3b26d4 | Resolve planning blocker: invoice_policy. | TBD:invoice_policy | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-af80fc | Resolve planning blocker: payment_provider. | TBD:payment_provider | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-527a70 | Resolve planning blocker: provider_onboarding. | TBD:provider_onboarding | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-44a87e | Resolve planning blocker: region_approval. | TBD:region_approval | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-77c51b | Resolve planning blocker: resource_assignment_policy. | TBD:resource_assignment_policy | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-c42ba9 | Resolve planning blocker: role_permission_matrix. | TBD:role_permission_matrix | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-45404e | Resolve planning blocker: rto_rpo. | TBD:rto_rpo | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-e3cb48 | Resolve planning blocker: security_review. | TBD:security_review | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-72ffcf | Resolve planning blocker: stack_decision. | TBD:stack_decision | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-12e38e | Resolve planning blocker: storage_provider. | TBD:storage_provider | Referenced in docs/PLAN.md or task files |

| OQ-PLAN-74bac5 | Resolve planning blocker: timezone_policy. | TBD:timezone_policy | Referenced in docs/PLAN.md or task files |

## Plan blockers

| ID | Open item | TBD key | Source / blocker |
|---|---|---|---|
| OQ-PLAN-2b0aa2 | Resolve planning blocker: acceptance_baselines. | TBD:acceptance_baselines | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-ce7b16 | Resolve planning blocker: audit_retention. | TBD:audit_retention | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-58757a | Resolve planning blocker: clinic_content_approval. | TBD:clinic_content_approval | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-d58a41 | Resolve planning blocker: clinical_workflow_signoff. | TBD:clinical_workflow_signoff | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-96f6f0 | Resolve planning blocker: document_release_policy. | TBD:document_release_policy | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-611ca9 | Resolve planning blocker: handover_owner. | TBD:handover_owner | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-4b02aa | Resolve planning blocker: hosting_provider. | TBD:hosting_provider | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-76375c | Resolve planning blocker: incident_contacts. | TBD:incident_contacts | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-3b26d4 | Resolve planning blocker: invoice_policy. | TBD:invoice_policy | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-af80fc | Resolve planning blocker: payment_provider. | TBD:payment_provider | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-527a70 | Resolve planning blocker: provider_onboarding. | TBD:provider_onboarding | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-44a87e | Resolve planning blocker: region_approval. | TBD:region_approval | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-77c51b | Resolve planning blocker: resource_assignment_policy. | TBD:resource_assignment_policy | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-c42ba9 | Resolve planning blocker: role_permission_matrix. | TBD:role_permission_matrix | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-45404e | Resolve planning blocker: rto_rpo. | TBD:rto_rpo | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-e3cb48 | Resolve planning blocker: security_review. | TBD:security_review | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-72ffcf | Resolve planning blocker: stack_decision. | TBD:stack_decision | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-12e38e | Resolve planning blocker: storage_provider. | TBD:storage_provider | Referenced in docs/PLAN.md or task files |
| OQ-PLAN-74bac5 | Resolve planning blocker: timezone_policy. | TBD:timezone_policy | Referenced in docs/PLAN.md or task files |


## Resolved planning items

- OQ-023–OQ-026: canonical install, run, lint and test commands are defined by the root Makefile and documented in AGENTS.md / README.md.

## New security decision

| ID | Open item | TBD key | Source / blocker |
|---|---|---|---|
| OQ-027 | Decide whether to move from the research-pinned Next.js 15.1 release line to a release line without the remaining npm audit advisories before deployment. | TBD:frontend_security_line | npm audit; scaffold retains requested 15.1 line; review before deployment. |

