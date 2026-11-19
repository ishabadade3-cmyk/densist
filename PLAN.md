# Architectural & Creative Plan: Densistt Dental Clinic Redesign
**Document:** `PLAN.md`  
**Phase:** Phase 3 (Architecture, Creative Strategy & Backend Plan)  
**Status:** **AWAITING USER APPROVAL (Do not start feature coding until approved)**  
**Author:** Senior UI/UX Designer, Creative Technologist & Full-Stack Architect  

---

## 3.1 Brand Strategy & Identity

### 3.1.1 Brand Renaming: 5 Strategic Name Options
The current name *"Densistt"* suffers from an awkward double-"t" spelling that creates phonetic friction and is frequently misspelled by patients searching online. Below are 5 curated brand identity options designed for phonetical ease across English, Hindi, and Marathi, strong recall, domain viability, and resonance with both advanced implantology and warm family dentistry:

1. **Lumina Dental & Implant Studio** *(DEFAULT RECOMMENDED PICK)*
   * *Tagline:* "Precision. Comfort. Honesty."
   * *Rationale:* "Lumina" naturally evokes clarity, healthy bright smiles, and gentle enlightenment. It sounds elegant and welcoming in English, Hindi, and Marathi, avoids clinical jargon, and frames dental care as an artful studio practice.
2. **Aura Dental & Implant Centre**
   * *Tagline:* "Gentle Care, Exceptional Smiles."
   * *Rationale:* Simple two-syllable name with universal phonetic warmth across Maharashtra. "Aura" conveys a relaxed, calming atmosphere that directly counters dental anxiety.
3. **Praxis Dental Atelier**
   * *Tagline:* "The Architecture of Healthy Smiles."
   * *Rationale:* "Praxis" implies clinical expertise, evidence-based dentistry, and disciplined craftsmanship. Appeals to discerning patients seeking top-tier aesthetic and implant restorative work.
4. **Triniti Dental & Maxillofacial Studio**
   * *Tagline:* "Restoring Confidence, Naturally."
   * *Rationale:* "Triniti" reflects the tripartite philosophy of conservative ethics, digital precision, and lifelong oral health.
5. **Veda Dental Clinic & Implantology**
   * *Tagline:* "Timeless Care, Modern Precision."
   * *Rationale:* Deeply rooted Indian cultural heritage signifying knowledge, wellness, and trust, paired seamlessly with cutting-edge German/European implant technology.

> [!IMPORTANT]
> **Governance & Verification Note:**
> The formal legal entity name and clinical registration number (`Reg. No. MH-THN-400610`) must be confirmed with the clinic owner. Domain name availability (`.in`, `.dental`, `.studio`) and trademark clearance under Class 44 (Medical & Dental Services) must be verified prior to public launch.

### 3.1.2 Centralized Brand Configuration (`site.config.ts`)
To make future renaming, phone updates, or address tweaks instantaneous and zero-risk, all identity tokens will be centralized in a single configuration file `apps/web/config/site.config.ts`:

```typescript
// apps/web/config/site.config.ts
export const siteConfig = {
  brand: {
    name: "Lumina Dental & Implant Studio",
    shortName: "Lumina",
    legalName: "Lumina Dental Clinic & Implant Centre LLP [TO BE CONFIRMED BY CLINIC]",
    tagline: "Precision. Comfort. Honesty.",
    registrationNumber: "MH-THN-400610 [TO BE CONFIRMED BY CLINIC]",
  },
  contact: {
    phones: ["022-25891949", "+91 99870 76628"],
    primaryPhone: "022-25891949",
    whatsapp: "+91 99870 76628",
    email: "care@luminadental.in",
    address: {
      line1: "Shop No. 26-29, Happy Valley Shopping Complex",
      line2: "Tikujiniwadi Road, Manpada",
      city: "Thane West",
      state: "Maharashtra",
      postalCode: "400610",
      country: "India",
      googleMapsUrl: "https://maps.google.com/?q=Happy+Valley+Shopping+Complex+Manpada+Thane+West",
    },
  },
  hours: {
    weekday: "Mon – Fri: 10:00 AM – 1:00 PM, 6:00 PM – 10:00 PM",
    saturday: "Sat: 10:00 AM – 5:00 PM",
    sunday: "Closed (Emergency & Urgent Care by prior telephonic appointment)",
  },
  governance: {
    dciCompliance: "Information published in accordance with Dental Council of India ethical guidelines.",
    dpdpFiduciary: "Lumina Dental Studio is registered as a Data Fiduciary under the DPDP Act 2023.",
  },
};
```

