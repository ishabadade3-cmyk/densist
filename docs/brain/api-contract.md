# API contract — `/api/v1`

JSON over HTTPS. Opaque UUID public IDs. All protected routes require authenticated session and server-side role plus resource-level authorization. Request/response fields below are minimum contract fields; pagination uses `cursor` and `limit`. Common errors: 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `CONFLICT`, 429 `RATE_LIMITED`, 500 `INTERNAL_ERROR`. Never return clinical data to a role lacking authorization. Each route maps to an inventory ID from `docs/brain/requirements.md`.

| Method | Path | Allowed roles | Request fields | Response fields | Errors | Requirement |
|---|---|---|---|---|---|---|
| POST | /auth/register | Visitor | name, email?, phone?, password | verification_required; no session before OTP verification | 400,409,429,503 | FR-001, FR-003 |
| POST | /auth/login | Visitor | email_or_phone, password, totp_code? | authenticated, mfa_required, mfa_setup_required?, csrf_token, user_id?, role?; session cookie | 400,401,429 | FR-002, FR-006, FR-007 |
| POST | /auth/otp/verify | Visitor | email_or_phone, code | authenticated, user_id, role; session cookie | 400,401,429 | FR-001, FR-003, FR-006 |
| POST | /auth/password-recovery | Visitor | email_or_phone | generic accepted response | 202,429 | FR-004 |
| POST | /auth/password-recovery/verify | Visitor | email_or_phone, code, new_password | 204; all existing sessions revoked | 400,401,429 | FR-004, NFR-003 |
| POST | /auth/mfa/enroll | Dentist, Receptionist, ClinicAdmin, SystemAdmin (restricted setup session) | — | shared_secret, provisioning_uri | 401,403,409 | FR-007, NFR-003 |
| POST | /auth/mfa/verify | Dentist, Receptionist, ClinicAdmin, SystemAdmin (restricted setup session) | code | authenticated, user_id, role; session cookie | 400,401,429 | FR-007, NFR-003 |
| POST | /auth/csrf | Patient, Dentist, Receptionist, ClinicAdmin, SystemAdmin | Origin | csrf_token | 401,403 | FR-006, NFR-003 |
| POST | /auth/logout | Patient, Dentist, Receptionist, ClinicAdmin, SystemAdmin | X-CSRF-Token | logged_out | 401,403 | FR-006, NFR-003 |
| GET | /auth/profile | Patient, Dentist, Receptionist, ClinicAdmin, SystemAdmin | — | own user profile | 401 | FR-005 |
| PATCH | /auth/profile | Patient, Dentist, Receptionist, ClinicAdmin, SystemAdmin | X-CSRF-Token; name? | updated own profile | 400,401,403 | FR-005, NFR-003 |
| POST | /auth/profile/contact-verification | Patient, Dentist, Receptionist, ClinicAdmin, SystemAdmin | X-CSRF-Token; email_or_phone | verification_required | 400,401,403,409,429,503 | FR-003, FR-005 |
| POST | /auth/profile/contact-verification/verify | Patient, Dentist, Receptionist, ClinicAdmin, SystemAdmin | X-CSRF-Token; email_or_phone, code | updated verified contact | 400,401,403,409,429 | FR-003, FR-005 |
| GET | /auth/consents | Patient (own) | — | consent history including channel | 401,403 | FR-008 |
| PUT | /auth/consents/{purpose} | Patient (own) | X-CSRF-Token; status; channel? (`email`,`sms`,`whatsapp`) | consent_id,status,channel | 400,401,403,503 | FR-008, FR-042, NFR-003 |
| GET | /patients/{patient_id}/records | Patient (own), Dentist (assigned) | — | records[] | 401,403,404 | FR-023, FR-024, NFR-003 |
| POST | /patients/{patient_id}/records | Dentist (assigned) | clinical_notes | record_id, created_at | 400,401,403,404 | FR-024, FR-027, NFR-003 |
| GET/PATCH | /patients/me | Patient | permitted profile fields | patient_id, profile | 401,403,404,400 | FR-005, FR-022, POR-002 |
| GET | /services | Visitor, all authenticated roles | cursor?,limit? | services[] | 400 | FR-009, FR-029, FR-030, PUB-003 |
| GET | /dentists | Visitor, all authenticated roles | service_id?,date? | dentists[] | 400 | FR-010, PUB-004 |
| GET | /availability | Visitor, Patient, Receptionist, Dentist, ClinicAdmin | service_id, dentist_id?, from, to | slots[] | 400,409 | FR-011, ADM-004 |
| POST | /appointments | Visitor/Patient; Receptionist; Dentist | patient details or patient_id, service_id, dentist_id?, operatory_id?, start_time, end_time, idempotency_key | appointment_id, status | 400,401,403,409,429 | FR-012, FR-013, WF-001 |
| GET | /appointments | Patient (own), Dentist (assigned), Receptionist, ClinicAdmin | date_from?,date_to?,status?,cursor? | appointments[] without clinical notes | 400,401,403 | FR-017, FR-018, POR-003, ADM-014, WF-004, ADM-023 |
| GET/PATCH | /appointments/{id} | Patient (own), Dentist (assigned), Receptionist, ClinicAdmin | GET: —; PATCH: status?; cancellation_reason?; new_start_time?; new_dentist_id? | appointment_id,dentist/service, time range,status; no clinical notes | 400,401,403,404,409 | FR-015, FR-016, FR-017, FR-018, ADM-014, ADM-020, ADM-023 |
| POST | /appointments/{id}/confirm | Receptionist, ClinicAdmin | status=confirmed | appointment_id,status | 400,403,404,409 | FR-018, WF-004 |
| POST | /patients | Receptionist, ClinicAdmin | name, phone?, email?, date_of_birth? | patient_id, status | 400,403,409 | FR-021, FR-022, ADM-019 |
| GET/PATCH | /patients/{id} | Patient (own), assigned Dentist, Receptionist (permitted demographic subset), ClinicAdmin | permitted fields | patient profile, authorized clinical summary only | 401,403,404 | FR-022, FR-023, ADM-002, ADM-015, ADM-023 |
| POST | /patients/{id}/records | Assigned Dentist | clinical_notes | record_id, created_at | 400,403,404 | FR-024, FR-027, ADM-016 |
| PATCH | /patients/{id}/records/{record_id} | Assigned Dentist | clinical_notes | record_id, version | 400,403,404 | FR-024, FR-027 |
| GET | /patients/{id}/records/{record_id}/versions | Patient (own), assigned Dentist | — | versions[{version_id,version,clinical_notes,created_at}] | 401,403,404 | FR-024, FR-027 |
| GET/POST | /patients/{id}/history | Patient (own) GET; assigned Dentist GET/POST | POST: category,description,recorded_on? | history entries / history_id,created_at | 400,401,403,404 | FR-023, FR-027 |
| GET/POST | /patients/{id}/alerts | Patient (own) GET; assigned Dentist GET/POST | POST: alert_type,description,severity | alerts / alert_id,alert_type,severity | 400,401,403,404 | FR-023, FR-027 |
| PATCH | /patients/{id}/alerts/{alert_id} | Assigned Dentist | resolved | alert_id,resolved_at | 400,403,404 | FR-023, FR-027 |
| GET/POST | /patients/{id}/treatments | Patient (own) GET; assigned Dentist GET/POST | POST: treatment_name,stages[{procedure_name}] | plans and stages | 400,401,403,404 | FR-031, FR-032, FR-027 |
| PATCH | /treatments/{treatment_id}/stages/{stage_id} | Assigned Dentist | status,completed_at?,clinical_notes? | stage_id,status,completed_at | 400,403,404 | FR-032, FR-027 |
| POST | /patients/{id}/documents | Assigned Dentist, ClinicAdmin | raw PDF body; kind=prescription\|report, title, release_to_patient? | document_id,patient_id,title,kind,file_url,media_type,size_bytes,created_at,released_by_name? | 400,403,413,415 | FR-025, FR-027 |
| PATCH | /patients/{id}/documents/{document_id} | Assigned Dentist, ClinicAdmin | release_to_patient | document_id,release_to_patient,released_at | 400,403,404 | FR-025, FR-026, FR-027 |
| GET | /patients/{id}/documents | Patient (own: released only), assigned Dentist, ClinicAdmin | — | documents with short-lived authenticated file_url | 401,403,404 | FR-025, FR-026, FR-027 |
| GET | /patients/me/documents | Patient | — | released documents with short-lived authenticated file_url | 401,403 | FR-026, POR-005 |
| GET | /clinical-documents/{document_id}/download | Patient (own/released), assigned Dentist, ClinicAdmin | expires,signature | PDF stream (no-store) | 401,403,404 | FR-025, FR-026, FR-027 |
| POST | /patients/{id}/alerts | Assigned Dentist | alert_type, description, severity | alert_id | 400,403,404 | FR-023, ADM-015 |
| POST | /patients/{id}/documents | Dentist, ClinicAdmin | kind, file_reference, release_status | document_id, status | 400,403,413,415 | FR-025, ADM-017 |
| GET | /patients/{id}/documents | Patient (released own), authorized Dentist, ClinicAdmin | cursor? | documents[] | 401,403,404 | FR-026, POR-005 |
| POST | /patients/{id}/treatments | Dentist | treatment_name, stages[] | treatment_id, stages[] | 400,403,404 | FR-031, FR-032, WF-002 |
| PATCH | /treatments/{id}/stages/{stage_id} | Assigned Dentist | status, completed_at?, clinical_notes? | stage_id,status | 400,403,404 | FR-032, ADM-017, POR-004 |
| POST | /patients/{id}/family-links | Patient guardian, Receptionist, ClinicAdmin | dependent_patient_id, relationship_type, verification_token | link_id,status | 400,403,409 | FR-028, POR-007 |
| GET/POST/PATCH | /appointments/waitlist | Patient (own create/read), Receptionist, ClinicAdmin | service_id,dentist_id?,date_range | waitlist entry | 400,403 | FR-020, ADM-021 |
| POST | /invoices | Receptionist, ClinicAdmin | patient_id, appointment_id?, treatment_id?, total_amount,tax_amount,discount_amount,net_amount | invoice_id,random invoice_number,status=issued,amounts | 400,403,404 | FR-035, ADM-007, ADM-022 |
| GET | /invoices | Patient (own), Receptionist, ClinicAdmin | — | invoices[] | 401,403 | FR-038, POR-006 |
| POST | /payments/checkout | Patient (own invoice), Receptionist, ClinicAdmin | invoice_id,idempotency_key | payment_id,invoice_id,amount,currency,status,provider_order_id,key_id | 400,401,403,404,409,503 | FR-034, FR-037 |
| POST | /payments/verify | Patient (own order), Receptionist, ClinicAdmin | razorpay_order_id,razorpay_payment_id,razorpay_signature | payment with server-fetched status and receipt_number | 400,401,403,404,409,503 | FR-036, FR-037 |
| POST | /payments/webhooks/razorpay | Razorpay signature | raw JSON body; `X-Razorpay-Signature`, `X-Razorpay-Event-Id` headers | accepted,duplicate | 400,401,404,413,503 | FR-036, FR-037 |
| POST | /payments/offline | Receptionist, ClinicAdmin | invoice_id,amount,method (`cash`\|`bank_transfer`\|`upi`\|`other`),received_at?,idempotency_key | successful payment,receipt_number | 400,403,404,409 | FR-034, FR-035, ADM-022 |
| POST | /payments/{payment_id}/refunds | Receptionist, ClinicAdmin | amount,idempotency_key | refund_id,status,provider_refund_id | 400,403,404,409,503 | FR-034, FR-036, ADM-022 |
| GET | /payments/{payment_id}/receipt | Patient (own), Receptionist, ClinicAdmin | — | JSON receipt: receipt_number,payment_id,invoice_id,invoice_number,amount,currency,method,received_at,status | 401,403,404 | FR-035, FR-038, POR-006 |
| GET | /payments | Patient (own), Receptionist, ClinicAdmin | — | payment history with status and refunded totals | 401,403 | FR-036, FR-038, POR-006 |
| PUT | /patients/{id}/consents/{purpose} | Patient (own), verified guardian | status, policy_version, evidence? | consent_id,status,recorded_at | 400,403,404 | FR-008, FR-028, POR-008 |
| POST | /notifications/dispatch | Receptionist, ClinicAdmin, SystemAdmin | X-CSRF-Token; recipient_user_id, template_key, idempotency_key, variables?, resource_id?, scheduled_at? | notification_id,status,scheduled_at | 400,403,404,409 | FR-039, FR-041, FR-042, FR-043, NFR-003 |
| POST | /notifications/templates | ClinicAdmin, SystemAdmin | X-CSRF-Token; template_key,channel,purpose,subject?,body,variable_names,variable_types,provider_template_id?,provider_sender_id?,is_active,is_provider_approved | template fields | 400,401,403,409 | FR-039, FR-042, FR-043, ADM-011 |
| GET | /notifications/templates | ClinicAdmin, SystemAdmin | — | template fields | 401,403 | FR-039, FR-042, ADM-011 |
| GET | /notifications/tasks | Receptionist, ClinicAdmin, SystemAdmin | — | open delivery-failure task codes (no patient IDs/message content) | 401,403 | FR-043, ADM-011, NFR-003 |
| CLI | `python -m app.notification_worker` | deployment job runner | `NOTIFICATION_PROVIDER_FACTORY`, optional reminder lead/template settings | counts only; provider adapters record accepted/delivered/failure status through the delivery-status hook | configuration/runtime error | FR-039–FR-043, NFR-003 |
| POST | /assistant/urgency-check | Visitor, Patient | questionnaire_answers (bounded key/value map) | status=human_review_required,escalated,guidance,handoff,ruleset_version | 400,429,503 | AI-002, AI-007, WF-003 |
| POST | /assistant/messages | Visitor, Patient | session_id?, message (max 2,000 characters) | response,sources[{source_key,source_reference,version}],handoff,handoff_target | 400,429,503 | AI-001, AI-003, AI-007, WF-003 |
| POST | /assistant/cost-estimate | Visitor, Patient | service_id, units (1–100) | indicative_min,indicative_max,currency,source=`service_catalogue`,disclaimer | 400,404,429 | AI-004 |
| POST | /assistant/knowledge | ClinicAdmin, SystemAdmin | X-CSRF-Token; source_key,source_reference,version,title,content | document_id,content_sha256,is_approved=false,is_active=false | 400,401,403,503 | AI-001, AI-003, AI-007, ADM-010 |
| POST | /assistant/knowledge/{document_id}/approve | ClinicAdmin, SystemAdmin | X-CSRF-Token | document_id,is_approved,is_active | 401,403,404 | AI-001, AI-003, AI-007, ADM-010 |
| CLI | `python -m app.ai_red_team_runner` | development/CI | local 60-prompt fixture; no provider credentials | prompt counts and failure count only | non-zero exit on failed gate | AI-002, AI-007, WF-003 |
| CLI | `python -m app.ai_usage_cleanup` | deployment job runner | `AI_USAGE_RETENTION_DAYS` | removed counter count only | configuration/runtime error | AI-007, NFR-003 |
| GET/POST | /admin/services | ClinicAdmin | GET: —; POST: service_name, description?, price_min?, price_max?, duration_minutes?, active? | services[] / service | 400,401,403,409 | FR-029, FR-030, ADM-005 |
| PATCH | /admin/services/{service_id} | ClinicAdmin | service_name?, description?, price_min?, price_max?, duration_minutes?, active? | service | 400,401,403,404,409 | FR-029, FR-030, ADM-005 |
| GET | /admin/schedules | ClinicAdmin | from,to,dentist_id? | schedules[], leaves[] | 400,401,403 | ADM-003, ADM-004 |
| GET/POST | /admin/content | ClinicAdmin | POST: slug,title,body,status? | content[] / content | 400,401,403,409 | FR-044, ADM-008 |
| PATCH | /admin/content/{slug} | ClinicAdmin | title?,body?,status? | content | 400,401,403,404 | FR-044, ADM-008 |
| GET | /admin/reports | ClinicAdmin | date_from,date_to,aggregate_by (day/status) | appointment_count,buckets[{key,count}] with aggregate-only data | 400,401,403 | ADM-001, ADM-012 |
| GET | /admin/audit-logs | ClinicAdmin, SystemAdmin (authorized scope) | cursor, filters | logs without patient identifiers in application logs | 400,403 | FR-027, ADM-012, NFR-013 |

CMS public read routes, blog, contact/enquiry, and verified public dentist/service profiles follow same `/api/v1` versioning; request/response details remain TBD:public_content_contract. Any route not listed must not be treated as approved API scope.

The one-shot reconciliation command is `python -m app.payment_reconciliation` (also `make reconcile-payments`); deployment scheduling is not configured by this API contract.
