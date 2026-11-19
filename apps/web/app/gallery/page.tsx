"use client";

import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { clinicContent, getConsentedGallery, GalleryItem } from "@/config/clinic-content";

export default function SmileGalleryPage() {
  const consentedItems = React.useMemo(() => getConsentedGallery(), []);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [activeItemIndex, setActiveItemIndex] = React.useState<number | null>(null);

  const categories = React.useMemo(() => {
    const cats = new Set<string>(["All"]);
    consentedItems.forEach((item) => cats.add(item.category));
    return Array.from(cats);
  }, [consentedItems]);

  const filteredItems = React.useMemo(() => {
    if (selectedCategory === "All") return consentedItems;
    return consentedItems.filter((i) => i.category === selectedCategory);
  }, [consentedItems, selectedCategory]);

  const activeItem = activeItemIndex !== null ? filteredItems[activeItemIndex] : null;

  // Keyboard navigation for gallery viewer (ArrowLeft, ArrowRight, Escape)
  React.useEffect(() => {
    if (activeItemIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveItemIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveItemIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeItemIndex, filteredItems.length]);

  return (
    <PublicShell>
      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Consent-Verified Clinical Transformations
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Smile Transformations Gallery
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-4 leading-relaxed">
            Clinical documentation of orthodontic, implant, and aesthetic treatments. Every case displayed
            carries verified written patient consent under DPDP Act purpose-specific image governance.
          </p>
        </Container>
      </section>

      {/* Main Gallery Section */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          {/* Regulatory Disclaimer Banner */}
          <div className="p-4 sm:p-5 rounded-xl bg-accent/30 border border-border mb-10 flex items-start gap-3">
            <span className="text-primary font-bold text-lg mt-0.5">ℹ</span>
            <div className="text-xs sm:text-sm text-foreground leading-relaxed">
              <span className="font-semibold text-primary">Healthcare Advertising &amp; Image Ethics: </span>
              Under Dental Council of India norms and ASCI healthcare regulations, before-and-after images
              must not promise guaranteed outcomes. Biological healing, bone density, and individual anatomical
              responses differ for every clinical patient.
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-10" role="tablist" aria-label="Gallery Categories">
            {categories.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveItemIndex(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-accent/40 text-foreground hover:bg-accent/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-card border border-border shadow-sm overflow-hidden flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary transition-all duration-fast"
                >
                  <div className="p-6 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-secondary font-semibold">
                      <span>{item.category}</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-primary font-medium bg-accent/40 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Verified Clinical Case
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>

                    {/* Before & After Comparison Cards */}
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      <div className="p-3 rounded-lg bg-accent/40 border border-border/70 text-xs">
                        <span className="font-semibold text-primary block mb-0.5">Initial Clinical Presentation:</span>
                        <span className="text-muted-foreground">{item.beforeLabel}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/40 border border-border/70 text-xs">
                        <span className="font-semibold text-success block mb-0.5">Post-Procedure Result:</span>
                        <span className="text-foreground">{item.afterLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                    <button
                      onClick={() => setActiveItemIndex(idx)}
                      className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1"
                      aria-haspopup="dialog"
                    >
                      Open Case Viewer &rarr;
                    </button>
                    <Link
                      href={`/services/${item.treatmentSlug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors text-xs"
                    >
                      View Treatment Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-card rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">
                No clinical cases found for the selected category with recorded public consent.
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* Keyboard-Navigable Modal Viewer */}
      <Dialog
        isOpen={activeItem !== null}
        onClose={() => setActiveItemIndex(null)}
        title={activeItem?.title || "Clinical Transformation Case"}
        description={`Category: ${activeItem?.category || ""} • Verified Clinical Case Documentation`}
      >
        {activeItem && (
          <div className="flex flex-col gap-6" tabIndex={0} aria-label="Case Details Viewer">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {activeItem.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-accent/40 border border-border flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                  Initial Clinical Presentation
                </span>
                <p className="text-xs text-foreground leading-relaxed">{activeItem.beforeLabel}</p>
              </div>

              <div className="p-4 rounded-xl bg-accent/40 border border-border flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-success">
                  Post-Procedure Result
                </span>
                <p className="text-xs text-foreground leading-relaxed">{activeItem.afterLabel}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border text-xs text-muted-foreground leading-normal">
              <span className="font-semibold text-foreground">Clinical Documentation Note: </span>
              {activeItem.clinicalNotes}
            </div>

            {/* Viewer Navigation Controls with Keyboard hints */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActiveItemIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1
                    )
                  }
                  aria-label="Previous case (ArrowLeft)"
                >
                  ← Prev Case
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActiveItemIndex((prev) =>
                      prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0
                    )
                  }
                  aria-label="Next case (ArrowRight)"
                >
                  Next Case →
                </Button>
              </div>

              <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                Use <kbd className="px-1.5 py-0.5 bg-accent/60 rounded text-[10px] font-mono">←</kbd> and{" "}
                <kbd className="px-1.5 py-0.5 bg-accent/60 rounded text-[10px] font-mono">→</kbd> keys to navigate
              </span>

              <Link href="/book">
                <Button variant="primary" size="sm">
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Dialog>
    </PublicShell>
  );
}