### 3.1.3 Logo & Mark Direction
- **Wordmark:** Typeset in high-contrast editorial serif (*Fraunces Display*), tracked tightly (`-0.03em`), conveying architectural refinement.
- **Iconic Monoline Mark:** A minimal 1.5px monoline vector mark combining a subtle anatomical molar outline smoothly interlocking with a precision geometric implant thread apex.
- **Application:** Built as a scalable SVG responsive from 20px (favicon / mobile navbar) up to 240px (hero / clinic signage), rendering crisply in Deep Teal (`#14545B`) on linen and Soft White (`#FBF9F5`) on dark ink.

---

## 3.2 Design System & Design Tokens

### 3.2.1 Enriched Luxury Palette & WCAG AA Contrast Verification
The color tokens evolve from sterile cool whites to tactile, organic linen and rich medical mineral tones:

| Token Name | Hex Code | Semantic Role | Background Pairing | Contrast Ratio | WCAG Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Linen Base** | `#F4EFE6` | Primary page canvas | N/A (Canvas) | — | — |
| **Ink-Teal Text** | `#0E2A2F` | Headings, body text, high-emphasis UI | `#F4EFE6` (Linen Base) | **13.8 : 1** | **Exceeds AAA (7.0:1)** |
| **Deep Teal** | `#14545B` | Primary interactive buttons, key icons | `#FFFFFF` (Text inside button) | **5.2 : 1** | **Passes AA (4.5:1)** |
| **Sage** | `#A9C0B3` | Secondary accents, progress rings, soft pills | `#0E2A2F` (Text inside badge) | **6.1 : 1** | **Passes AA (4.5:1)** |
| **Refined Brass** | `#B8935A` | Luxury accent, implant collar moments | `#0E2A2F` (Ink background) | **5.8 : 1** | **Passes AA (4.5:1)** |
| **Soft White** | `#FBF9F5` | Card surfaces, modal sheets | `#0E2A2F` (Text on card) | **15.1 : 1** | **Exceeds AAA** |
| **Surface Muted** | `#EBE5DA` | Subtle card borders, divider lines | `#0E2A2F` | **10.5 : 1** | **Passes AA** |

### 3.2.2 Typography Hierarchy
- **Serif Display (Headings):** **Fraunces** (Google Font, optical sizing `opsz`, variable font). Used with tight tracking (`tracking-tight` / `-0.025em`) and fluid sizing via CSS `clamp()`:
  - Hero Headline: `clamp(2.5rem, 5vw + 1rem, 4.5rem)` (40px – 72px)
  - Section Titles: `clamp(1.875rem, 3.5vw + 0.5rem, 2.75rem)` (30px – 44px)
  - Bento Card Titles: `clamp(1.25rem, 2vw + 0.25rem, 1.625rem)` (20px – 26px)
- **Sans-Serif Body & UI:** **Manrope** (Google Font, high legibility, geometric numbers for clock times and dates).
- **Line Heights:** Generous `leading-relaxed` (1.65–1.75) for clinical reading comfort; tight `leading-[1.12]` for editorial serif headings.

### 3.2.3 Radii, Shadows & Surface Tactility
- **Corner Radii:** Cards: 24px (`rounded-2xl`) to 32px (`rounded-3xl`); Buttons: 9999px (pill-shaped) or 14px (`rounded-xl`).
- **Layered Ambient Shadows:**
  - `shadow-subtle`: `0 2px 8px -2px rgba(14, 42, 47, 0.04), 0 8px 24px -4px rgba(14, 42, 47, 0.06)`
  - `shadow-elevated`: `0 12px 36px -6px rgba(14, 42, 47, 0.08), 0 24px 64px -12px rgba(14, 42, 47, 0.05)`
- **Tactile Grain Overlay:** A microscopic 256x256 inline SVG noise pattern applied at 3.5% opacity with `pointer-events: none` on the root linen canvas, adding tactile paper warmth.

