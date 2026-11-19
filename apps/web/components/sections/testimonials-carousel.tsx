"use client";

import * as React from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getConsentedTestimonials } from "@/config/clinic-content";

export function TestimonialsCarousel() {
  const testimonials = getConsentedTestimonials().slice(0, 4);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const prev = () => {
    setActiveIdx((curr) => (curr === 0 ? testimonials.length - 1 : curr - 1));
  };

  const next = () => {
    setActiveIdx((curr) => (curr === testimonials.length - 1 ? 0 : curr + 1));
  };

  return (
    <section className="py-16 sm:py-24 bg-card border-t border-border">
      <Container size="lg">
        <SectionHeading
          eyebrow="Patient Reflections"
          title="What Our Patients Say"
          description="Genuine reflections recorded with explicit consent under healthcare advertising guidelines."
          align="center"
        />

        {testimonials.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12 relative">
            {/* Active Testimonial Card with Soft Parallax Quote */}
            <div className="relative rounded-3xl p-8 sm:p-12 bg-background border border-border shadow-md overflow-hidden flex flex-col justify-between min-h-[260px]">
              {/* Soft Ambient Quote Mark */}
              <span
                className="absolute -top-6 -left-2 font-serif text-9xl text-accent/50 select-none pointer-events-none leading-none"
                aria-hidden="true"
              >
                &ldquo;
              </span>

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-1 text-secondary text-sm">
                  {"★".repeat(5)}
                </div>

                <blockquote className="font-serif text-lg sm:text-xl text-foreground italic leading-relaxed">
                  &ldquo;{testimonials[activeIdx].reviewText}&rdquo;
                </blockquote>
              </div>

              <div className="relative z-10 pt-6 border-t border-border/60 flex items-center justify-between text-xs mt-6">
                <div>
                  <span className="font-bold text-foreground">Patient {testimonials[activeIdx].patientInitials}</span>
                  <span className="text-muted-foreground"> &bull; {testimonials[activeIdx].treatment}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-accent text-primary font-semibold text-[11px] shadow-2xs">
                  Verified Patient
                </span>
              </div>
            </div>

            {/* Navigation Buttons & Dots */}
            <div className="flex items-center justify-between mt-6 px-2">
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeIdx === i ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous testimonial"
                  className="w-10 h-10 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center text-foreground transition-colors shadow-xs"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next testimonial"
                  className="w-10 h-10 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center text-foreground transition-colors shadow-xs"
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
