"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { TBDText } from "@/components/ui/tbd-badge";
import { clinicContent } from "@/config/clinic-content";

const MARQUEE_SERVICES = [
  "Root Canal Treatment",
  "Dental Implants",
  "Clear Aligners",
  "Teeth Whitening",
  "Cosmetic Veneers",
  "Crowns & Bridges",
  "Pediatric Dentistry",
  "Periodontal Care",
  "Digital Smile Design",
  "Wisdom Tooth Surgery",
];

export function DarkCTABand() {
  const { clinic } = clinicContent;

  return (
    <section className="relative overflow-hidden bg-foreground text-background py-20 sm:py-28 border-t border-white/10">
      {/* 1. Slow Continuous Treatment Marquee */}
      <div className="w-full overflow-hidden pb-12 opacity-80" aria-hidden="true">
        <div className="flex w-max gap-8 animate-marquee whitespace-nowrap text-sm uppercase tracking-widest font-semibold text-accent/80">
          {[...MARQUEE_SERVICES, ...MARQUEE_SERVICES].map((service, i) => (
            <span key={i} className="inline-flex items-center gap-6">
              <span>{service}</span>
              <span className="text-secondary">&bull;</span>
            </span>
          ))}
        </div>
      </div>

      <Container size="lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Headline & Booking Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <span className="px-3.5 py-1 rounded-full bg-white/10 text-accent text-xs font-semibold tracking-wider uppercase w-fit border border-white/10">
              Immediate Slot Confirmation
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
              Ready for a Comprehensive Dental Consultation?
            </h2>

            <p className="text-base text-background/80 leading-relaxed max-w-xl">
              Experience unhurried diagnostic examination, digital 3D scans, and transparent treatment options.
              Reserve your preferred appointment slot online.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/book">
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full font-semibold px-8 shadow-lg"
                >
                  Book Appointment
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/30 text-white hover:bg-white/10 px-8"
                >
                  Contact Reception
                </Button>
              </Link>
            </div>
          </div>

          {/* Clinic Location & Verified Hours Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl p-6 sm:p-8 bg-white/5 backdrop-blur-md border border-white/15 shadow-xl flex flex-col gap-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-serif text-lg font-bold text-white">Clinic Location &amp; Hours</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                  Thane West
                </span>
              </div>

              <div>
                <span className="text-accent block font-semibold mb-0.5">Physical Practice Address</span>
                <p className="text-background/90 leading-relaxed">
                  Shop No. 26-29, Happy Valley Shopping Complex, Tikujiniwadi Road, Manpada, Thane West – 400610
                </p>
                <a
                  href="https://maps.google.com/?q=Happy+Valley+Shopping+Complex+Manpada+Thane+West"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-secondary hover:underline inline-block mt-1 font-semibold"
                >
                  Open in Google Maps &rarr;
                </a>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-accent">Monday – Friday:</span>
                  <span className="text-white font-medium">10:00 AM – 1:00 PM &amp; 6:00 – 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-accent">Saturday:</span>
                  <span className="text-white font-medium">10:00 AM – 5:00 PM</span>
                </div>
                {/* TODO: Verify if Sunday emergency appointments are accepted on-call */}
                <div className="flex justify-between">
                  <span className="text-accent">Sunday:</span>
                  <span className="text-secondary font-semibold">Closed (Urgent by Call)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-accent">Patient Helpline:</span>
                <TBDText value={clinic.phone} fallbackKey="clinic_phone" className="text-white font-bold" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