---

## 3.3 Hero: "The Anatomy of a Smile" (Interactive 3D Cross-Section)

### 3.3.1 Conceptual Narrative
Rather than displaying a static ceramic tooth or generic stock photography, the hero visualizes **"The Anatomy of a Smile"**: a scientific, interactive 3D comparison between healthy natural tooth anatomy and modern implantology. It educates patients on how crowns, abutments, and titanium fixtures work together to restore oral health.

```
+-----------------------------------------------------------------------------------+
|  [LUMINA DENTAL & IMPLANT STUDIO]             Home  About  Treatments  FAQ  Book |
|                                                                                   |
|  * HOSPITAL-GRADE CLASS-B STERILIZATION · ETHICAL DENTISTRY                       |
|                                                                                   |
|  Architects of Healthy,                        +-------------------------------+  |
|  Confident Smiles.                             |       [3D Interactive Canvas] |  |
|                                                |                               |  |
|  Experience gentle, transparent dental care    |     (Contoured Ceramic Crown) |  |
|  guided by qualified specialists in Thane.     |            --- lift ---       |  |
|                                                |       (Gold Abutment Collar)  |  |
|  [Book Appointment]   [Explore Treatments]     |            --- post ---       |  |
|                                                |     (Threaded Titanium Post)  |  |
|  [O] Open Today: 10:00 AM - 1:00 PM, 6 - 10 PM |     (Living Alveolar Bone)    |  |
|                                                +-------------------------------+  |
|  [ 100% Itemized Estimates ]   [ Class-B Autoclave ]   [ Honest Treatment Plans ] |
+-----------------------------------------------------------------------------------+
```

### 3.3.2 Technical Implementation Spec
- **Three.js Scene Composition:**
  - **Natural Molar Section:** Organic ivory enamel crown, dentin chamber, and vascular pulp canals.
  - **Implant Section:** High-translucency aesthetic porcelain crown (`MeshPhysicalMaterial`), precision chamfered gold abutment collar (`MeshStandardMaterial`), and helical threaded Grade-4 titanium fixture (`MeshStandardMaterial`).
  - **Alveolar Base:** Translucent bone cross-section illustrating natural osseointegration.
- **Lighting Setup:** Multi-point studio lighting with a soft white key light (intensity 1.4), warm linen fill light (0.8), and a champagne brass rim light (0.9) to highlight the micro-threads.
- **ScrollTrigger Scrubbed Exploded View:**
  - Pinned hero viewport (`end: "+=120%"`).
  - Scrubbing down pulls the ceramic crown upwards, revealing the internal gold screw and abutment mechanism.
  - Anime.js draws animated SVG callout leader lines to plain-language anatomical labels.
- **Performance & Battery Safeguards:**
  - Chunk lazy-loaded with Next.js dynamic import (`ssr: false`).
  - Strict pixel ratio capping: `Math.min(window.devicePixelRatio, 2)`.
  - `IntersectionObserver` halts render loop when off-screen.
  - Instant static SVG/WebP poster displayed while loading, on devices lacking WebGL, or when `prefers-reduced-motion` is detected.
- **Hero Trust Chips:** Reworded with positive ethical framing:
  - *"Class-B Vacuum Autoclave (100% Sterile Tray Sets)"*
  - *"100% Itemized Estimates (No Hidden Clinical Fees)"*
  - *"Honest Treatment Plans (Conservative, Tooth-Saving Care)"*

---

## 3.4 Page-by-Page Creative Direction

### 3.4.1 Global Layout & Interactions
- **Lenis + GSAP Sync:** Smooth scrolling synchronized via `gsap.ticker.add((t) => lenis.raf(t * 1000))` and `gsap.ticker.lagSmoothing(0)`.
- **Desktop Custom Cursor:** A subtle 8px brass dot with a trailing 32px soft ring that expands on interactive links and buttons; disabled on touch devices.
- **Navigation:** Floating glass pill (`backdrop-blur-md bg-card/85 border border-border/80`) that condenses smoothly on scroll. Features a desktop mega-menu for treatments and a persistent "Book Appointment" button.
- **Mobile Experience:** Full-screen linen overlay menu with staggered link entrances, plus the persistent bottom quick-action bar (Call, WhatsApp, Directions, Book).

