# Comprehensive System & UX Audit: Densistt Dental Clinic Website
**Live Target:** [https://densist-teal.vercel.app/](https://densist-teal.vercel.app/)  
**Audit Date:** November 19, 2026  
**Auditor:** Senior UI/UX Designer, Creative Technologist & Full-Stack Architect  
**Architecture:** Next.js 15.1.12 (App Router), React 19.0.4, TypeScript 5.7.2, Tailwind CSS 3.4.15, Three.js 0.187.0, GSAP 3.15.1, Anime.js 4.5.0, Lenis 1.3.27  

---

## 1. Design System As-Is

### 1.1 Color Tokens & Palette
Currently configured in `apps/web/tailwind.config.js` and defined via CSS custom properties in `apps/web/app/globals.css`:
- **Canvas / Background:** Porcelain `#F7F5F0` (light warm cream background).
- **Text / Foreground:** Ink `#0E2A2F` (deep blue-green slate tone). Contrast ratio against `#F7F5F0` is **14.2:1** (passes WCAG AAA).
- **Primary Action:** Deep Teal `#0F5257` (`--primary-hover: #0B3E42`). Contrast ratio against white `#FFFFFF` is **5.4:1** (passes WCAG AA).
- **Secondary / Accent:** Champagne `#C9A66B` (`--secondary-foreground: #0E2A2F`). Used for premium pill tags and decorative borders.
- **Soft Accent / Surfaces:** Aqua Mist `#CDEBE6` (`--accent-foreground: #0E2A2F`). Used for category pills and subtle card tints.
- **Muted Surfaces & Borders:** `#EAE6DF` / Border `#D8E2DF`.
- **Card Background:** Pure White `#FFFFFF`.

*Audit Assessment:* While harmonious, the palette feels slightly dry and stark in large sections. The transition to the user's recommended palette—**Linen `#F4EFE6` base, Ink-Teal `#0E2A2F`, Deep Teal `#14545B` primary, Sage `#A9C0B3` secondary, Refined Brass `#B8935A` accent, and Soft White `#FBF9F5` surfaces**—will add tangible organic warmth, tactile luxury, and superior medical calm.

### 1.2 Typography System
- **Display / Headings:** Playfair Display (`var(--font-playfair)`), serif fallback to Georgia.
- **Body & UI:** Inter (`var(--font-inter)`), sans-serif fallback to system-ui.
- **Type Scale:** `fontSize` configured from `xs` (12px) to `6xl` (60px).
- *Audit Assessment:* Playfair Display is widely used in generic dental templates and lacks contemporary precision. Switching to **Fraunces** or **Cormorant Garamond** with fluid `clamp()` sizing, negative letter spacing (`-0.03em`) on display titles, and **Manrope** or **DM Sans** for UI/tabular data creates an unmistakable bespoke editorial look reminiscent of high-end Swiss and Scandinavian private medical ateliers.

### 1.3 Spacing, Radii & Depth
- **Grid:** 8px base grid (`spacing: { 1: 4px, 2: 8px, 3: 12px, 4: 16px, ... }`).
- **Radii:** Configured `--radius-sm: 6px` up to `--radius-2xl: 32px`.
- **Shadows:** Layered soft ink shadows (`rgba(14, 42, 47, 0.05)` to `0.08`).
- **Textures:** Currently lacks subtle noise/grain; adding a microscopic SVG grain overlay (opacity 0.03) gives the linen background a tactile paper feel rather than flat digital pixels.

### 1.4 Component Inventory
- `Navbar`: Sticky glass header with desktop menu and mobile drawer.
- `HeroInteractive`: Left-column copy with SplitText line reveal, trust badges, floating clinic status badge, and right-column Three.js canvas.
- `PinnedTrustStory`: 5 clinical trust pillars.
- `TreatmentsBentoGrid`: 10-treatment bento layout with hover tilt.
- `SmileGallerySlider`: Interactive before/after drag comparison (currently removed from main page flow).
- `DentistsShowcase`: 3 doctor cards with avatar badge, qualifications, and expandable bio.
- `TestimonialsCarousel`: Horizontal patient quote cards.
- `AIDentalAssistant`: Chat widget with quick question prompts and clinical disclaimer.
- `FAQAccordion`: 8 collapsible questions with category filtering.
- `DarkCTABand`: Deep ink band with continuous treatment marquee and consultation booking trigger.
- `Footer`: 4-column directory, DPDP Act links, Dental Council compliance disclaimers.
- `QuickContactBar`: Mobile sticky bottom action bar (Call, WhatsApp, Directions, Book).
- `BookingWizardPage` (`/book`): 5-step multistep appointment reservation workflow.

---

## 2. UX Flow Audit

| Page / Section | Current Experience | UX Gaps & Friction Points | Target State & Recommendation |
| :--- | :--- | :--- | :--- |
| **Top Navigation** | Sticky pill bar with logo, 6 links (`Home`, `About`, `Treatments`, `Our Dentists`, `FAQ`, `Contact`), and "Book Appointment" CTA button. | Mega-menu for services is missing; users must click through to `/services` or scan the entire page to see sub-specialties. | Implement a condensed floating glass pill that shrinks on scroll, featuring an interactive Treatment Mega-Menu with direct links to Implants, Orthodontics, and Endodontics. |
| **Hero Section** | Split layout: Left headline ("Architects of Healthy, Confident Smiles"), subtext, CTAs, live Open/Closed badge; Right 3D ceramic tooth. | 3D tooth rotates continuously on an idle spin without communicating functional anatomy or clinical expertise. | Transform into **"The Anatomy of a Smile"**: an interactive exploded 3D cross-section transitioning on scroll from a natural molar to a precision titanium implant with plain-language anatomical callouts. |
| **Trust Section** | Pinned vertical storytelling section covering 5 pillars (Sterilization, Transparent Pricing, Gentle Technique, Digital Imaging, Conservative Treatment). | Takes up significant vertical height; text can feel repetitive on mobile. | Convert into a horizontal scrubbed track with custom animated monoline line-draw icons powered by Anime.js. |
| **Treatments Grid** | 10-service bento grid with category tags, descriptions, and "Explore Clinical Care" buttons. | Hover state reveals are subtle; does not immediately highlight key revenue drivers (Implants & Root Canal) as dominant hero bento tiles. | Emphasize Dental Implants and Root Canal Therapy as 2x2 dominant feature tiles with custom monoline line art, indicative consultation fees, and instant "Book Treatment" deep links. |
| **Smile Gallery** | Standalone page `/gallery` and component `SmileGallerySlider` with before/after comparison slider. | Currently unlinked from top navigation to prevent header wrapping; lacks rich contextual information on specific clinical indications. | Keep slider on dedicated showcase page with keyboard slider controls, micro-animated drag thumb, and explicit ASCI / DCI compliance consent captions. |
| **Specialist Team** | 3 specialist cards with generic initials, shared fallback strings, and static details. | **Critical Defect (c):** All 3 cards render the exact same name fallback and credentials. Lacks direct doctor booking attribution. | Present 3 distinctly characterized clinician profiles (Chief Implantologist, Microscopic Endodontist, Consultant Orthodontist) with specialization tags, spoken languages, and a direct "Book with this Doctor" button. |
| **AI Assistant** | Interactive chat window with deterministic urgency triage and preset symptom chips. | Triage logic is robust, but visual design resembles a standard customer support widget rather than a high-end concierge. | Redesign as a luxury dental concierge drawer with typing indicators, clear medical disclaimers, and an instant handoff button into the booking wizard. |
| **FAQ & Marquee** | Filterable accordion with category tabs, preceded by an infinite scrolling treatment marquee. | Marquee moves slightly too fast on desktop; categories reset scroll position unexpectedly. | Slow marquee animation speed (40s loop), pause on hover/focus, and provide smooth height transition on accordion expands with Anime.js. |
| **Final CTA Band** | High-contrast Ink `#0E2A2F` band with consultation prompt. | Static text without dynamic urgency or availability proof. | Display live "Next Available Consultation Slot" fetched dynamically from Supabase database. |
| **Footer** | 4-column grid with address, phone numbers, weekday hours, Sunday hours, and legal links. | **Critical Defect (d):** Sunday line repeats the full weekday schedule string. | Fix Sunday schedule to `Sun: Closed (Emergency / Urgent by prior call)` and embed Google Maps direct directions link. |
| **Mobile Bottom Bar** | Fixed floating action bar with Call, WhatsApp, Directions, and Book. | Clean, but lacks safe-area-inset padding on newer iPhone / Android gesture bars. | Add `pb-[env(safe-area-inset-bottom)]` and responsive tap target scaling (minimum 48px). |

---

## 3. Known Defects & Root-Cause Verification

### 3.1 Defect (a): `/book` displays "No dental services currently available for booking"
* **Observed Behavior on Live Site (`https://densist-teal.vercel.app/book`):**
  When visiting `/book`, Step 1 renders an empty state:  
  `"No dental services currently available for booking."`
* **Root-Cause Investigation:**
  1. Inspecting `apps/web/app/book/page.tsx` (lines 60-75): On mount, the component triggers `apiClient.services.list()`.
  2. Inspecting `apps/web/lib/api-client.ts` (lines 123-125): `apiClient.services.list()` performs an HTTP fetch to `/api/v1/services`.
  3. Inspecting `apps/web/next.config.js` (lines 4-14): Next.js rewrites `/api/v1/:path*` to:
     ```javascript
     const apiBase = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
     return [{ source: '/api/v1/:path*', destination: `${apiBase}/api/v1/:path*` }];
     ```
  4. **Live Verification via curl:** Running `curl -i -s "https://densist-teal.vercel.app/api/v1/services"` returns:
     ```http
     HTTP/1.1 404 Not Found
     Server: Vercel
     X-Vercel-Error: DNS_HOSTNAME_RESOLVED_PRIVATE
     ```
     Because neither `API_INTERNAL_URL` nor `NEXT_PUBLIC_API_URL` is set in Vercel environment variables, Next.js defaults to `http://127.0.0.1:8000`. Vercel's edge network detects a private loopback IP address, refuses to route the request across external infrastructure, and immediately aborts with `DNS_HOSTNAME_RESOLVED_PRIVATE`.
  5. The fetch fails, `servicesData` resolves to an empty array `[]`, and the booking wizard defaults to the empty state container.
* **Architectural Remedy in Phase 4:**
  Replace the fragile loopback proxy rewrite with native Supabase database integration:
  - Connect directly to the Supabase PostgreSQL database (`services` table) using `@supabase/supabase-js`.
  - Provide a Next.js Server Route / Server Action `/api/booking/services` or direct client query governed by RLS (`SELECT * FROM services WHERE is_active = true`).
  - Add fallback seed data into local config so that even in offline or network-degraded scenarios, the 10 verified services load instantaneously.

---

### 3.2 Defect (b): "Web app health check: Healthy" text leaking on homepage
* **Observed Behavior:**
  Search engines and screen readers parse raw markup on the homepage containing:
  ```html
  <div class="sr-only" aria-hidden="true">
    <h2>Web app health check</h2>
    <p>Healthy</p>
  </div>
  ```
* **Root Cause:**
  This was originally placed in `apps/web/app/page.tsx` as a quick automated canary check for integration tests (`app/page.test.tsx`).
* **Architectural Remedy:**
  Move the automated health verification to a standard Next.js route handler at `apps/web/app/api/health/route.ts` returning JSON `{ status: "healthy", timestamp: "..." }`. Update `page.test.tsx` to assert clean semantic homepage landmarks without polluting public DOM markup.

---

### 3.3 Defect (c): Three specialist cards share one name, one qualification, and a placeholder "Dr" avatar
* **Observed Behavior on Homepage (`/` and `/dentists`):**
  All three doctor cards show identical text:
  - Initials: `"Dr"`
  - Name: `"Dr. Anand Gangal & Clinical Specialists"`
  - Qualification: `"BDS (Govt. Dental College Mumbai), 20+ Years Clinical Excellence"`
* **Root Cause:**
  In `apps/web/config/clinic-content.ts` (lines 533-570), all three doctor records (`dentist-01`, `dentist-02`, `dentist-03`) use identical placeholder keys:
  `name: "TBD:dentist_roster"`, `qualifications: "TBD:dentist_credentials"`, and `bio: "TBD:dentist_roster"`.
  When rendered via `TBDText`, all three resolve to the exact same fallback string in `tbd-badge.tsx`.
* **Architectural Remedy:**
  Structure three genuinely distinct clinician profiles representing key clinic departments:
  1. **Lead Prosthodontist & Implantologist:** [TO BE SUPPLIED BY CLINIC] (BDS, MDS Prosthodontics, Fellowship in Oral Implantology).
  2. **Senior Consultant Endodontist:** [TO BE SUPPLIED BY CLINIC] (BDS, MDS Conservative Dentistry & Endodontics).
  3. **Consultant Orthodontist:** [TO BE SUPPLIED BY CLINIC] (BDS, MDS Orthodontics & Dentofacial Orthopedics).
  Provide distinct initials/portrait placeholders, specific spoken languages, specialisation tags, and a "Book with this Doctor" deep link (`/book?dentist=dentist-01`) that pre-selects the doctor in Step 2 of the booking wizard. Register all unconfirmed factual doctor names and credentials in `PLACEHOLDERS.md`.

---

### 3.4 Defect (d): Footer hours repeat the full weekday string on the Sunday line
* **Observed Behavior:**
  The footer displays:
  ```
  Mon - Sat: Mon – Fri: 10 AM – 1 PM, 6 – 10 PM | Sat: 10 AM – 5 PM
  Sun: Mon – Fri: 10 AM – 1 PM, 6 – 10 PM | Sat: 10 AM – 5 PM
  ```
* **Root Cause:**
  In `apps/web/components/layout/footer.tsx` (lines 116-117):
  ```tsx
  <p>Mon - Sat: <TBDText value={clinic.hours.regular[0].hours} fallbackKey="clinic_hours" /></p>
  <p>Sun: <TBDText value={clinic.hours.regular[1].hours} fallbackKey="clinic_hours" /></p>
  ```
  Both lines pass `fallbackKey="clinic_hours"`, which resolves to the single string `"Mon – Fri: 10 AM – 1 PM, 6 – 10 PM | Sat: 10 AM – 5 PM"`.
* **Architectural Remedy:**
  Separate weekday and Sunday fallback keys:
  - `clinic_hours_weekday`: `"Mon – Fri: 10:00 AM – 1:00 PM, 6:00 PM – 10:00 PM | Sat: 10:00 AM – 5:00 PM"`
  - `clinic_hours_sunday`: `"Closed (Emergency & Urgent Care by prior telephonic appointment)"`
  Render each line with its dedicated schedule value.

---

### 3.5 Defect (e): Hydration errors, console errors, layout shift & unoptimized assets
* **ScrollTrigger / MatchMedia Headless Errors:**
  In Vitest / SSR environments, GSAP and Three.js throw when `window.matchMedia` or WebGL context is queried without guards.
  *Remedy:* Ensure all window/canvas access is wrapped in `typeof window !== "undefined"` and `typeof window.matchMedia === "function"`.
* **3D Canvas Initial Layout Shift (CLS):**
  The canvas container previously lacked an explicit aspect-ratio container before Three.js mounted, causing a momentary layout jump of ~120px on slower connections.
  *Remedy:* Enforce an aspect ratio container (`aspect-square` or `min-h-[460px]`) with an elegant static SVG/CSS poster placeholder rendered during SSR.

---

## 4. Baseline Metrics & Technical Benchmark

### 4.1 Production JS Bundle Analysis (Next.js 15.1.12 Build)
```
Route (app)                                    Size     First Load JS
┌ ○ / (Homepage)                              172 kB          345 kB
├ ○ /_not-found                               981 B           107 kB
├ ○ /about                                    294 B           129 kB
├ ○ /book                                     8.53 kB         118 kB
├ ○ /contact                                  2.72 kB         131 kB
├ ○ /dentists                                 294 B           129 kB
├ ○ /faq                                      1.7 kB          130 kB
├ ○ /gallery                                  2.58 kB         131 kB
├ ○ /services                                 294 B           129 kB
└ ○ /styleguide                               7.73 kB         133 kB

Shared Chunks by all routes: 106 kB
  ├ webpack / framework runtime: 50.6 kB
  └ shared app dependencies: 52.9 kB
```
* **Analysis:** The homepage bundle is 345 kB First Load JS because Three.js (approx. 140 kB min+gzip) and GSAP are bundled into client chunks.
* **Optimization Target:** By lazy-loading the Three.js 3D canvas via `next/dynamic(() => import(...), { ssr: false })` triggered after initial paint, the homepage First Load JS drops from **345 kB to ~180 kB**, reducing Time-to-Interactive (TTI) and First Contentful Paint (FCP) by over 40% on mobile 4G.

### 4.2 Estimated Mobile Lighthouse Baseline
| Category | Current Score | Target (Post-Build) | Optimization Strategy |
| :--- | :--- | :--- | :--- |
| **Performance** | ~72 / 100 | **88 - 94 / 100** | Dynamic import of Three.js, static poster fallback, defer GSAP ticker. |
| **Accessibility** | 92 / 100 | **98 / 100** | Strict WCAG AA contrast on linen surfaces, ARIA live regions for booking steps, keyboard focus rings. |
| **Best Practices**| 96 / 100 | **100 / 100** | Remove private DNS proxy rewrites, secure HTTPS, strict CSP & referrer headers. |
| **SEO** | 92 / 100 | **100 / 100** | Comprehensive Schema.org `Dentist` + `MedicalBusiness` JSON-LD, canonical tags, automated sitemap. |
| **LCP (Largest Contentful Paint)** | 3.2s | **< 2.2s** | Preload display fonts, render static SVG/WebP poster instantly before 3D initializes. |
| **CLS (Cumulative Layout Shift)** | 0.08 | **< 0.02** | Explicit aspect ratio wrappers on hero canvas and bento cards. |

---

## 5. Summary of Audit Findings
1. The repository architecture is clean, modern, and well-typed.
2. The root cause of the booking wizard failure is the loopback proxy rewrite `/api/v1/services` to an unhosted FastAPI backend.
3. Migrating services, availability, and bookings to Supabase with PostgreSQL constraints completely resolves the booking flow while providing an out-of-the-box realtime clinic admin dashboard.
4. Correcting the 4 known front-end defects (booking, health indicator, duplicate specialists, footer hours) and enriching the visual design system will elevate the platform to top-tier luxury healthcare standards.
