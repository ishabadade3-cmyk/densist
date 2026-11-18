# Requirements Traceability

Source inventory: `docs/00-analysis.md` §1; summaries are condensed from the inventory. Status is initialized to `not started`.

| ID | Summary | Source section | Module | Priority | Status |
|---|---|---|---|---|---|
| FR-001 | The system shall allow patients to register using an approved email or mobile-number workflow. | §4.1 | Authentication | MVP | in progress |
| FR-002 | The system shall authenticate users securely. | §4.1 | Authentication | MVP | in progress |
| FR-003 | The system should support OTP verification where an SMS/email provider is configured. | §4.1 | Authentication | MVP | in progress |
| FR-004 | The system shall provide secure password recovery. | §4.1 | Authentication | MVP | in progress |
| FR-005 | Users shall be able to update permitted profile information. | §4.1 | Patient Portal / Auth | MVP | in progress |
| FR-006 | Users shall be able to log out and have sessions expire securely. | §4.1 | Authentication | MVP | in progress |
| FR-007 | Staff access shall be governed by role-based permissions. | §4.1, §2.2, §2.3 | Administration / RBAC | MVP | in progress |
| FR-008 | The system shall record relevant consent and communication preferences. | §4.1, §14.2 | Privacy & Compliance | MVP | in progress |
| FR-009 | Patients shall be able to select a service or appointment reason. | §4.2 | Appointment Booking | MVP | not started |
| FR-010 | Patients shall be able to select a dentist when the clinic offers a choice. | §4.2 | Appointment Booking | MVP | not started |
| FR-011 | The system shall display only available appointment slots. | §4.2 | Appointment Booking | MVP | not started |
| FR-012 | Patients shall be able to submit an appointment request or confirmed booking according to clinic policy. | §4.2, §8.1 | Appointment Booking | MVP | not started |
| FR-013 | The system shall prevent two bookings from occupying the same dentist/time slot. | §4.2, §9.3 | Appointment Booking | MVP | not started |
| FR-014 | The system shall issue a booking confirmation through configured channels. | §4.2, §4.6 | Notifications | MVP | not started |
| FR-015 | Patients shall be able to request cancellation subject to clinic policy. | §4.2 | Appointment Booking | MVP | not started |
| FR-016 | Patients shall be able to request rescheduling. | §4.2 | Appointment Booking | MVP | not started |
| FR-017 | Dentists shall be able to view their assigned appointments. | §4.2, §7.3 | Dentist Workspace | MVP | in progress |
| FR-018 | Receptionists and administrators shall be able to manage appointment status. | §4.2, §7.4 | Receptionist Workspace | MVP | in progress |
| FR-019 | The system should send reminders based on configurable schedules and consent. | §4.2, §4.6 | Notifications | MVP | not started |
| FR-020 | The system may maintain a waiting list for unavailable slots. | §4.2, §7.4 | Appointment Booking | v1.1 | not started |
| FR-021 | The system shall generate a unique patient identifier. | §4.3, §9.2 | Clinical Records | MVP | in progress |
| FR-022 | Authorized users shall be able to maintain patient contact and demographic information. | §4.3 | Clinical Records | MVP | in progress |
| FR-023 | Authorized clinical personnel shall be able to record relevant medical/dental history, allergies and clinical alerts. | §4.3, §7.3 | Clinical Records | MVP | in progress |
| FR-024 | Dentists shall be able to create and update clinical notes for patients under their care. | §4.3, §7.3 | Clinical Records | MVP | in progress |
| FR-025 | Authorized users shall be able to upload and manage prescriptions and reports. | §4.3, §7.3 | Clinical Records | MVP | in progress |
| FR-026 | Patients shall be able to view or download documents released to them. | §4.3, §6.5 | Patient Portal | MVP | in progress |
| FR-027 | The system shall maintain a traceable history of important clinical record changes. | §4.3, §9.3, §14.1 | Security & Audit | MVP | in progress |
| FR-028 | The system shall support consent and data-rights workflows. | §4.3, §14.2 | Privacy & Compliance | MVP | not started |
| FR-029 | Administrators shall be able to manage the clinic's service catalogue. | §4.4, §7.2 | Administration | MVP | in progress |
| FR-030 | Each service may include a description, estimated price range and indicative duration. | §4.4 | Administration / Public | MVP | in progress |
| FR-031 | Authorized dentists shall be able to create patient-specific treatment plans. | §4.4, §7.3 | Treatment Management | MVP | in progress |
| FR-032 | The system shall record treatment stages and completed procedures. | §4.4, §7.3 | Treatment Management | MVP | in progress |
| FR-033 | The system shall support follow-up appointment scheduling. | §4.4, §7.3 | Treatment Management | MVP | not started |
| FR-034 | The system shall support recording online and offline payments. | §4.5 | Payments & Invoices | MVP | in progress |
| FR-035 | The system shall generate invoices or receipts according to clinic configuration. | §4.5 | Payments & Invoices | MVP | in progress |
| FR-036 | The system shall distinguish pending, successful, failed, refunded and partially refunded payments. | §4.5 | Payments & Invoices | MVP | in progress |
| FR-037 | Payment status shall be verified through trusted payment-provider callbacks or server-side verification. | §4.5, §15 | Payments & Invoices | MVP | in progress |
| FR-038 | The system shall provide payment history to authorized patients and staff. | §4.5, §6.6 | Payments & Invoices | MVP | in progress |
| FR-039 | The system shall support appointment confirmation and status notifications. | §4.6 | Notifications | MVP | in progress |
| FR-040 | The system should support reminders before appointments. | §4.6 | Notifications | MVP | in progress |
| FR-041 | The system may send cancellation, rescheduling, payment and follow-up notifications. | §4.6 | Notifications | MVP | in progress |
| FR-042 | Email, SMS and WhatsApp notifications shall respect applicable consent and provider rules. | §4.6, §15 | Notifications | MVP | in progress |
| FR-043 | The system should record delivery status where supported by the provider. | §4.6 | Notifications | v1.1 | in progress |
| FR-044 | Administrators shall be able to publish and update approved website content. | §4.7, §7.2 | Content Management | MVP | in progress |
| FR-045 | The system may accept patient feedback and reviews. | §4.7 | Reviews & Marketing | v1.1 | not started |
| FR-046 | Reviews shall be moderated before public display. | §4.7, §7.2 | Reviews & Marketing | v1.1 | not started |
| FR-047 | Patient images and testimonials shall not be published without appropriate permission. | §4.7, §3.1, §14.2 | Reviews & Content | MVP | not started |
| AI-001 | AI Dental Assistant providing general info on services, hours, location, FAQs using RAG and human handoff. | §5.1 | AI Assistance | v1.1 | in progress |
| AI-002 | Structured symptom questionnaire collecting symptoms with clinician-approved triage and emergency guidance. | §5.2 | AI Assistance | v1.1 | in progress; production blocked on clinician approval |
| AI-003 | Treatment Information Assistant explaining published treatment information without clinical prescriptions. | §5.3 | AI Assistance | v1.1 | in progress |
| AI-004 | Treatment Cost Estimator calculating indicative price ranges based on units and services. | §5.4 | AI Assistance | MVP | in progress |
| AI-005 | Virtual Smile Preview generating illustrative cosmetic previews with explicit consent and deletion controls. | §5.5, §20 | AI Assistance | Later | not started |
| AI-006 | AI Analytics showing aggregate trends on demand, interest, cancellations, and assistant usage. | §5.6 | Analytics | Later | not started |
| AI-007 | AI Safety and Governance enforcing guardrails, rate limits, no auto-prescribing, no training on patient data. | §5.7, §14.2 | AI Governance | v1.1 | in progress |
| POR-001 | Patient Dashboard showing upcoming visits, recent updates, available documents, and quick actions. | §6.1 | Patient Portal | MVP | not started |
| POR-002 | Patient Profile management allowing update of permitted personal/contact details. | §6.2 | Patient Portal | MVP | not started |
| POR-003 | Appointments view displaying history, upcoming slots, assigned dentist, and rescheduling/cancellation. | §6.3 | Patient Portal | MVP | not started |
| POR-004 | Treatment Journey tracking dentist-approved stages, visits, and follow-ups. | §6.4 | Patient Portal | MVP | not started |
| POR-005 | Secure Document Vault for downloading released prescriptions, reports, and invoices. | §6.5 | Patient Portal | MVP | not started |
| POR-006 | Payments & Billing history showing invoice status, payments made, and receipts. | §6.6 | Patient Portal | MVP | not started |
| POR-007 | Family Profiles allowing guardian management of permitted dependent profiles. | §6.7 | Patient Portal | v1.1 | not started |
| POR-008 | Privacy & Consent Settings allowing review/withdrawal of communication and processing preferences. | §6.8, §14.2 | Patient Portal | MVP | not started |
| ADM-001 | Administrator Dashboard displaying daily schedule, booking stats, registrations, enquiries, revenue. | §7.1 | Clinic Admin | MVP | in progress |
| ADM-002 | Patient Administration module to search, view, edit demographic records and statuses. | §7.2 | Clinic Admin | MVP | not started |
| ADM-003 | Dentist & Staff Profiles management (qualifications, specializations, schedules). | §7.2, §3.1 | Clinic Admin | MVP | not started |
| ADM-004 | Appointment Calendar & Availability management (working hours, leaves, slot generation). | §7.2 | Clinic Admin | MVP | in progress |
| ADM-005 | Service Catalogue & Price Ranges management. | §7.2 | Clinic Admin | MVP | in progress |
| ADM-006 | Treatment Administration to oversee treatment plans and procedural progress across patients. | §7.2 | Clinic Admin | MVP | not started |
| ADM-007 | Invoice and Payment Records management (reconciliation, manual offline payment logging). | §7.2 | Clinic Admin | MVP | not started |
| ADM-008 | CMS for website pages, treatments, educational dental blog, and FAQs. | §7.2, §3.1 | Clinic Admin | MVP | in progress |
| ADM-009 | Smile Gallery & Patient Consent proof management. | §7.2, §3.1 | Clinic Admin | MVP | not started |
| ADM-010 | AI Knowledge-Base curation, document upload, and safety parameter configuration. | §7.2, §5.7 | Clinic Admin | v1.1 | not started |
| ADM-011 | Notification Templates & Provider Delivery Status monitoring. | §7.2, §4.6 | Clinic Admin | v1.1 | not started |
| ADM-012 | Reports, Data Exports, and Audit Log review. | §7.2, §9.2 | Clinic Admin | MVP | in progress |
| ADM-013 | Clinic Configuration & Integration Settings (Payment keys, SMS/WhatsApp gateways, S3). | §7.2, §15 | Clinic Admin | MVP | not started |
| ADM-014 | Dentist Workspace - Daily assigned appointment list and consultation schedule. | §7.3 | Dentist Workspace | MVP | in progress |
| ADM-015 | Dentist Workspace - Access authorized patient clinical history, allergies, and alerts. | §7.3 | Dentist Workspace | MVP | not started |
| ADM-016 | Dentist Workspace - Create consultation notes and construct multi-stage treatment plans. | §7.3 | Dentist Workspace | MVP | not started |
| ADM-017 | Dentist Workspace - Record completed procedures, upload prescriptions and clinical reports. | §7.3 | Dentist Workspace | MVP | not started |
| ADM-018 | Dentist Workspace - Schedule follow-up consultations. | §7.3 | Dentist Workspace | MVP | not started |
| ADM-019 | Receptionist Workspace - Walk-in patient registration and demographic capture. | §7.4 | Receptionist Workspace | MVP | in progress |
| ADM-020 | Receptionist Workspace - Create, reschedule, cancel, and manage appointments. | §7.4 | Receptionist Workspace | MVP | in progress |
| ADM-021 | Receptionist Workspace - Check real-time dentist schedule and manage waiting lists. | §7.4 | Receptionist Workspace | MVP | not started |
| ADM-022 | Receptionist Workspace - Record offline cash/POS payments and generate receipts. | §7.4 | Receptionist Workspace | MVP | not started |
| ADM-023 | Receptionist Workspace - Scoped data access enforcement (strictly no clinical notes). | §7.4, §16.2 | Receptionist Workspace | MVP | in progress |
| WF-001 | New Patient Online Booking Workflow (Service -> Dentist -> Slot -> Details -> OTP/Verify -> Confirm). | §8.1 | Workflows | MVP | not started |
| WF-002 | Patient Treatment Journey Workflow (Consultation -> Notes -> Plan -> Staging -> Follow-up). | §8.2 | Workflows | MVP | not started |
| WF-003 | AI Assistant Interaction & Safety Triage Workflow (Query -> RAG Retrieval -> Safety Guardrail -> Answer/Escalate). | §8.3 | Workflows | v1.1 | in progress; production blocked on clinician approval |
| WF-004 | Appointment Administration Workflow (Staff reviews request -> Checks availability -> Confirms/Re-allocates -> Patient notified). | §8.4 | Workflows | MVP | not started |
| NFR-001 | Performance: Largest Contentful Paint (LCP) <= 2.5s at 75th percentile; Core Web Vitals good. | §13 | Non-Functional | MVP | not started |
| NFR-002 | Availability: 99.9% monthly service uptime. | §13 | Non-Functional | MVP | not started |
| NFR-003 | Security: HTTPS enforcement, secure sessions, least-privilege RBAC, annual audits. | §13 | Non-Functional | MVP | in progress |
| NFR-004 | Scalability: Modular architecture supporting database and traffic growth without core redesign. | §13 | Non-Functional | MVP | not started |
| NFR-005 | Responsiveness: Cross-device responsiveness (Mobile, Tablet, Desktop). | §13, §12.4 | Non-Functional | MVP | not started |
| NFR-006 | Accessibility: Target WCAG 2.2 Level AA compliance. | §13 | Non-Functional | MVP | not started |
| NFR-007 | Backup: Automated, encrypted database & file backups with periodic restoration tests. | §13 | Non-Functional | MVP | not started |
| NFR-008 | Recovery: Documented RTO, RPO, and disaster recovery / incident response plans. | §13 | Non-Functional | MVP | not started |
| NFR-009 | Usability: Frictionless booking and contact journey (< 3 clicks to appointment request). | §13 | Non-Functional | MVP | not started |
| NFR-010 | Compatibility: Modern browser support (Chrome, Edge, Safari, Firefox). | §13 | Non-Functional | MVP | not started |
| NFR-011 | Maintainability: Clean modular Python/Next.js codebase with test coverage and CI/CD. | §13 | Non-Functional | MVP | not started |
| NFR-012 | SEO: Semantic HTML5, dynamic XML sitemap, schema.org structured data, fast LCP. | §13, §17 | Non-Functional | MVP | not started |
| NFR-013 | Auditability: Immutable audit logs for all sensitive clinical and financial operations. | §13, §9.3 | Non-Functional | MVP | not started |
| NFR-014 | Privacy: Data minimization, consent recording, retention enforcement under DPDP Act. | §13 | Non-Functional | MVP | not started |
