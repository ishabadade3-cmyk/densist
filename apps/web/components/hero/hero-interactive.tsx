"use client";

import * as React from "react";
import Link from "next/link";
import { animate } from "animejs";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { ToothScene } from "@/components/canvas/tooth-scene";
import { TBDText } from "@/components/ui/tbd-badge";
import { clinicContent } from "@/config/clinic-content";

export function HeroInteractive() {
  const { clinic } = clinicContent;
  const headlineRef = React.useRef<HTMLHeadingElement>(null);
  const counterRef1 = React.useRef<HTMLSpanElement>(null);
  const counterRef2 = React.useRef<HTMLSpanElement>(null);
  const counterRef3 = React.useRef<HTMLSpanElement>(null);
  const magneticBtnRef = React.useRef<HTMLDivElement>(null);

  // Compute live Open/Closed status based on Thane clinic consultation hours
  const [isOpenNow, setIsOpenNow] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkOpenStatus = () => {
      const now = new Date();
      // Indian Standard Time offset
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utc + 3600000 * 5.5);
      const day = istDate.getDay(); // 0 = Sunday, 1 = Monday, ...
      const hour = istDate.getHours();
      const minute = istDate.getMinutes();
      const currentMinute = hour * 60 + minute;

      // Mon - Fri: 10:00 - 13:00 (600-780) & 18:00 - 22:00 (1080-1320)
      if (day >= 1 && day <= 5) {
        if ((currentMinute >= 600 && currentMinute <= 780) || (currentMinute >= 1080 && currentMinute <= 1320)) {
          setIsOpenNow(true);
          return;
        }
      }
      // Sat: 10:00 - 17:00 (600-1020)
      if (day === 6) {
        if (currentMinute >= 600 && currentMinute <= 1020) {
          setIsOpenNow(true);
          return;
        }
      }
      setIsOpenNow(false);
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // GSAP Headline line reveal & Anime.js counters
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      // Headline reveal
      if (headlineRef.current) {
        gsap.fromTo(
          headlineRef.current.children,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.12 }
        );
      }

      // Anime.js counter values
      const countObj = { p100: 0, zero: 10 };
      animate(countObj, {
        p100: 100,
        zero: 0,
        duration: 1800,
        ease: "outExpo",
        onUpdate: () => {
          if (counterRef1.current) counterRef1.current.innerText = `Class-B`;
          if (counterRef2.current) counterRef2.current.innerText = `${Math.round(countObj.p100)}%`;
          if (counterRef3.current) counterRef3.current.innerText = `${Math.round(countObj.zero)}`;
        },
      });
    } else {
      if (counterRef1.current) counterRef1.current.innerText = `Class-B`;
      if (counterRef2.current) counterRef2.current.innerText = `100%`;
      if (counterRef3.current) counterRef3.current.innerText = `0`;
    }
  }, []);

  // Magnetic button effect on desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = magneticBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.28, y: y * 0.28, duration: 0.35, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    const btn = magneticBtnRef.current;
    if (!btn) return;
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "power3.out" });
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-accent/25 via-background to-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline, Description, Magnetic CTA, Badges */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/70 text-primary text-xs font-semibold uppercase tracking-wider w-fit border border-accent">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Hospital-Grade Sterilization &bull; Ethical Dentistry
            </div>

            <h1
              ref={headlineRef}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]"
            >
              <span className="block">Architects of Healthy,</span>
              <span className="text-primary italic font-normal block">Confident Smiles.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Experience gentle, transparent dental care guided by qualified specialists. From pain-free
              rotary root canal therapy to customized digital smile design and dental implants, we deliver
              world-class care focused on your comfort.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div
                ref={magneticBtnRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="inline-block"
              >
                <Link href="/book">
                  <Button variant="primary" size="lg" className="rounded-full shadow-md font-semibold px-8">
                    Book Appointment
                  </Button>
                </Link>
              </div>
              <Link href="#treatments">
                <Button variant="outline" size="lg" className="rounded-full px-7">
                  Explore Treatments
                </Button>
              </Link>
            </div>

            {/* Anime.js Animated Trust Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/80">
              <div className="p-3 rounded-2xl bg-card/60 backdrop-blur-xs border border-border/60">
                <span ref={counterRef1} className="font-serif text-2xl font-bold text-primary block">
                  Class-B
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">Autoclave Sterilization</p>
              </div>
              <div className="p-3 rounded-2xl bg-card/60 backdrop-blur-xs border border-border/60">
                <span ref={counterRef2} className="font-serif text-2xl font-bold text-primary block">
                  100%
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">Transparent Estimates</p>
              </div>
              <div className="p-3 rounded-2xl bg-card/60 backdrop-blur-xs border border-border/60">
                <span ref={counterRef3} className="font-serif text-2xl font-bold text-primary block">
                  Zero
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">Commercial Overtreatment</p>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Ceramic Tooth Scene + Floating Glass Card */}
          <div className="lg:col-span-5 flex flex-col gap-6 relative">
            {/* 3D Scene Container */}
            <div className="relative rounded-3xl bg-gradient-to-b from-card/80 to-accent/20 border border-white/60 shadow-lg p-2 backdrop-blur-md overflow-hidden">
              <ToothScene />
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 backdrop-blur-md text-[11px] font-semibold text-primary border border-border shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Precision Implant Crown
              </div>
            </div>

            {/* Floating Glass Clinic Status Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-card/90 backdrop-blur-md border border-border shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isOpenNow ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                  <span className="font-serif text-base font-bold text-foreground">
                    {isOpenNow ? "Open Now" : "Consultation Desk"}
                  </span>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isOpenNow ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-muted text-muted-foreground"
                }`}>
                  {isOpenNow ? "Accepting Patients" : "Next Slot Available"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Location</span>
                  <span className="font-medium text-foreground">Manpada, Thane West</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Helpline</span>
                  <TBDText value={clinic.phone} fallbackKey="clinic_phone" className="font-medium text-primary" />
                </div>
                <div className="col-span-2 pt-1 border-t border-border/40">
                  <span className="text-muted-foreground block text-[11px]">Consultation Timings</span>
                  <TBDText value={clinic.hours.regular[0].hours} fallbackKey="clinic_hours" className="font-medium text-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
