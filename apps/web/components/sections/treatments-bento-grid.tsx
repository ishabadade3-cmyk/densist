"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";

interface TreatmentItem {
  title: string;
  category: string;
  slug: string;
  description: string;
  tag: string;
  isFeatured?: boolean;
}

const TREATMENTS: TreatmentItem[] = [
  {
    title: "Single & Multi-Tooth Dental Implants",
    category: "Implantology",
    slug: "dental-implants",
    description: "Permanent, natural-feeling titanium implants placed with precision 3D CBCT planning to replace missing teeth and restore complete chewing confidence.",
    tag: "Gold Standard",
    isFeatured: true,
  },
  {
    title: "Painless Root Canal Treatment",
    category: "Endodontics",
    slug: "root-canal-treatment",
    description: "Modern, rotary root canal therapy utilizing apex locators and gentle local anaesthesia to eliminate tooth infection and preserve natural dentition.",
    tag: "Tooth-Saving",
    isFeatured: true,
  },
  {
    title: "Clear Aligners & Invisible Braces",
    category: "Orthodontics",
    slug: "braces-and-aligners",
    description: "Smooth, virtually invisible custom trays that discreetly straighten crowded teeth and correct bite misalignments without metal brackets or dietary restrictions.",
    tag: "Discreet",
    isFeatured: true,
  },
  {
    title: "General Dentistry & Checkups",
    category: "Preventive Care",
    slug: "general-dentistry",
    description: "Routine checkups, ultrasonic cleanings, and tooth-colored composite restorations.",
    tag: "Preventive",
  },
  {
    title: "In-Office Teeth Whitening",
    category: "Aesthetics",
    slug: "laser-teeth-whitening",
    description: "Safe, dentist-supervised laser whitening lifting deep coffee, tea, and age stains.",
    tag: "Fast Results",
  },
  {
    title: "Cosmetic Veneers & Smile Makeovers",
    category: "Cosmetic Dentistry",
    slug: "smile-designing",
    description: "Hand-crafted ultra-thin ceramic veneers to correct chips, gaps, and tooth shapes.",
    tag: "Aesthetics",
  },
  {
    title: "Dental Crowns & Bridges",
    category: "Restorative",
    slug: "crowns-and-bridges",
    description: "Durable metal-free zirconia crowns and bridges restoring structural strength.",
    tag: "Restorative",
  },
  {
    title: "Pediatric Dentistry",
    category: "Children's Care",
    slug: "pediatric-dentistry",
    description: "Fun, positive, and gentle dental checkups, sealants, and cavity care for kids.",
    tag: "Child-Friendly",
  },
  {
    title: "Gum Treatment & Periodontics",
    category: "Periodontics",
    slug: "gum-treatment",
    description: "Ultrasonic scaling and deep periodontal therapy to resolve bleeding gums.",
    tag: "Gum Health",
  },
  {
    title: "Wisdom Tooth Removal",
    category: "Oral Surgery",
    slug: "wisdom-tooth-removal",
    description: "Gentle atraumatic surgical management of impacted third molars with fast healing.",
    tag: "Oral Surgery",
  },
];

export function TreatmentsBentoGrid() {
  return (
    <section id="treatments" className="py-16 sm:py-24 bg-background">
      <Container size="lg">
        <SectionHeading
          eyebrow="Specialist Services"
          title="Comprehensive Dental Procedures"
          description="Every treatment combines clinical precision, gentle delivery, and international-standard Class-B sterilization."
          align="center"
        />

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {TREATMENTS.map((item) => (
            <div
              key={item.title}
              className={`group relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg border ${
                item.isFeatured
                  ? "lg:col-span-2 bg-gradient-to-br from-accent/35 via-card to-background border-border/80 shadow-md"
                  : "bg-card border-border/60 shadow-xs hover:border-primary/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    {item.category}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent/70 text-primary font-semibold">
                    {item.tag}
                  </span>
                </div>

                <h3
                  className={`font-serif font-bold text-foreground group-hover:text-primary transition-colors ${
                    item.isFeatured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
                  }`}
                >
                  {item.title}
                </h3>

                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-6 border-t border-border/60 flex items-center justify-between mt-6">
                <Link
                  href={`/services/${item.slug}`}
                  className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:underline"
                >
                  <span>Learn More</span>
                  <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                </Link>

                <Link href="/book">
                  <Button
                    variant={item.isFeatured ? "primary" : "ghost"}
                    size="sm"
                    className="rounded-full text-xs font-semibold"
                  >
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/services">
            <Button variant="outline" size="md" className="rounded-full px-8">
              View All Treatment Protocols &rarr;
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
