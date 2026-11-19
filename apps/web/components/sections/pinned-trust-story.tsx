"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const REASONS = [
  {
    num: "01",
    title: "Experienced Clinicians",
    subtitle: "Post-Graduate Specialized Care",
    desc: "Led by Dr. Anand Gangal (BDS Mumbai, 20+ years clinical excellence) and specialist consultants in rotary endodontics, prosthodontics, and implant surgery.",
    icon: (
      <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Modern Low-Dose Technology",
    subtitle: "Precision Diagnostics",
    desc: "Equipped with digital intraoral 3D scanners, digital radiovisiography (RVG) with 80% lower radiation, and torque-controlled rotary endodontic units.",
    icon: (
      <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Hospital-Grade Sterilization",
    subtitle: "Class-B Vacuum Autoclaving",
    desc: "Every instrument undergoes strict 4-stage disinfection, sealed pouching, and biological spore verification to ensure zero cross-contamination.",
    icon: (
      <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Tailored Treatment Plans",
    subtitle: "100% Transparent Estimates",
    desc: "No commercial overtreatment. We present clear diagnostic findings, walk through treatment options, and provide itemized estimates before starting.",
    icon: (
      <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: "05",
    title: "Patient-Focused Gentle Care",
    subtitle: "Anxiety-Free Operatory",
    desc: "Unhurried appointments, gentle topical numbing, and supportive patient communication create a soothing, calm clinical environment.",
    icon: (
      <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

export function PinnedTrustStory() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || window.innerWidth < 1024) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top+=80",
        end: "+=1800",
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const step = Math.min(Math.floor(self.progress * REASONS.length), REASONS.length - 1);
          setActiveIdx(step);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 bg-card border-b border-border">
      <Container size="lg">
        <SectionHeading
          eyebrow="Clinical Excellence"
          title="Why Patients Trust Densistt"
          description="Built on the philosophy that every patient deserves comfortable, unhurried, and ethically sound dental care."
          align="center"
        />

        {/* Desktop Pinned Display (Visible on lg+) */}
        <div className="hidden lg:grid grid-cols-12 gap-12 mt-16 items-center min-h-[460px]">
          {/* Left Column: Progress Rail & Active Reason Content */}
          <div className="col-span-7 flex gap-8 items-start">
            {/* Progress Rail */}
            <div className="w-1.5 h-64 bg-accent/40 rounded-full relative overflow-hidden shrink-0 mt-2">
              <div
                className="w-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ height: `${((activeIdx + 1) / REASONS.length) * 100}%` }}
              />
            </div>

            {/* Reason Detail with Smooth Transition */}
            <div className="flex flex-col gap-4">
              <span className="font-serif text-5xl font-bold text-secondary tracking-tight">
                {REASONS[activeIdx].num}
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-primary">
                  {REASONS[activeIdx].subtitle}
                </p>
                <h3 className="font-serif text-3xl font-bold text-foreground mt-1">
                  {REASONS[activeIdx].title}
                </h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                {REASONS[activeIdx].desc}
              </p>

              {/* Step Selector Pills */}
              <div className="flex gap-2 pt-4">
                {REASONS.map((r, i) => (
                  <button
                    key={r.num}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      activeIdx === i
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-accent/50 text-foreground hover:bg-accent"
                    }`}
                  >
                    {r.num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Vector Illustration Card */}
          <div className="col-span-5">
            <div className="p-12 rounded-3xl bg-gradient-to-br from-accent/40 via-card to-background border border-border/80 shadow-lg flex flex-col items-center justify-center text-center gap-6 relative min-h-[360px]">
              <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-md">
                {REASONS[activeIdx].icon}
              </div>
              <div>
                <h4 className="font-serif text-xl font-bold text-foreground">
                  {REASONS[activeIdx].title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {REASONS[activeIdx].subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Stacked Display (Visible on < lg) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 lg:hidden">
          {REASONS.map((r) => (
            <div
              key={r.num}
              className="p-6 rounded-2xl bg-background border border-border shadow-xs flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold text-secondary">{r.num}</span>
                <div className="p-2 rounded-xl bg-accent/40 text-primary">{r.icon}</div>
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">{r.title}</h3>
              <p className="text-xs font-semibold text-primary">{r.subtitle}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
