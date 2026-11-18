"use client";

import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { FAQPageJsonLd } from "@/components/seo/json-ld";
import { clinicContent } from "@/config/clinic-content";

export default function FAQPage() {
  const { faqs } = clinicContent;
  const [openIndexes, setOpenIndexes] = React.useState<number[]>([0]); // Open first item by default

  const toggleIndex = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <PublicShell>
      <FAQPageJsonLd faqs={faqs} />

      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Common Patient Enquiries
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-4 leading-relaxed">
            Clear, transparent clinical answers covering our appointment protocols, fee policies,
            hospital-grade sterilization, and emergency triage pathways.
          </p>
        </Container>
      </section>

      {/* FAQ Accordion List */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {faqs.map((faq, idx) => {
              const isOpen = openIndexes.includes(idx);
              const headerId = `faq-header-${idx}`;
              const panelId = `faq-panel-${idx}`;

              return (
                <div
                  key={idx}
                  className="rounded-xl bg-card border border-border shadow-xs overflow-hidden transition-all duration-fast"
                >
                  <button
                    id={headerId}
                    type="button"
                    onClick={() => toggleIndex(idx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[56px]"
                  >
                    <div className="flex flex-col gap-1 pr-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                        {faq.category}
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                        {faq.question}
                      </h3>
                    </div>
                    <span
                      className={`w-8 h-8 rounded-full bg-accent/60 text-primary flex items-center justify-center font-bold text-lg shrink-0 transition-transform duration-fast ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      className="px-6 pb-6 sm:px-7 sm:pb-7 pt-1 border-t border-border/60 animate-in fade-in duration-fast"
                    >
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Need More Assistance Banner */}
          <div className="max-w-4xl mx-auto mt-16 p-8 rounded-2xl bg-accent/30 border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <h4 className="font-serif text-xl font-bold text-foreground">Have a Specific Clinical Question?</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Speak directly with our clinic front desk or schedule a consultation with our dental specialists.
              </p>
            </div>
            <Link href="/contact#book">
              <Button variant="primary" size="md" className="shrink-0">
                Contact Front Desk
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
