import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export const metadata = {
  title: "Specialist Dental Surgeons & Credentials | Dental Excellence",
  description:
    "Meet our team of registered dental specialists in endodontics, prosthodontics, implantology, and orthodontics. Verified credentials under Dental Council of India regulations.",
};

export default function DentistsPage() {
  const { dentists } = clinicContent;

  return (
    <PublicShell>
      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Registered Dental Surgeons
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Our Clinical Specialists
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-4 leading-relaxed">
            Our team comprises postgraduate dental specialists (MDS) and experienced clinicians
            committed to transparent, patient-centric care and evidence-based treatment plans.
          </p>
        </Container>
      </section>

      {/* Dentists List */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <div className="flex flex-col gap-12">
            {dentists.map((doc, idx) => (
              <Card key={doc.id} variant="elevated" className="overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 items-start">
                  {/* Avatar & Fast Stats */}
                  <div className="lg:col-span-4 flex flex-col items-center sm:items-start gap-4">
                    <div className="h-28 w-28 rounded-2xl bg-accent text-primary flex items-center justify-center font-serif text-4xl font-bold border border-border shadow-xs">
                      {doc.name.startsWith("TBD:") ? "Dr" : doc.name.charAt(0)}
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="font-serif text-2xl font-bold text-foreground">
                        <TBDText value={doc.name} fallbackKey="dentist_roster" />
                      </h2>
                      <p className="text-xs font-semibold text-secondary mt-1">{doc.role}</p>
                    </div>

                    <div className="w-full p-4 rounded-xl bg-accent/30 border border-border flex flex-col gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Specialty:</span>
                        <span className="font-medium text-foreground text-right">{doc.specialization.split(",")[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Experience:</span>
                        <TBDText value={doc.experienceYears} fallbackKey="dentist_credentials" className="font-medium text-foreground" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Languages:</span>
                        <span className="font-medium text-foreground">{doc.languages.join(", ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Schedule:</span>
                        <TBDText value={doc.consultationSchedule} fallbackKey="dentist_schedules" className="font-medium text-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Bio & Clinical Approach */}
                  <div className="lg:col-span-8 flex flex-col justify-between h-full gap-6">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-foreground mb-1">
                          Qualifications &amp; Verified Credentials
                        </h3>
                        <p className="text-xs text-primary font-medium">
                          <TBDText value={doc.qualifications} fallbackKey="dentist_credentials" />
                        </p>
                      </div>

                      <div>
                        <h4 className="font-serif text-base font-semibold text-foreground mb-2">
                          Clinical Focus &amp; Biography
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          <TBDText value={doc.bio} fallbackKey="dentist_roster" />
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-card border border-border text-xs text-muted-foreground leading-normal">
                        <span className="font-semibold text-foreground">Clinical Scope: </span>
                        {doc.specialization}. Follows strict protocol-driven isolation, electronic diagnostic validation,
                        and post-procedure review.
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
                      <Link href="/book">
                        <Button variant="primary" size="md">
                          Book Appointment
                        </Button>
                      </Link>
                      <Link href="/services">
                        <Button variant="outline" size="md">
                          View Related Treatments
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
