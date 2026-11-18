import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export const metadata = {
  title: "Specialized Dental Treatments & Clinical Services | Dental Excellence",
  description:
    "Explore our complete range of specialized dental treatments: root canal therapy, dental implants, clear aligners, laser teeth whitening, and preventive care.",
};

export default function ServicesPage() {
  const { services } = clinicContent;

  return (
    <PublicShell>
      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Evidence-Based Care
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Specialized Dental Treatments
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-4 leading-relaxed">
            Every procedure is carried out under magnification with modern local anaesthesia,
            rubber-dam isolation, and strict biocompatible material standards.
          </p>
        </Container>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          {/* Clinical Examination Disclaimer Notice */}
          <div className="p-4 sm:p-5 rounded-xl bg-accent/30 border border-border/80 mb-12 flex items-start gap-3">
            <span className="text-primary font-bold text-lg mt-0.5">ℹ</span>
            <div className="text-xs sm:text-sm text-foreground leading-relaxed">
              <span className="font-semibold text-primary">Indicative Fee &amp; Timeline Transparency: </span>
              In accordance with ethical clinical guidelines, fees and session requirements shown below are indicative ranges.
              A definitive, itemized treatment plan is formulated solely upon clinical examination and diagnostic radiography by our dental surgeons.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card key={service.slug} variant="elevated" className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                    <span>{service.category}</span>
                    <span className="text-muted-foreground/80 lowercase">{service.procedureSteps.length} clinical stages</span>
                  </div>
                  <CardTitle className="font-serif text-2xl text-foreground">
                    {service.title.split("(")[0].trim()}
                  </CardTitle>
                  <CardDescription className="text-sm mt-3 leading-relaxed">
                    {service.shortDescription}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs py-2 border-t border-border/60">
                    <span className="text-muted-foreground">Indicative Duration:</span>
                    <TBDText value={service.indicativeDuration} fallbackKey="service_durations" className="font-medium text-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-t border-border/60">
                    <span className="text-muted-foreground">Indicative Fee:</span>
                    <TBDText value={service.indicativePriceRange} fallbackKey="service_prices" className="font-medium text-foreground" />
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clinical Protocol &rarr;
                  </Link>
                  <Link href="/contact#book">
                    <Button variant="primary" size="sm">
                      Book Visit
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
