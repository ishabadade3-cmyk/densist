# Content Bank: Canonical Clinic Facts & Placeholders
**Reference:** `content-bank.md`  
**Purpose:** Prevent invention of clinic facts. All developers and agents must use `TBD:<key>` placeholders when real clinic data has not been provided by the clinic owner.

---

## 1. Development Marker Standard
When rendering in development or test environments, placeholders must be clearly flagged with a visible dev-only marker:
- **HTML / JSX Standard:**
  ```html
  <span class="dev-placeholder" data-tbd="TBD:CLINIC_NAME" title="Dev Placeholder">[TBD:CLINIC_NAME]</span>
  ```
- **Markdown / Copy Standard:**
  ```markdown
  `[TBD:CLINIC_NAME]`
  ```
- In production builds, any missing `TBD:<key>` must throw a build/validation error or fail smoke tests.

---

## 2. Canonical Key Catalog

### 2.1 Clinic Identity & Contact
| Key | Description | Status / Default Marker | Notes |
| :--- | :--- | :--- | :--- |
| `TBD:CLINIC_NAME` | Official Clinic Name | `[TBD:CLINIC_NAME]` | Pending owner approval (§1.4) |
| `TBD:CLINIC_TAGLINE` | Brand tagline | `[TBD:CLINIC_TAGLINE]` | Luxury healthcare focus (§1.2, §12.1) |
| `TBD:CLINIC_ADDRESS_LINE1` | Physical Street Address | `[TBD:CLINIC_ADDRESS_LINE1]` | Required for Consumer Protection & KYC |
| `TBD:CLINIC_ADDRESS_LINE2` | Locality / Landmark | `[TBD:CLINIC_ADDRESS_LINE2]` | Specific to Thane locality |
| `TBD:CLINIC_CITY` | City | `Thane` | Locked: Thane, Maharashtra |
| `TBD:CLINIC_STATE` | State | `Maharashtra` | Locked: Maharashtra |
| `TBD:CLINIC_PINCODE` | Postal Code | `[TBD:CLINIC_PINCODE]` | 6-digit Indian PIN (e.g., 400601) |
| `TBD:CLINIC_PHONE_PRIMARY` | Reception desk phone | `[TBD:CLINIC_PHONE_PRIMARY]` | Displayed in header & contact |
| `TBD:CLINIC_PHONE_EMERGENCY`| 24/7 Dental Emergency line | `[TBD:CLINIC_PHONE_EMERGENCY]` | Required for AI emergency modal (§5.2) |
| `TBD:CLINIC_WHATSAPP_NUMBER`| WhatsApp Business Number | `[TBD:CLINIC_WHATSAPP_NUMBER]` | Registered with Meta Cloud API (+91) |
| `TBD:CLINIC_EMAIL` | Official contact email | `[TBD:CLINIC_EMAIL]` | Domain-authenticated email |
| `TBD:CLINIC_HOURS_WEEKDAY` | Monday–Saturday Timings | `[TBD:CLINIC_HOURS_WEEKDAY]` | e.g., 09:30 AM – 08:30 PM |
| `TBD:CLINIC_HOURS_SUNDAY` | Sunday Timings | `[TBD:CLINIC_HOURS_SUNDAY]` | e.g., 10:00 AM – 02:00 PM (or Closed) |