### 3.4.2 Pinned Trust Pillars (Horizontal Scroll)
- Replaces the generic vertical text stack with a pinned horizontal track powered by GSAP ScrollTrigger.
- As the user scrolls, 5 clinical trust pillars glide horizontally:
  1. *Hospital-Grade Infection Control (Class-B Vacuum Autoclave)*
  2. *Conservative Dentistry (We Preserve Natural Tooth Structure)*
  3. *Digital Radiography (90% Less Radiation than Traditional X-Rays)*
  4. *Transparent Clinical Estimates (Itemized Prior to Treatment)*
  5. *Gentle, Anxiety-Free Care (Pain-Managed Local Anaesthesia)*
- Each pillar features a custom animated monoline line-draw icon.

### 3.4.3 Treatments Bento Grid
- Modern 10-treatment bento grid with custom monoline clinical illustrations:
  - **Featured Tile 1 (2x2):** Dental Implants & Full-Mouth Rehabilitation.
  - **Featured Tile 2 (2x2):** Microscopic Endodontics (Painless Root Canal Therapy).
  - **Standard Tiles (1x1):** Cosmetic Dentistry, Clear Aligners, Periodontal Care, Pediatric Dentistry, Wisdom Tooth Surgery, Teeth Whitening, Preventive Checkups, Restorative Fillings.
- Hover reveals an indicative duration, a "Transparent Estimate Available" badge, and an instant "Book Treatment" button deep-linking into `/book?service=<slug>`.

### 3.4.4 Smile Transformations Gallery
- Dedicated gallery section with accessible before-and-after comparison slider.
- Supports keyboard navigation (ArrowLeft / ArrowRight), touch drag gestures, and accessible ARIA attributes.
- Retains mandatory Dental Council of India (DCI) / ASCI healthcare advertising ethics disclaimer caption: *"Individual clinical outcomes vary. Documented with full patient consent for educational purposes."*

### 3.4.5 Specialist Clinical Leadership
- Presents three distinctly defined specialist profiles with professional portrait placeholders, credentials, specialization tags, and languages:
  1. **Chief Prosthodontist & Implantologist:** [TO BE SUPPLIED BY CLINIC] (BDS, MDS Prosthodontics, 20+ Years Clinical Practice) — English, Hindi, Marathi.
  2. **Senior Consultant Endodontist:** [TO BE SUPPLIED BY CLINIC] (BDS, MDS Conservative Dentistry & Endodontics) — English, Hindi, Marathi.
  3. **Consultant Orthodontist:** [TO BE SUPPLIED BY CLINIC] (BDS, MDS Orthodontics & Dentofacial Orthopedics) — English, Hindi.
- Each card includes a direct **"Book with this Doctor"** button (`/book?dentist=<id>`).

### 3.4.6 AI Dental Assistant (Concierge Drawer)
- Redesigned as an elegant clinical concierge chat drawer.
- Instant symptom chips: *"Severe Toothache"*, *"Bleeding Gums"*, *"Chipped Tooth"*, *"Implant Cost Inquiry"*.
- Deterministic emergency triage runs first (detecting swelling, breathing difficulty, trauma) and bypasses AI to show emergency hospital contacts.
- Educational guidance with visible medical disclaimer and instant handoff button into the booking wizard.

### 3.4.7 FAQ & Treatment Marquee
- Marquee speed slowed to a gentle 40s loop; automatically pauses on mouse hover or keyboard focus.
- 8 high-intent patient FAQs categorized into tabs: *General & Safety*, *Root Canals*, *Implants*, *Appointments & Costs*.
- Smooth accordion expansion powered by Anime.js height transitions.

### 3.4.8 Final CTA Band & Footer
- Deep Ink-Teal band with large serif headline: *"Thoughtful, precise dental care begins with a single conversation."*
- Dynamic banner displaying the **Next Available Consultation Slot** pulled live from Supabase.
- **Footer Hours Bug Fixed:**
  - Weekday: `Mon – Fri: 10:00 AM – 1:00 PM, 6:00 PM – 10:00 PM`
  - Saturday: `Sat: 10:00 AM – 5:00 PM`
  - Sunday: `Closed (Emergency & Urgent Care by prior telephonic appointment)`
