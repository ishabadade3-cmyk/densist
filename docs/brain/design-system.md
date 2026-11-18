# Design system baseline

## Tokens (SRS §12.2)

| Token | Value |
|---|---|
| Primary | `#0B5D5E` deep teal |
| Secondary | `#C5A46D` champagne gold |
| Background | `#FAF9F6` warm ivory |
| Text | `#242B2B` charcoal |
| Accent | `#DDE9E3` soft sage |
| Heading | Playfair Display or similar refined serif; final font TBD:font_license |
| Body | Inter or similar readable sans serif; final font TBD:font_license |

## Scale proposals

SRS provides color/font tokens only. These values are proposed defaults, not locked decisions: type sizes 12,14,16,18,20,24,30,36,48,60 px (1.25 ratio approximate); spacing 4,8,12,16,24,32,48,64,96 px; radii 4,8,12,16,24 px and pill; shadows 0 1px 2px #242B2B14, 0 4px 16px #242B2B12, 0 12px 32px #242B2B18. Confirm with design owner: TBD:design_tokens.

## Motion

Restrained motion only (SRS §12.1, §12.4). Honor `prefers-reduced-motion`; no essential information conveyed through motion; avoid flashing; proposed duration cap 200ms for interaction and 400ms for transitions, TBD:motion_standard.

## Component inventory

Navigation/header, responsive menu, footer, hero/booking CTA, service cards, dentist cards, trust indicators, booking calendar and slot picker, accessible forms/validation, buttons/links, tabs/accordion, dialogs/emergency handoff, alerts, badges, data tables, status chips, pagination, empty/loading/success/error states, document list, invoice/payment summary, consent controls, gallery/image viewer only for consented and legally approved material, blog cards/search, assistant launcher/chat, chart/report components, focus indicators.

## WCAG 2.2 AA rules (NFR-006)

- Text contrast at least 4.5:1 for normal text and 3:1 for large text; meaningful UI graphics and controls contrast at least 3:1.
- All functions work by keyboard; visible, unobscured focus; logical focus order; no keyboard traps; skip link and semantic landmarks/headings.
- Pointer targets minimum 24×24 CSS px or satisfy WCAG spacing exception; aim for 44×44 for primary touch controls.
- Forms have persistent labels, instructions, programmatic errors, suggestions and status announcements; do not rely on color alone.
- Images have appropriate text alternatives; decorative images are ignored by assistive technology; captions/transcripts for media as applicable.
- Reflow at 320 CSS px and zoom/text resize to 200% without loss; content adapts to orientation.
- Authentication and accessible alternatives avoid cognitive-function tests; timeout warnings and extension where applicable.
- Dragging has non-drag alternative; redundant entry and consistent help requirements are respected.
- Respect reduced motion and avoid seizure-triggering flashes.
- Test representative journeys with keyboard and screen reader; automated checks do not establish conformance alone.
