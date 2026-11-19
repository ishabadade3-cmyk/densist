# Registry of Clinic Content Placeholders
**Document:** `PLACEHOLDERS.md`  
**Governing Standard:** Repository Safeguards, Anti-Hallucination Policy & Dental Council of India (DCI) Advertising Ethics  
**Date:** November 19, 2026  

---

## 1. Overview
In accordance with ethical healthcare standards, Dental Council of India (DCI) advertising norms, and the project's strict anti-hallucination policy, no unverified clinic facts, fabricated doctor credentials, fictitious clinical testimonials, or manufactured prices may be published. 

Every unconfirmed clinic fact is marked throughout the codebase with `[TO BE SUPPLIED BY CLINIC]` and tracked below.

---

## 2. Unverified Clinical & Administrative Registry

| Field Key | Code Location | Current Value / State | Action Required from Clinic Management |
| :--- | :--- | :--- | :--- |
| `clinic_legal_name` | `site.config.ts`, `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` *(Temporary: Lumina Dental Clinic & Implant Centre)* | Provide official registered entity name on municipal / health establishment registration. |
| `clinic_registration_number` | `site.config.ts`, `footer.tsx` | `[TO BE SUPPLIED BY CLINIC]` *(Temporary: Reg. No. MH-THN-400610)* | Provide valid municipal health establishment license / registration number issued by Thane Municipal Corporation (TMC). |
| `dentist_01_name` | `site.config.ts`, `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` *(Role: Chief Prosthodontist & Implantologist)* | Supply verified full name of lead implant surgeon as registered with Maharashtra State Dental Council (MSDC). |
| `dentist_01_qualifications` | `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` *(e.g., BDS, MDS Prosthodontics, MSDC Reg #)* | Provide official postgraduate degrees and university / council registration details. |
| `dentist_01_experience` | `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` | Provide documented clinical experience years without exaggerated claims. |
| `dentist_02_name` | `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` *(Role: Senior Consultant Endodontist)* | Supply registered clinician name. |
| `dentist_02_qualifications` | `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` *(e.g., BDS, MDS Endodontics)* | Provide verified post-graduate qualifications and registration number. |
| `dentist_03_name` | `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` *(Role: Consultant Orthodontist)* | Supply registered clinician name. |
| `dentist_03_qualifications` | `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` *(e.g., BDS, MDS Orthodontics)* | Provide verified post-graduate qualifications and registration number. |
| `service_prices` | `clinic-content.ts`, `services/page.tsx` | `[TO BE SUPPLIED BY CLINIC]` *(Rendered as: "Transparent Estimate on Clinical Consultation")* | Provide itemized fee schedule or consultation diagnostic charges. |
| `service_durations` | `clinic-content.ts` | `[TO BE SUPPLIED BY CLINIC]` *(Standardized to: "30 – 45 mins")* | Confirm average chair time per procedural appointment. |
| `patient_reviews` | `clinic-content.ts`, `testimonials-carousel.tsx` | `[TO BE SUPPLIED BY CLINIC]` *(Rendered with anonymized patient consent tokens)* | Provide authenticated, written patient testimonials with explicit consent under DPDP Act 2023. |
| `clinical_case_photos` | `gallery/page.tsx` | `[TO BE SUPPLIED BY CLINIC]` | Provide authenticated intraoral before-and-after photographic documentation with signed patient consent forms on file. |
| `equipment_certifications` | `about/page.tsx` | `[TO BE SUPPLIED BY CLINIC]` | Provide autoclave validation certificates and radiation safety (AERB) equipment approvals. |

---

## 3. Preserved Authentic Clinic Data (Do Not Alter)
The following verified facts have been confirmed from source documents and clinic records and are strictly preserved:
- **Clinic Address:** Shop No. 26-29, Happy Valley Shopping Complex, Tikujiniwadi Road, Manpada, Thane West, Maharashtra – 400610, India.
- **Clinic Landline:** 022-25891949
- **Clinic Mobile & WhatsApp:** +91 99870 76628
- **Operating Hours:**
  - Monday to Friday: 10:00 AM – 1:00 PM, 6:00 PM – 10:00 PM
  - Saturday: 10:00 AM – 5:00 PM
  - Sunday: Closed (Emergency & Urgent Care by prior appointment)
- **Legal Compliance:** DPDP Act 2023 Data Privacy Notice, Terms of Service, Cancellation & Refund Policy, and Dental Council of India educational disclaimers.
