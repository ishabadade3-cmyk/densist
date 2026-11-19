import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export function Footer() {
  const currentYear = 2026; // System year baseline per 2026-11-17 context
  const { clinic, services } = clinicContent;

  return (
    <footer className="bg-card text-card-foreground border-t border-border mt-auto">
      {/* 24/7 Emergency Care Warning Banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-3">
        <Container size="lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
              <span className="font-semibold text-destructive">Dental Emergency Protocol:</span>
              <span>Acute trauma, uncontrollable bleeding, or severe swelling? Call our urgent care handoff.</span>
            </div>
            <div className="flex items-center gap-3 font-medium">
              <span>Helpline: <TBDText value={clinic.phone} fallbackKey="clinic_phone" /></span>
              <span>Ambulance: {clinic.emergencyContacts.ambulance}</span>
            </div>
          </div>
        </Container>
      </div>

      <Container size="lg" className="py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Column 1: Brand & Clinical Philosophy */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground">
              <span className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif text-lg font-bold">
                D
              </span>
              <TBDText value={clinic.brandName} fallbackKey="clinic_brand" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Bespoke, ethical dental surgery and aesthetic rehabilitation. Hospital-grade Class-B sterilization,
              digital diagnostic precision, and patient-first care without commercial over-treatment.
            </p>
            <div className="text-xs text-muted-foreground/80 flex flex-col gap-1 pt-2 border-t border-border/60">
              <p>Legal Entity: <TBDText value={clinic.legalName} fallbackKey="clinic_legal_name" /></p>
              <p>Clinic Registration: <TBDText value={clinic.licenses[0]} fallbackKey="clinic_licenses" /></p>
            </div>
          </div>

          {/* Column 2: Clinical Services */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-base font-semibold text-foreground tracking-tight">
              Clinical Treatments
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {services.slice(0, 5).map((service) => (
                <li key={service.slug}>
                  <Link href={`/services/${service.slug}`} className="hover:text-primary transition-colors">
                    {service.title.split("(")[0].trim()}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/services" className="text-primary font-medium hover:underline text-xs mt-1 inline-block">
                  View All Treatments →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Patient Information & Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-base font-semibold text-foreground tracking-tight">
              Patient Care
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Clinic &amp; Hygiene
                </Link>
              </li>
              <li>
                <Link href="/dentists" className="hover:text-primary transition-colors">
                  Our Dental Surgeons
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Location & Operating Hours */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-base font-semibold text-foreground tracking-tight">
              Clinic Location
            </h4>
            <address className="not-italic text-sm text-muted-foreground leading-relaxed flex flex-col gap-1.5">
              <p>
                <TBDText value={clinic.address.street} fallbackKey="clinic_address" />
              </p>
              <p>
                {clinic.address.city}, {clinic.address.state} - <TBDText value={clinic.address.postalCode} fallbackKey="clinic_address" />
              </p>
              <p className="pt-2 text-foreground font-medium">
                Phone: <TBDText value={clinic.phone} fallbackKey="clinic_phone" />
              </p>
              <p className="text-foreground font-medium">
                Email: <TBDText value={clinic.email} fallbackKey="clinic_email" />
              </p>
            </address>
            <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Hours:</p>
              <p>Mon - Sat: <TBDText value={clinic.hours.regular[0].hours} fallbackKey="clinic_hours" /></p>
              <p>Sun: <TBDText value={clinic.hours.regular[1].hours} fallbackKey="clinic_hours" /></p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimers & Copyright Sub-footer */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} <TBDText value={clinic.brandName} fallbackKey="clinic_brand" />. All clinical rights reserved.</p>

          <nav aria-label="Legal and Compliance" className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/policies/privacy" className="hover:text-primary transition-colors">
              Privacy Policy (DPDP Act)
            </Link>
            <Link href="/policies/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/policies/cancellation" className="hover:text-primary transition-colors">
              Cancellation Policy
            </Link>
          </nav>
        </div>

        {/* Clinical Disclaimer per Dental Council Guidelines */}
        <p className="mt-4 text-[11px] text-muted-foreground/60 text-center sm:text-left leading-normal">
          Medical Disclaimer: The clinical information presented on this platform is published solely for patient education and awareness.
          It does not constitute direct medical or dental advice. Individual clinical diagnosis and treatment plans require an in-person
          consultation with a registered dental surgeon under applicable Dental Council of India regulations.
        </p>
      </Container>
    </footer>
  );
}