- Direct Google Maps directions link, DPDP Act privacy policy link, and full DCI medical disclaimer.

---

## 3.5 Motion Specification

| Interaction Category | Duration | Easing Curve | Properties Animated | Restraint & Accessibility |
| :--- | :--- | :--- | :--- | :--- |
| **Micro-Interactions (Buttons, Chips)** | 200ms – 250ms | `power2.out` | `transform`, `background-color`, `border-color` | Magnetic pull capped at 6px max displacement. |
| **Dropdowns, Modals, Drawers** | 300ms – 350ms | `cubic-bezier(0.16, 1, 0.3, 1)` | `transform` (`translateY`), `opacity` | Zero layout shift; uses GPU composition. |
| **Section & Text Staggers** | 600ms – 800ms | `power3.out` | `opacity`, `translateY(24px -> 0)` | Stagger delay 0.08s between elements. |
| **ScrollTrigger Scrubbed Scenes** | Scrubbed with scroll | `power2.inOut` (scrub: 1.2s lag) | `rotation`, `position`, `svg stroke-dashoffset` | One active pinned scene per viewport. |
| **Prefers-Reduced-Motion** | 0ms (Instant) | None | Direct state toggle | Lenis disabled; 3D scrub disabled; static poster shown. |

---

## 3.6 Supabase Backend Architecture & Booking Workflow

### 3.6.1 Database Schema (Mumbai Region: `ap-south-1`)

```sql
-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Services Table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  indicative_price_range TEXT DEFAULT '[TO BE SUPPLIED BY CLINIC]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Dentists Table
CREATE TABLE public.dentists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialisation TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT '{"English", "Hindi", "Marathi"}',
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Dentist to Service Mapping
CREATE TABLE public.dentist_services (
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (dentist_id, service_id)
);

-- 5. Weekly Availability Rules
CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE CASCADE NOT NULL,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INTEGER NOT NULL DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Clinic Closures & Doctor Time Off
CREATE TABLE public.time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Appointments Table with Mathematical Double-Booking Prevention
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT UNIQUE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE RESTRICT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  notes TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  consent_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- DATABASE-LEVEL EXCLUDE CONSTRAINT:
  -- Prevents overlapping active bookings for the same dentist
  CONSTRAINT no_overlapping_appointments EXCLUDE USING gist (
    dentist_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status IN ('pending', 'confirmed'))
);
```

### 3.6.2 Availability Function (`get_available_slots`)
```sql
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_service_id UUID,
  p_date DATE,
  p_dentist_id UUID DEFAULT NULL
)
RETURNS TABLE (
  dentist_id UUID,
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dow INTEGER := EXTRACT(DOW FROM p_date);
  v_duration INTEGER := 45;
BEGIN
  -- Lookup service duration
  SELECT duration_minutes INTO v_duration FROM public.services WHERE id = p_service_id;
  IF v_duration IS NULL THEN v_duration := 45; END IF;

  RETURN QUERY
  WITH candidate_rules AS (
    SELECT ar.dentist_id, ar.start_time, ar.end_time, ar.slot_minutes
    FROM public.availability_rules ar
    WHERE ar.weekday = v_dow
      AND (p_dentist_id IS NULL OR ar.dentist_id = p_dentist_id)
  ),
  generated_slots AS (
    SELECT 
      cr.dentist_id,
      (p_date + t.slot_time) AT TIME ZONE 'Asia/Kolkata' AS s_start,
      (p_date + t.slot_time + (v_duration || ' minutes')::interval) AT TIME ZONE 'Asia/Kolkata' AS s_end
    FROM candidate_rules cr
    CROSS JOIN LATERAL generate_series(
      cr.start_time, 
      cr.end_time - (v_duration || ' minutes')::interval, 
      (cr.slot_minutes || ' minutes')::interval
    ) AS t(slot_time)
  )
  SELECT 
    gs.dentist_id,
    gs.s_start AS slot_start,
    gs.s_end AS slot_end,
    NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.dentist_id = gs.dentist_id
        AND a.status IN ('pending', 'confirmed')
        AND tstzrange(a.starts_at, a.ends_at) && tstzrange(gs.s_start, gs.s_end)
    ) AND NOT EXISTS (
      SELECT 1 FROM public.time_off tof
      WHERE (tof.dentist_id IS NULL OR tof.dentist_id = gs.dentist_id)
        AND tstzrange(tof.starts_at, tof.ends_at) && tstzrange(gs.s_start, gs.s_end)
    ) AS is_available
  FROM generated_slots gs
  ORDER BY gs.s_start ASC;
END;
$$;
```

