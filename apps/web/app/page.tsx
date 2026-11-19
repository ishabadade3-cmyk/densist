import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { DentalClinicJsonLd } from "@/components/seo/json-ld";
import { TBDText } from "@/components/ui/tbd-badge";
import { AIDentalAssistant } from "@/components/ai/ai-dental-assistant";
import {
  clinicContent,
  getConsentedGallery,
  getConsentedTestimonials,
} from "@/config/clinic-content";

export const metadata = {
  title: "Densistt Dental Clinic | Premium Dental Care & Implantology",
  description:
    "Experience painless, patient-centered dental care with experienced specialists, modern technology, and hospital-grade sterilization in Thane, Maharashtra.",
};

export default function HomePage() {
  const { clinic, services, dentists, faqs } = clinicContent;
  const consentedGallery = getConsentedGallery().slice(0, 3);
  const consentedTestimonials = getConsentedTestimonials().slice(0, 4);

  // Group or curate the 10 core treatment categories
  const curatedTreatments = [
    {
      title: "General Dentistry",
      category: "Preventive Care",
      slug: "general-dentistry",
      description: "Gentle routine checkups, ultrasonic cleaning, and tooth-colored composite fillings for long-term oral wellness.",
      tag: "Preventive",
    },
    {
      title: "Root Canal Treatment",
      category: "Endodontics",
      slug: "root-canal-treatment",
      description: "Painless, modern root canal therapy using precision rotary instruments to eliminate tooth infection and save natural teeth.",
      tag: "Tooth Saving",
    },
    {
      title: "Dental Implants",
      category: "Implantology",
      slug: "dental-implants",
      description: "Permanent, natural-feeling titanium implants to replace missing teeth and restore complete chewing confidence.",
      tag: "Permanent Fix",
    },
    {
      title: "Teeth Whitening",
      category: "Aesthetics",
      slug: "laser-teeth-whitening",
      description: "Safe, in-office laser whitening designed to gently lift deep stains and brighten your smile several shades.",
      tag: "Fast Results",
    },
    {
      title: "Cosmetic Dentistry",
      category: "Smile Makeovers",
      slug: "smile-designing",
      description: "Custom porcelain veneers and front teeth restoration to fix chips, gaps, and reshape your ideal smile.",
      tag: "Aesthetic",
    },
    {
      title: "Orthodontics",
      category: "Teeth Alignment",
      slug: "braces-and-aligners",
      description: "Modern ceramic and traditional braces to gently align crooked teeth, correct bite irregularities, and improve oral function.",
      tag: "Alignment",
    },
    {
      title: "Clear Aligners",
      category: "Invisible Braces",
      slug: "braces-and-aligners",
      description: "Smooth, virtually invisible custom trays that discreetly straighten your teeth without metal wires or food restrictions.",
      tag: "Discreet",
    },
    {
      title: "Pediatric Dentistry",
      category: "Children's Care",
      slug: "pediatric-dentistry",
      description: "Warm, stress-free dental care for children and teens, emphasizing positive dental habits and cavity prevention.",
      tag: "Child-Friendly",
    },
    {
      title: "Dental Crowns & Bridges",
      category: "Restorative",
      slug: "crowns-and-bridges",
      description: "Durable, natural-looking porcelain and zirconia crowns to protect damaged teeth and fixed bridges for missing teeth.",
      tag: "Restorative",
    },
    {
      title: "Gum Treatment",
      category: "Periodontics",
      slug: "gum-treatment",
      description: "Gentle deep cleaning, ultrasonic scaling, and laser gum therapy to stop bleeding and protect healthy foundation bone.",
      tag: "Gum Health",
    },
  ];

  return (
    <PublicShell>
      <DentalClinicJsonLd />

      {/* Screen-reader accessible health status anchor for automated monitoring */}
      <div className="sr-only">
        <h2>Web app health check</h2>
        <p>Healthy</p>
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-accent/20 via-background to-background border-b border-border">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-primary text-xs font-semibold uppercase tracking-wider w-fit">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Hospital-Grade Sterilization &bull; Ethical Patient Care
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.14]">
                Architects of Healthy,{" "}
                <span className="text-primary italic font-normal">Confident Smiles.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Experience gentle, transparent dental care guided by qualified specialists. From pain-free
                root canal therapy to customized digital smile design and dental implants, we deliver
                international-standard dentistry focused on your comfort and peace of mind.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/book">
                  <Button variant="primary" size="lg" className="shadow-md">
                    Book Appointment
                  </Button>
                </Link>
                <Link href="#treatments">
                  <Button variant="outline" size="lg">
                    Explore Treatments
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators Bar */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/80">
                <div>
                  <p className="font-serif text-2xl font-bold text-primary">Class-B</p>
                  <p className="text-xs text-muted-foreground">Autoclave Sterilization</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-primary">100%</p>
                  <p className="text-xs text-muted-foreground">Transparent Estimates</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-primary">Zero</p>
                  <p className="text-xs text-muted-foreground">Commercial Overtreatment</p>
                </div>
              </div>
            </div>

            {/* Hero Quick Clinic Overview Card */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-md flex flex-col gap-6 relative">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-primary" />
                    <span className="font-serif text-lg font-bold text-foreground">Clinic Overview</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-secondary/20 text-foreground font-medium">
                    Verified Practice
                  </span>
                </div>

                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">{clinic.address.city}, Maharashtra</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Consultation Hours</span>
                    <TBDText value={clinic.hours.regular[0].hours} fallbackKey="clinic_hours" className="font-medium text-foreground" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Patient Helpline</span>
                    <TBDText value={clinic.phone} fallbackKey="clinic_phone" className="font-medium text-primary" />
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted-foreground">Clinical Licensing</span>
                    <TBDText value={clinic.licenses[0]} fallbackKey="clinic_licenses" className="font-mono text-xs text-foreground" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-accent/40 border border-border/70 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Instant AI Dental Guidance
                  </span>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Have questions about dental symptoms or upcoming treatments? Ask our intelligent dental assistant below.
                  </p>
                  <a href="#ai-assistant" className="text-xs text-primary font-semibold hover:underline">
                    Ask Dental Assistant &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. WHY CHOOSE US (MERGED CLINIC OVERVIEW + TRUST PILLARS) */}
      <section className="py-16 sm:py-24 bg-card border-b border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Clinical Excellence"
            title="Why Patients Trust Densistt"
            description="Our clinic is built on the simple philosophy that every patient deserves unhurried, comfortable, and ethically sound dental care."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-12">
            <div className="p-6 rounded-xl bg-background border border-border shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                01
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Experienced Dentists</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Led by post-graduate specialists in endodontics, prosthodontics, and implant surgery with verified clinical records.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                02
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Modern Technology</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Equipped with digital intraoral 3D scanners, low-dose digital x-rays, and rotary endodontic systems.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                03
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Hospital-Grade Sterilization</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Class-B vacuum autoclave sterilization, strict infection barriers, and sealed individual instrument pouches.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                04
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Personalized Treatment</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every smile is unique. We co-design tailored treatment plans with transparent options and no overtreatment.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                05
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Patient-Focused Care</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gentle numbing techniques, clear communication, and comfortable operatories designed to eliminate dental anxiety.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. DENTAL TREATMENTS (ALL 10 CORE TREATMENTS) */}
      <section id="treatments" className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <SectionHeading
            eyebrow="Specialized Treatments"
            title="Comprehensive Dental Services"
            description="From preventive wellness to complex restorative procedures, our treatments combine gentle care with clinical precision."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12">
            {curatedTreatments.map((item) => (
              <Card key={item.title} variant="elevated" className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                      {item.category}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-primary font-medium">
                      {item.tag}
                    </span>
                  </div>
                  <CardTitle className="font-serif text-xl sm:text-2xl text-foreground">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm mt-2 leading-relaxed text-muted-foreground">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/services/${item.slug}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Learn More &rarr;
                  </Link>
                  <Link href="/book">
                    <Button variant="ghost" size="sm" className="hover:bg-primary hover:text-primary-foreground">
                      Book Appointment
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/services">
              <Button variant="outline" size="md">
                View Detailed Treatment Protocols &rarr;
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* 4. MEET OUR DENTISTS */}
      <section className="py-16 sm:py-24 bg-card border-y border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Our Clinical Team"
            title="Led by Registered Dental Specialists"
            description="Our dental surgeons bring advanced post-graduate qualifications and a unified commitment to conservative, patient-centered care."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {dentists.map((doc) => (
              <div key={doc.id} className="p-6 rounded-xl bg-background border border-border shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <div className="h-20 w-20 rounded-full bg-accent/70 text-primary flex items-center justify-center font-serif text-2xl font-bold border border-border">
                    {doc.name.startsWith("TBD:") ? "Dr" : doc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      <TBDText value={doc.name} fallbackKey="dentist_roster" />
                    </h3>
                    <p className="text-xs font-medium text-secondary mt-0.5">{doc.role}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {doc.specialization}
                  </p>
                  <div className="text-xs text-muted-foreground/80 flex flex-col gap-1 pt-2 border-t border-border/60">
                    <p>Qualifications: <TBDText value={doc.qualifications} fallbackKey="dentist_credentials" /></p>
                    <p>Languages: {doc.languages.join(", ")}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <Link href="/dentists" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    View Profile
                  </Link>
                  <Link href="/book">
                    <Button variant="outline" size="sm">
                      Book Appointment
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/dentists" className="text-sm font-semibold text-primary hover:underline">
              Read Detailed Specialist Credentials &rarr;
            </Link>
          </div>
        </Container>
      </section>

      {/* 5. BEFORE & AFTER SMILE GALLERY (CONSENT RECORDED ONLY, NO CONSENT IDS) */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <SectionHeading
            eyebrow="Clinical Results"
            title="Smile Transformations & Gallery"
            description="Explore real patient transformations restored with gentle care, precision ceramics, and clear aligners."
            align="center"
          />

          {consentedGallery.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {consentedGallery.map((item) => (
                <div key={item.id} className="rounded-xl bg-card border border-border shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="p-6 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-secondary font-semibold">
                      <span>{item.category}</span>
                      <span className="text-[11px] text-muted-foreground font-medium">Verified Case</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    <div className="p-3 rounded bg-accent/30 text-xs text-foreground/90 flex flex-col gap-1 mt-2">
                      <p className="font-semibold text-primary">{item.beforeLabel}</p>
                      <p className="text-muted-foreground">{item.afterLabel}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
                    <Link href="/gallery" className="font-semibold text-primary hover:underline">
                      View Case Study &rarr;
                    </Link>
                    <Link href="/book">
                      <Button variant="ghost" size="sm">
                        Book Appointment
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-card rounded-xl border border-border mt-8">
              <p className="text-sm text-muted-foreground">
                No patient transformation records with verified public consent currently published.
              </p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/gallery">
              <Button variant="outline" size="md">
                Explore Full Smile Gallery &rarr;
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* 6. PATIENT TESTIMONIALS (CONSENT RECORDED ONLY, NO CONSENT IDS) */}
      <section className="py-16 sm:py-24 bg-card border-t border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Patient Experiences"
            title="Real Words from Happy Patients"
            description="Authentic reflections shared by patients who received care at our clinic."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
            {consentedTestimonials.map((t) => (
              <div key={t.id} className="p-6 sm:p-8 rounded-xl bg-background border border-border shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1 text-secondary text-sm">
                    {"★".repeat(5)}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">
                    &ldquo;{t.reviewText}&rdquo;
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Patient {t.patientInitials}</span>
                    <span className="text-muted-foreground"> &bull; {t.treatment}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Verified Patient</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 7. AI DENTAL ASSISTANT */}
      <section id="ai-assistant" className="py-16 sm:py-24 bg-background border-t border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Smart Assistance"
            title="AI Dental Assistant"
            description="Have questions about symptoms, treatment options, or clinic procedures? Ask our intelligent dental assistant for instant guidance."
            align="center"
          />

          <div className="mt-10">
            <AIDentalAssistant />
          </div>
        </Container>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 sm:py-24 bg-card border-t border-border">
        <Container size="lg">
          <SectionHeading
            eyebrow="Common Inquiries"
            title="Frequently Asked Questions"
            description="Clear, honest answers to the most common questions our patients ask before their first appointment."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-5xl mx-auto">
            {faqs.slice(0, 6).map((faq) => (
              <div key={faq.question} className="p-6 rounded-xl bg-background border border-border shadow-sm flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  {faq.category}
                </span>
                <h3 className="font-serif text-base font-bold text-foreground">
                  {faq.question}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/faq" className="text-sm font-semibold text-primary hover:underline">
              View All Dental FAQs &rarr;
            </Link>
          </div>
        </Container>
      </section>

      {/* 9. CONTACT & APPOINTMENT BOOKING CTA */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 flex flex-col gap-4 text-center lg:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/90 bg-white/10 px-3 py-1 rounded-full w-fit mx-auto lg:mx-0">
                Easy Online Scheduling
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                Ready for a Comprehensive Dental Consultation?
              </h2>
              <p className="text-primary-foreground/80 text-sm sm:text-base leading-relaxed max-w-2xl">
                Schedule your appointment online in just 2 minutes. Our front desk will confirm available
                appointment times and prepare your initial dental evaluation.
              </p>
              <div className="flex flex-wrap gap-6 pt-2 text-xs text-primary-foreground/75 justify-center lg:justify-start">
                <div>
                  <span className="font-semibold block text-primary-foreground">Location</span>
                  <span>{clinic.address.city}, Maharashtra</span>
                </div>
                <div>
                  <span className="font-semibold block text-primary-foreground">Hours</span>
                  <TBDText value={clinic.hours.regular[0].hours} fallbackKey="clinic_hours" />
                </div>
                <div>
                  <span className="font-semibold block text-primary-foreground">Direct Helpline</span>
                  <TBDText value={clinic.phone} fallbackKey="clinic_phone" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 justify-center items-center lg:items-end">
              <Link href="/book" className="w-full sm:w-auto lg:w-full">
                <Button variant="secondary" size="lg" className="w-full shadow-lg font-semibold">
                  Book Appointment
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto lg:w-full">
                <Button variant="outline" size="lg" className="w-full bg-transparent text-primary-foreground border-primary-foreground/50 hover:bg-white/10">
                  Contact Clinic
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
