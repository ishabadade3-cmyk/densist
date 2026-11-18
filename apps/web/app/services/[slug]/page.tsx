import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MedicalServiceJsonLd } from "@/components/seo/json-ld";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return clinicContent.services.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = clinicContent.services.find((s) => s.slug === slug);

  if (!service) {
    return { title: "Service Not Found" };
  }

  return {
    title: `${service.title} | Specialized Dental Care`,
    description: service.shortDescription,
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = clinicContent.services.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  return (
    <PublicShell>
      <MedicalServiceJsonLd
        name={service.title}
        description={service.shortDescription}
        serviceType={service.category}
      />

      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary mb-3">
            <Link href="/services" className="hover:text-primary transition-colors">
              Treatments
            </Link>
            <span>/</span>
            <span>{service.category}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            {service.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-4 leading-relaxed">
            {service.shortDescription}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <Link href="/contact#book">
              <Button variant="primary" size="lg">
                Book This Treatment
              </Button>
            </Link>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Indicative Duration: <TBDText value={service.indicativeDuration} fallbackKey="service_durations" className="font-medium text-foreground" /></span>
              <span>&bull;</span>
              <span>Indicative Fee: <TBDText value={service.indicativePriceRange} fallbackKey="service_prices" className="font-medium text-foreground" /></span>
            </div>
          </div>
        </Container>
      </section>

      {/* Content Layout */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Main Clinical Content */}
            <div className="lg:col-span-8 flex flex-col gap-10">
              {/* Overview */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Procedure Overview</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {service.overview}
                </p>
              </div>

              {/* Indications */}
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-serif text-xl font-bold text-foreground mb-3">Clinical Indications</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  This procedure is typically indicated for patients exhibiting the following clinical presentations:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-foreground">
                  {service.indications.map((ind, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step by Step Clinical Stages */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Step-by-Step Clinical Protocol</h2>
                <div className="flex flex-col gap-4">
                  {service.procedureSteps.map((step, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-card border border-border flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-accent text-primary font-serif font-bold flex items-center justify-center shrink-0 text-sm">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pre & Post Care Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-lg bg-accent/30 border border-border">
                  <h4 className="font-serif text-base font-bold text-foreground mb-2">Pre-Appointment Care</h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                    {service.preCare.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-5 rounded-lg bg-accent/30 border border-border">
                  <h4 className="font-serif text-base font-bold text-foreground mb-2">Post-Procedure Care</h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                    {service.postCare.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* FAQs */}
              {service.faqs && service.faqs.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Treatment FAQs</h2>
                  <div className="flex flex-col gap-4">
                    {service.faqs.map((faq, idx) => (
                      <div key={idx} className="p-5 rounded-lg bg-card border border-border">
                        <h4 className="font-serif text-base font-semibold text-foreground mb-2">{faq.question}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Sticky Card */}
            <div className="lg:col-span-4 sticky top-28">
              <Card variant="elevated" className="flex flex-col gap-6">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Consultation Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 text-xs">
                  <div className="flex justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-semibold text-foreground">{service.category}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Indicative Duration:</span>
                    <TBDText value={service.indicativeDuration} fallbackKey="service_durations" className="font-semibold text-foreground" />
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/60">
                    <span className="text-muted-foreground">Indicative Fee:</span>
                    <TBDText value={service.indicativePriceRange} fallbackKey="service_prices" className="font-semibold text-foreground" />
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-normal pt-2 italic">
                    Fee disclaimer: All costs are indicative estimates. A comprehensive, itemized clinical quotation is provided only following in-person examination and necessary radiographs.
                  </p>

                  <Link href="/contact#book" className="pt-2">
                    <Button variant="primary" size="md" className="w-full justify-center">
                      Schedule Appointment
                    </Button>
                  </Link>
                  <Link href="/services">
                    <Button variant="ghost" size="sm" className="w-full justify-center text-xs">
                      ← Back to All Treatments
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
