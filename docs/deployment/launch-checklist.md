# Deployment launch checklist

Every unresolved item has an accountable owner role. A role assignment does not mean the item is approved or complete. Legal items remain **NEEDS LEGAL REVIEW** in `docs/brain/compliance.md` until counsel confirms applicability. Launch is blocked where required safety, policy, provider or infrastructure gates are open.

| Gate / open item | Status | Owner role | Evidence required |
|---|---|---|---|
| Hosting account, production domain, DNS, TLS and host hardening (`TBD:hosting_provider`, `TBD:public_domain`) | OPEN | Clinic owner + infrastructure lead | Approved host, domain ownership, firewall and certificate checks |
| Auth/session/rate-limit policy and secure secret delivery (`TBD:auth_security_policy`) | OPEN | Clinic owner + security lead | Approved values, secret inventory, rotation and recovery procedure |
| Production OTP and notification provider adapters (`TBD:auth_otp_production_provider`, `TBD:messaging_provider`) | OPEN | Clinic operations + integration lead | Provider setup, delivery tests, consent and applicable compliance approvals |
| Published clinic facts and site content (`TBD:clinic_legal_name`, content-bank keys) | OPEN | Clinic owner + content approver | Verified clinic identity/contact/service/price claims; production build content check passes |
| Medical, privacy, payment, advertising, messaging and AI legal review (`TBD:legal_signoff`) | NEEDS LEGAL REVIEW | Clinic owner + qualified Indian counsel | Dated applicability review and approved notices/processes in restricted record |
| Clinician-approved urgency rules and AI readiness (`TBD:clinical_triage_signoff`, `TBD:clinical_workflow_signoff`) | OPEN; AI disabled | Clinical lead | Signed rule version, emergency wording/destinations, tested red-flag paths |
| Age recipient/private identity custody, backup interval, retention and off-host copy (`TBD:backup_key_custody`, `TBD:backup_retention`) | OPEN | Infrastructure lead + clinic owner | Separate key recovery proof, approved retention, protected off-host encrypted copy |
| Backup and restore scratch capacity (`TBD:backup_scratch_capacity`) | OPEN | Infrastructure lead | Capacity based on measured encrypted-backup inputs and a successful restore-copy run |
| RTO/RPO and recovery objectives (`TBD:rto_rpo`) | OPEN | Clinic owner + infrastructure lead | Approved objectives and timed restore exercise report |
| Restore-copy demonstration | NOT DEMONSTRATED IN THIS WORKSPACE | Infrastructure lead | `restore_copy_verified` output on an isolated disposable copy, no patient data in report |
| Error tracking provider, SDK review, retention and data filtering (`TBD:error_tracking_provider`) | OPEN | Security/privacy lead + infrastructure lead | Approved data processing terms, tested redaction, alert routing |
| Independent uptime monitor, alert destination and on-call coverage (`TBD:uptime_provider`, `TBD:incident_contacts`) | OPEN | Infrastructure lead + clinic owner | External probe and acknowledged alert test |
| Incident contacts, roles and legal escalation route (`TBD:incident_contacts`) | OPEN | Clinic owner | Restricted contact directory and tabletop exercise |
| Existing T-015 high-severity OTP plaintext/logging finding (`TBD:security_review`) | OPEN; release blocker | Security lead + API owner | Fix reviewed in source control; confirm OTP hashes and logs disclose no identifiers or codes |
| Production security, access-control, restore, accessibility and performance checks (`TBD:acceptance_baselines`) | OPEN | Security lead + QA lead | Current signed test report and no unresolved release-blocking defects |
| Patient/staff training and handover ownership (`TBD:handover_owner`) | OPEN | Clinic operations lead | Named role roster, approved guides, completed training record |

## Go/no-go record

Record decision date, version/deployment identifier, decision owner role, unresolved accepted risks and evidence links in the clinic's restricted operations system. Do not store credentials, patient details, or private recovery keys here. No production go decision is recorded by this repository change.
