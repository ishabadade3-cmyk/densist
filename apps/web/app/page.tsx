import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { DentalClinicJsonLd } from "@/components/seo/json-ld";
import { TBDText } from "@/components/ui/tbd-badge";
import {
  clinicContent,
  getConsentedGallery,
  getConsentedTestimonials,
} from "@/config/clinic-content";

export const metadata = {
  title: "Premium Dental Care & Implantology | Clinical Excellence",
  description:
    "Bespoke dental care, precision rotary endodontics, clear aligners, and dental implants. Hospital-grade Class-B sterilization in Thane, Maharashtra.",
};

export default function HomePage() {
  const { clinic, services, dentists } = clinicContent;
  const consentedGallery = getConsentedGallery().slice(0, 3);
  const consentedTestimonials = getConsentedTestimonials().slice(0, 3);

  return (
    <PublicShell>
      <DentalClinicJsonLd />

      {/* Screen-reader accessible health status anchor */}
      <div className="sr-only">
        <h2>Web app health check</h2>
        <p>Healthy</p>
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-accent/25 via-background to-background border-b border-border">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/60 text-primary text-xs font-semibold uppercase tracking-wider w-fit">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Hospital-Grade Sterilization &bull; Ethical Dentistry
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
                Architects of Healthy,{" "}
                <span className="text-primary italic font-normal">Confident Smiles.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Experience pain-free dental treatments guided by specialist clinicians.
                From laser-assisted endodontics to customized digital smile design, we deliver
                international-standard care rooted in patient comfort and ethical clinical integrity.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/contact#book">
                  <Button variant="primary" size="lg" className="shadow-md">
                    Schedule Consultation
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" size="lg">
                    Explore Treatments
                  </Button>
                </Link>
                <Link href="/styleguide" className="text-xs text-muted-foreground hover:text-primary transition-colors py-2 px-3">
                  View Styleguide
                </Link>
              </div>

              {/* Trust Indicators Bar */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/80">
                <div>
                  <p className="font-serif text-2xl font-bold text-primary">Class-B</p>
                  <p className="text-xs text-muted-foreground">Autoclave Sterilization</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-primary">100%</p>
                  <p className="text-xs text-muted-foreground">Transparent Estimates</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-primary">Zero</p>
                  <p className="text-xs text-muted-foreground">Commercial Overtreatment</p>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-md flex flex-col gap-6 relative">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-primary" />
                    <span className="font-serif text-lg font-bold text-foreground">Clinic Overview</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-secondary/20 text-foreground font-medium">
                    Verified Operatory
                  </span>
                </div>

                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">{clinic.address.city}, Maharashtra</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Consultation Hours</span>
                    <TBDText value={clinic.hours.regular[0].hours} fallbackKey="clinic_hours" className="font-medium text-foreground" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Urgent Care Helpline</span>
                    <TBDText value={clinic.phone} fallbackKey="clinic_phone" className="font-medium text-primary" />
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted-foreground">Registration ID</span>
                    <TBDText value={clinic.licenses[0]} fallbackKey="clinic_licenses" className="font-mono text-xs text-foreground" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-accent/40 border border-border/70 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    AI Dental Guidance
                  </span>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Have symptoms or want an indicative estimate? Use our triage assistant for instant clinical answers.
                  </p>
                  <Link href="/faq" className="text-xs text-primary font-semibold hover:underline">
                    Access Assistant &amp; FAQs →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. FEATURED TREATMENTS */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <SectionHeading
            eyebrow="Specialist Services"
            title="Comprehensive Dental Procedures"
            description="Every treatment is carried out using calibrated instruments, strict barrier isolation, and gentle clinical techniques."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12">
            {services.slice(0, 6).map((service) => (
              <Card key={service.slug} variant="elevated" className="flex flex-col justify-between">
                <CardHeader>
                  <div className="text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    {service.category}
                  </div>
                  <CardTitle className="font-serif text-xl sm:text-2xl text-foreground">
                    {service.title.split("(")[0].trim()}
                  </CardTitle>
                  <CardDescription className="text-sm mt-2 leading-relaxed">
                    {service.shortDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground py-2 border-t border-border/60">
                    <span>Indicative Range:</span>
                    <TBDText value={service.indicativePriceRange} fallbackKey="service_prices" />
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clinical Protocol &rarr;
                  </Link>
                  <Link href="/contact#book">
                    <Button variant="ghost" size="sm">
                      Book Slot
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services">
              <Button variant="outline" size="md">
                View All {services.length} Specialized Treatments
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* 3. DENTISTS SECTION */}
      <section className="py-16 sm:py-24 bg-card border-y border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Our Clinical Team"
            title="Led by Registered Dental Specialists"
            description="Our dental surgeons bring advanced post-graduate qualifications and a unified commitment to conservative, patient-centered care."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {dentists.map((doc) => (
              <div key={doc.id} className="p-6 rounded-xl bg-background border border-border shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <div className="h-20 w-20 rounded-full bg-accent/60 text-primary flex items-center justify-center font-serif text-2xl font-bold border border-border">
                    {doc.name.startsWith("TBD:") ? "Dr" : doc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      <TBDText value={doc.name} fallbackKey="dentist_roster" />
                    </h3>
                    <p className="text-xs font-medium text-secondary mt-0.5">{doc.role}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {doc.specialization}
                  </p>
                  <div className="text-xs text-muted-foreground/80 flex flex-col gap-1 pt-2 border-t border-border/60">
                    <p>Qualifications: <TBDText value={doc.qualifications} fallbackKey="dentist_credentials" /></p>
                    <p>Languages: {doc.languages.join(", ")}</p>
                  </div>
                </div>

                <Link href="/contact#book" className="pt-2">
                  <Button variant="outline" size="sm" className="w-full justify-center">
                    Book Consultation
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/dentists" className="text-sm font-semibold text-primary hover:underline">
              Read Detailed Specialist Credentials &rarr;
            </Link>
          </div>
        </Container>
      </section>

      {/* 4. SMILE GALLERY & TRANSFORMATIONS (CONSENT RECORDED ONLY) */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <SectionHeading
            eyebrow="Clinical Results"
            title="Smile Transformations & Case Studies"
            description="All clinical imagery published strictly with patient consent and documented consent reference numbers under DPDP Act principles."
          />

          {consentedGallery.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {consentedGallery.map((item) => (
                <div key={item.id} className="rounded-xl bg-card border border-border shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="p-6 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-secondary font-semibold">
                      <span>{item.category}</span>
                      <span className="font-mono text-[10px] text-muted-foreground bg-accent/40 px-2 py-0.5 rounded">
                        Consent #{item.consentReferenceId}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    <div className="p-3 rounded bg-accent/30 text-xs text-foreground/90 flex flex-col gap-1 mt-2">
                      <p className="font-semibold text-primary">{item.beforeLabel}</p>
                      <p className="text-muted-foreground">{item.afterLabel}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground italic">Consent verified</span>
                    <Link href="/gallery" className="font-semibold text-primary hover:underline">
                      View Case &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-card rounded-xl border border-border mt-8">
              <p className="text-sm text-muted-foreground">
                No patient transformation records with verified public consent currently published.
              </p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/gallery">
              <Button variant="outline" size="md">
                Explore Full Smile Gallery
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* 5. VERIFIED TESTIMONIALS (CONSENT RECORDED ONLY) */}
      <section className="py-16 sm:py-24 bg-card border-t border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Patient Experiences"
            title="Patient Feedback & Reflections"
            description="Unsolicited, authentic reflections recorded with explicit consent under healthcare advertising guidelines."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
            {consentedTestimonials.map((t) => (
              <div key={t.id} className="p-6 sm:p-8 rounded-xl bg-background border border-border shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <span className="font-serif text-3xl text-primary leading-none">&ldquo;</span>
                  <p className="text-sm text-foreground leading-relaxed italic">
                    {t.reviewText}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Patient {t.patientInitials}</span>
                    <span className="text-muted-foreground"> &bull; {t.treatment}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-accent/40 px-2 py-0.5 rounded font-mono">
                    Consent #{t.consentReferenceId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-16 sm:py-20 bg-primary text-primary-foreground">
        <Container size="lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex flex-col gap-2 max-w-2xl">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                Ready for a Comprehensive Clinical Consultation?
              </h2>
              <p className="text-primary-foreground/80 text-sm sm:text-base leading-relaxed">
                Schedule your appointment online. Our front desk will confirm operatory availability
                and outline your diagnostic protocol.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
              <Link href="/contact#book">
                <Button variant="secondary" size="lg" className="shadow-lg">
                  Book Your Visit
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-white/10">
                  Contact Clinic
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