### 2.2 Clinical Team & Regulatory Credentials
| Key | Description | Status / Default Marker | Notes |
| :--- | :--- | :--- | :--- |
| `TBD:LEAD_DENTIST_NAME` | Principal Dental Surgeon | `[TBD:LEAD_DENTIST_NAME]` | e.g., Dr. [TBD] |
| `TBD:LEAD_DENTIST_QUAL` | Degrees & Fellowships | `[TBD:LEAD_DENTIST_QUAL]` | Recognized degrees only (BDS, MDS) |
| `TBD:LEAD_DENTIST_REG_NO` | State Dental Council Reg No | `[TBD:LEAD_DENTIST_REG_NO]` | MSDC Registration Number |
| `TBD:LEAD_DENTIST_EXP_YEARS`| Verified Clinical Experience | `[TBD:LEAD_DENTIST_EXP_YEARS]`| In years (§3.1) |
| `TBD:ASSOCIATE_DENTIST_NAME`| Associate Dental Surgeon | `[TBD:ASSOCIATE_DENTIST_NAME]`| Verified credentials |
| `TBD:TMC_CLINIC_REG_NO` | Thane Municipal Corp NOC | `[TBD:TMC_CLINIC_REG_NO]` | Medical Officer of Health registration |
| `TBD:MPCB_BMW_AUTH_NO` | Bio-Medical Waste Auth No | `[TBD:MPCB_BMW_AUTH_NO]` | MPCB CBMWTF agreement |

### 2.3 Legal & Compliance Governance
| Key | Description | Status / Default Marker | Notes |
| :--- | :--- | :--- | :--- |
| `TBD:GRIEVANCE_OFFICER_NAME` | Statutory Grievance Officer | `[TBD:GRIEVANCE_OFFICER_NAME]` | Mandatory under E-Commerce Rules |
| `TBD:GRIEVANCE_OFFICER_EMAIL`| Grievance redressal email | `[TBD:GRIEVANCE_OFFICER_EMAIL]`| 48-hr response mandate |
| `TBD:GRIEVANCE_OFFICER_PHONE`| Grievance contact number | `[TBD:GRIEVANCE_OFFICER_PHONE]`| Working hours |
| `TBD:LEGAL_ENTITY_NAME` | Legal Entity (Prop/LLP/Pvt Ltd)| `[TBD:LEGAL_ENTITY_NAME]` | Matches GSTIN & Bank Account |
| `TBD:CLINIC_GSTIN` | Goods & Services Tax Number | `[TBD:CLINIC_GSTIN]` | 27XXXXX (Maharashtra prefix 27) |
| `TBD:CANCELLATION_CUTOFF_HRS`| Refund cutoff window | `24` | Default: 24 hours |
| `TBD:LATE_CANCEL_FEE_INR` | Fee for late cancellation | `500` | Default: ₹500 |

### 2.4 Service Catalog Price Indications (Subject to Examination)
| Key | Service Name | Indicative Range Marker | Notes |
| :--- | :--- | :--- | :--- |
| `TBD:PRICE_CONSULTATION` | Comprehensive Consultation & OPG | `[TBD:PRICE_CONSULTATION]` | Range e.g. ₹500 – ₹1,000 |
| `TBD:PRICE_CLEANING_SCALING`| Ultrasonic Scaling & Polishing | `[TBD:PRICE_CLEANING_SCALING]` | Range e.g. ₹1,500 – ₹3,000 |
| `TBD:PRICE_RCT_SINGLE` | Rotary Root Canal Treatment | `[TBD:PRICE_RCT_SINGLE]` | Range e.g. ₹4,500 – ₹8,500 |
| `TBD:PRICE_CROWN_ZIRCONIA` | Monolithic Zirconia Crown | `[TBD:PRICE_CROWN_ZIRCONIA]` | Range e.g. ₹8,000 – ₹16,000 |
| `TBD:PRICE_IMPLANT_SINGLE` | Single Tooth Titanium Implant | `[TBD:PRICE_IMPLANT_SINGLE]` | Range e.g. ₹28,000 – ₹45,000 |
| `TBD:PRICE_ALIGNERS_FULL` | Clear Aligners (Full Arch) | `[TBD:PRICE_ALIGNERS_FULL]` | Range e.g. ₹65,000 – ₹1,50,000 |
| `TBD:PRICE_WHITENING` | In-Office Laser Whitening | `[TBD:PRICE_WHITENING]` | 18% GST taxable under SAC 999312 |

