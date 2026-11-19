"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getConsentedGallery } from "@/config/clinic-content";

export function SmileGallerySlider() {
  const cases = getConsentedGallery().slice(0, 3);
  const [selectedCaseIdx, setSelectedCaseIdx] = React.useState(0);
  const [sliderPos, setSliderPos] = React.useState(50); // percentage 0-100
  const sliderContainerRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);

  const currentCase = cases[selectedCaseIdx] || cases[0];

  const handlePointerDown = () => {
    isDraggingRef.current = true;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const updateSliderFromClientX = React.useCallback((clientX: number) => {
    const container = sliderContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateSliderFromClientX(e.clientX);
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-card border-y border-border">
      <Container size="lg">
        <SectionHeading
          eyebrow="Clinical Results"
          title="Before & After Smile Gallery"
          description="Drag the slider to observe real aesthetic and restorative transformations achieved at our clinic."
          align="center"
        />

        {/* Case Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {cases.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedCaseIdx(idx);
                setSliderPos(50);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                selectedCaseIdx === idx
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background text-foreground border border-border hover:bg-accent/40"
              }`}
            >
              {item.category}: {item.title.split("&")[0].trim()}
            </button>
          ))}
        </div>

        {/* Interactive Comparison Slider Container */}
        {currentCase && (
          <div className="max-w-3xl mx-auto mt-10">
            <div
              ref={sliderContainerRef}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerMove={handlePointerMove}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="slider"
              aria-label="Before and after comparison slider"
              aria-valuenow={Math.round(sliderPos)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden shadow-lg border border-border select-none cursor-ew-resize bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* After Layer (Base Layer) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/50 via-card to-background p-8 flex flex-col justify-end">
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                  After
                </span>
                <div className="max-w-md">
                  <p className="font-serif text-2xl font-bold text-foreground">{currentCase.title}</p>
                  <p className="text-xs text-primary font-semibold mt-1">{currentCase.afterLabel}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{currentCase.description}</p>
                </div>
              </div>

              {/* Before Layer (Clipped Overlay) */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-muted via-card to-accent/30 p-8 flex flex-col justify-end overflow-hidden border-r border-primary/40"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold shadow-xs">
                  Before
                </span>
                <div className="max-w-md">
                  <p className="font-serif text-2xl font-bold text-foreground">{currentCase.title}</p>
                  <p className="text-xs text-secondary font-semibold mt-1">{currentCase.beforeLabel}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{currentCase.clinicalNotes}</p>
                </div>
              </div>

              {/* Draggable Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary pointer-events-none transition-transform"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-primary text-primary-foreground border-2 border-white shadow-md flex items-center justify-center text-xs font-bold">
                  &#8644;
                </div>
              </div>
            </div>

            {/* Disclaimer & Details */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground mt-4 gap-2">
              <span className="italic">
                Verified clinical case. Individual physiological outcomes vary based on clinical presentation.
              </span>
              <Link href="/gallery" className="font-semibold text-primary hover:underline shrink-0">
                Explore Full Case Gallery &rarr;
              </Link>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
