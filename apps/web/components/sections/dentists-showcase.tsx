"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { TBDText } from "@/components/ui/tbd-badge";
import { clinicContent } from "@/config/clinic-content";

/**
 * NOTE FOR CLINICAL ADMINISTRATION / CONTENT LEAD:
 * The 3 doctor cards below currently reference fallback entries ('TBD:dentist_roster',
 * 'TBD:dentist_credentials') in test fixtures and must be populated with real,
 * distinct clinical data for each specialist prior to final marketing deployment.
 */
export function DentistsShowcase() {
  const { dentists } = clinicContent;

  return (
    <section className="py-16 sm:py-24 bg-background">
      <Container size="lg">
        <SectionHeading
          eyebrow="Clinical Leadership"
          title="Led by Registered Dental Specialists"
          description="Our clinical surgeons bring post-graduate qualifications and a unified philosophy of conservative, patient-centered care."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {dentists.map((doc) => (
            <div
              key={doc.id}
              className="group relative rounded-3xl p-6 sm:p-8 bg-card border border-border shadow-xs hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex flex-col gap-4">
                {/* Doctor Avatar / Visual Anchor */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent text-primary flex items-center justify-center font-serif text-2xl font-bold border border-border shadow-xs">
                    {doc.name.startsWith("TBD:") ? "Dr" : doc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      <TBDText value={doc.name} fallbackKey="dentist_roster" />
                    </h3>
                    <p className="text-xs font-semibold text-secondary">{doc.role}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-primary font-semibold">Specialization</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{doc.specialization}</p>
                </div>

                <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground flex flex-col gap-1">
                  <p>
                    <span className="font-semibold text-foreground">Qualifications: </span>
                    <TBDText value={doc.qualifications} fallbackKey="dentist_credentials" />
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Languages: </span>
                    {doc.languages.join(", ")}
                  </p>
                </div>

                {/* Hover / Focus Reveals Clinical Bio */}
                <div className="pt-2 text-xs text-muted-foreground/90 italic border-t border-border/40 transition-opacity">
                  <TBDText value={doc.bio} fallbackKey="clinic_story" />
                </div>
              </div>

              <div className="pt-6 border-t border-border/60 flex items-center justify-between gap-2 mt-6">
                <Link href="/dentists" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
                  View Profile &rarr;
                </Link>
                <Link href="/book">
                  <Button variant="primary" size="sm" className="rounded-full text-xs font-semibold">
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/dentists">
            <Button variant="outline" size="md" className="rounded-full px-8">
              View Verified Specialist Credentials &rarr;
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
