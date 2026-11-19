import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export const metadata = {
  title: "About Our Clinic & Clinical Hygiene Practices | Dental Excellence",
  description:
    "Learn about our clinical philosophy, Class-B vacuum sterilization, digital diagnostics, and patient-first ethical dental care in Thane.",
};

export default function AboutPage() {
  const { clinic, dentists } = clinicContent;

  return (
    <PublicShell>
      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Our Clinical Heritage &amp; Standards
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            About Our Practice
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-4 leading-relaxed">
            Established with a singular commitment: delivering precise, painless, and ethical dental surgery
            supported by hospital-grade infection control and continuous clinical research.
          </p>
        </Container>
      </section>

      {/* 1. CLINICAL STORY & MISSION */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <SectionHeading
                eyebrow="Clinical Story"
                title="A Philosophy Rooted in Tooth Preservation"
              />
              <div className="prose text-muted-foreground text-sm sm:text-base leading-relaxed flex flex-col gap-4">
                <p>
                  <TBDText value={clinic.story} fallbackKey="clinic_story" />
                </p>
                <p>
                  Our practice rejects commercial quotas and overtreatment. Every restorative, endodontic, or
                  prosthodontic recommendation begins with an objective assessment of long-term biological tooth
                  preservation and patient systemic wellbeing.
                </p>
                <p>
                  Mission: <TBDText value={clinic.mission} fallbackKey="clinic_story" />
                </p>
              </div>

              {/* Core Clinical Values */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-serif text-xl font-bold text-foreground mb-4">Core Clinical Principles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clinic.values.map((val, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-card border border-border flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        ✓
                      </span>
                      <p className="text-xs text-foreground leading-normal">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Fact Box */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-xl bg-card border border-border shadow-sm flex flex-col gap-6">
                <h3 className="font-serif text-xl font-bold text-foreground pb-3 border-b border-border">
                  Practice Registration &amp; Governance
                </h3>
                <div className="flex flex-col gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Legal Entity:</span>
                    <p className="font-medium text-foreground mt-0.5">
                      <TBDText value={clinic.legalName} fallbackKey="clinic_legal_name" />
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clinical Establishment ID:</span>
                    <p className="font-medium text-foreground mt-0.5">
                      <TBDText value={clinic.licenses[0]} fallbackKey="clinic_licenses" />
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Regulatory Authority:</span>
                    <p className="font-medium text-foreground mt-0.5">
                      Maharashtra State Dental Council / Dental Council of India
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sterilization Monitoring:</span>
                    <p className="font-medium text-foreground mt-0.5">
                      Class-B Vacuum Autoclave with biological spore and chemical strip verification
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex flex-col gap-2">
                  <Link href="/dentists">
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      View Clinical Specialists
                    </Button>
                  </Link>
                  <Link href="/book">
                    <Button variant="primary" size="sm" className="w-full justify-center">
                      Book Appointment
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. HYGIENE & STERILIZATION PROTOCOL */}
      <section className="py-16 sm:py-24 bg-card border-y border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Patient Safety"
            title="Hospital-Grade Infection Control Protocol"
            description="We maintain rigorous anti-cross-contamination protocols exceeding national standards."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {clinic.hygienePractices.map((step, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-background border border-border shadow-xs flex flex-col gap-3">
                <span className="font-serif text-3xl font-bold text-primary">0{idx + 1}</span>
                <p className="text-sm text-foreground font-medium leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 sm:p-8 rounded-xl bg-accent/30 border border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 max-w-2xl">
              <h4 className="font-serif text-lg font-bold text-foreground">
                Class-B Fractional Vacuum Autoclave
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlike simple desktop steamers, Class-B fractionated pre-vacuum autoclaves extract 99% of air from
                hollow dental handpieces and surgical burs, ensuring 134°C saturated steam reaches every inner lumen.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
              Zero Compromise Safety
            </span>
          </div>
        </Container>
      </section>

      {/* 3. CLINICAL TEAM TEASER */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <SectionHeading
            eyebrow="Clinical Leadership"
            title="Specialist Doctors Committed to Your Care"
            description="Our multidisciplinary team works collaboratively across endodontics, prosthodontics, and orthodontics."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {dentists.map((doc) => (
              <div key={doc.id} className="p-6 rounded-xl bg-card border border-border flex flex-col gap-3">
                <div className="h-16 w-16 rounded-full bg-accent text-primary flex items-center justify-center font-serif text-xl font-bold">
                  {doc.name.startsWith("TBD:") ? "Dr" : doc.name.charAt(0)}
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  <TBDText value={doc.name} fallbackKey="dentist_roster" />
                </h3>
                <p className="text-xs text-secondary font-semibold">{doc.role}</p>
                <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                <div className="pt-2 border-t border-border mt-2">
                  <Link href="/dentists" className="text-xs font-semibold text-primary hover:underline">
                    View Full Profile &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