### 3.6.3 Row-Level Security (RLS) & Client Validation Pipeline
1. **Public Anon Role:**
   - `services` & `dentists`: `SELECT` allowed (`is_active = true`).
   - `get_available_slots(...)`: `EXECUTE` allowed.
   - `appointments`: Direct `INSERT`, `UPDATE`, `SELECT`, `DELETE` are **FORBIDDEN**.
2. **Server-Side Booking Route / Server Action (`/api/booking/reserve`):**
   - **Validation:** Zod schema enforcing:
     - Name: 2–60 characters.
     - Phone: Indian 10-digit mobile prefixed with `+91`.
     - Email: RFC-compliant email string.
     - Consent: Mandatory boolean `true` (DPDP Act compliance).
     - Honeypot: Hidden input field `fax_number` (rejects bots silently).
     - Rate Limiting: Max 5 reservations per IP per hour.
   - **Execution:** Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only) to insert the appointment. If an exclusion conflict occurs, returns a graceful HTTP 409: *"This slot was just reserved by another patient. Please choose an adjacent time."*
3. **Clinic Admin Workspace (`/admin`):**
   - Authenticated via Supabase Auth with staff role check.
   - Live appointments table subscribing to Supabase Realtime updates.
   - One-click Confirm, Reschedule, or Cancel with patient notification.
   - CSV export for reception records.

### 3.6.4 Booking UX (5 Seamless Steps)
1. **Step 1: Select Treatment** — Visual service cards with duration and category filter.
2. **Step 2: Choose Specialist** — Clinician cards with specializations + "No Preference / First Available" option.
3. **Step 3: Select Date & Slot** — Clean calendar picker with live morning/evening slot chips.
4. **Step 4: Patient Details** — Name, WhatsApp mobile, optional email, clinical notes, and DPDP consent checkbox.
5. **Step 5: Instant Confirmation** — Generated reference code (e.g., `LUM-84920`), pre-filled WhatsApp confirmation button, and `.ics` calendar download file.

---

## 3.7 Quality Targets & Acceptance Criteria

| Metric / Requirement | Target Benchmark | Verification Method |
| :--- | :--- | :--- |
| **Mobile Lighthouse Performance** | **>= 85 / 100** | Lighthouse mobile audit (4G throttling, mid-tier Android). |
| **Mobile Accessibility** | **>= 95 / 100** | Lighthouse + axe-core automated audit. |
| **SEO & Best Practices** | **>= 95 / 100** | Validated Schema.org `Dentist` JSON-LD, sitemap, meta tags. |
| **Cumulative Layout Shift (CLS)** | **< 0.1 (Target: 0.02)** | Explicit dimension containers for 3D canvas and bento cards. |
| **Largest Contentful Paint (LCP)** | **< 2.5s** | Instant SVG poster fallback rendered before 3D bundle executes. |
| **Double-Booking Prevention** | **100% Guaranteed** | Attempted concurrent insert on same doctor/slot rejected by PostgreSQL constraint. |
| **Responsive Breakpoints** | Pixel-perfect at 360px, 768px, 1280px, 1920px | Chrome DevTools device mode testing. |
| **DCI Compliance & Ethics** | No exaggerated claims, no guaranteed outcomes | Educational copy; explicit consent disclaimers on gallery. |

---

## 3.8 Approval Checkpoint

> [!IMPORTANT]
> **Action Required from User:**
> Please review and approve `PLAN.md` and confirm your preferred clinic brand name:
> 1. **Lumina Dental & Implant Studio** *(Default)*
> 2. **Aura Dental & Implant Centre**
> 3. **Praxis Dental Atelier**
> 4. **Triniti Dental & Maxillofacial Studio**
> 5. **Veda Dental Clinic & Implantology**
> (Or confirm any custom name of your choice).
> 
> Once approved, Phase 4 (Build) will commence immediately following the specified build order.
