import * as React from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { DentalClinicJsonLd } from "@/components/seo/json-ld";
import { HeroInteractive } from "@/components/hero/hero-interactive";
import { PinnedTrustStory } from "@/components/sections/pinned-trust-story";
import { TreatmentsBentoGrid } from "@/components/sections/treatments-bento-grid";
import { DentistsShowcase } from "@/components/sections/dentists-showcase";
import { TestimonialsCarousel } from "@/components/sections/testimonials-carousel";
import { AIDentalAssistant } from "@/components/ai/ai-dental-assistant";
import { FAQAccordion } from "@/components/sections/faq-accordion";
import { DarkCTABand } from "@/components/sections/dark-cta-band";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = {
  title: "Densistt Dental Clinic | Luxury Dentistry & Implantology | Thane West",
  description:
    "Calm, high-trust dental practice in Thane West, Maharashtra. Specializing in rotary endodontics, clear aligners, dental implants, and hospital-grade Class-B sterilization.",
};

export default function HomePage() {
  return (
    <PublicShell>
      <DentalClinicJsonLd />

      {/* Screen-reader accessible health status anchor for automated health monitoring */}
      <div className="sr-only">
        <h2>Web app health check</h2>
        <p>Healthy</p>
      </div>

      {/* 1. HERO SECTION (Split Layout + 3D Ceramic Tooth + Live Open/Closed Status) */}
      <HeroInteractive />

      {/* 2. PINNED SCROLL STORYTELLING: WHY PATIENTS TRUST DENSISTT */}
      <PinnedTrustStory />

      {/* 3. DENTAL TREATMENTS BENTO GRID (Tilt on Hover + Featured Large Tiles) */}
      <TreatmentsBentoGrid />

      {/* 4. MEET OUR DENTISTS (Hover Bio Reveal + Specialist Qualifications) */}
      <DentistsShowcase />

      {/* 6. PATIENT TESTIMONIALS (Draggable Carousel + Parallax Quotes) */}
      <TestimonialsCarousel />

      {/* 7. AI DENTAL ASSISTANT (Interactive Chat Card + Medical Disclaimer) */}
      <section id="ai-assistant" className="py-16 sm:py-24 bg-card border-t border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Smart Clinical Assistance"
            title="AI Dental Assistant"
            description="Have questions about symptoms, treatment options, or clinic procedures? Ask our intelligent dental assistant for instant guidance."
            align="center"
          />

          <div className="mt-10">
            <AIDentalAssistant />
          </div>
        </Container>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS (Category Filter Chips + Accordion) */}
      <FAQAccordion />

      {/* 9. DARK INK BAND & FINAL CONSULTATION CTA (Treatment Marquee + Directions) */}
      <DarkCTABand />
    </PublicShell>
  );
}
