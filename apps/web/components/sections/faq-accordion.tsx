"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { clinicContent } from "@/config/clinic-content";

export function FAQAccordion() {
  const { faqs } = clinicContent;
  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  const filteredFaqs =
    selectedCategory === "All"
      ? faqs.slice(0, 8)
      : faqs.filter((f) => f.category === selectedCategory);

  return (
    <section className="py-16 sm:py-24 bg-background">
      <Container size="lg">
        <SectionHeading
          eyebrow="Common Inquiries"
          title="Frequently Asked Questions"
          description="Clear, straightforward clinical answers to common patient questions about treatments and comfort."
          align="center"
        />

        {/* Category Filter Chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setOpenIdx(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card text-foreground border border-border hover:bg-accent/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Smooth Accordion List */}
        <div className="max-w-3xl mx-auto mt-10 flex flex-col gap-3">
          {filteredFaqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-border bg-card overflow-hidden transition-colors hover:border-primary/40 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-serif text-base font-bold text-foreground">
                    {faq.question}
                  </span>
                  <span className="text-primary text-xl font-bold shrink-0 transition-transform duration-300">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-1">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/faq" className="text-sm font-semibold text-primary hover:underline">
            View Complete Dental Knowledge &amp; FAQs &rarr;
          </Link>
        </div>
      </Container>
    </section>
  );
}
