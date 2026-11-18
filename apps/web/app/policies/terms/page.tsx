import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export const metadata = {
  title: "Terms and Conditions of Service | Dental Clinic",
  description:
    "Website terms of use, appointment booking agreements, and clinical disclaimer for patient consultation.",
};

export default function TermsPage() {
  const { clinic } = clinicContent;

  return (
    <PublicShell>
      {/* Header Banner */}
      <section className="py-12 sm:py-16 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Legal &amp; Compliance (NEEDS LEGAL REVIEW)
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mt-3 leading-relaxed">
            Effective Date: November 2026 &bull; Governs your access to this website and appointment scheduling platform.
          </p>
        </Container>
      </section>

      {/* Terms Content */}
      <section className="py-16 sm:py-20 bg-background">
        <Container size="lg">
          <div className="max-w-4xl mx-auto prose prose-slate text-sm sm:text-base text-muted-foreground leading-relaxed flex flex-col gap-8">
            <div className="p-4 rounded-lg bg-accent/30 border border-border text-xs text-foreground">
              <span className="font-semibold text-primary">Compliance Status: </span>
              Standard terms template. Specific clinic clauses remain <TBDText value={clinicContent.policies.termsAndConditions} fallbackKey="terms" /> pending legal confirmation.
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">1. Medical Disclaimer</h2>
              <p>
                The content on this website—including treatment overviews, indicative price ranges, educational blog articles,
                and FAQs—is published solely for informational purposes. It does not constitute formal medical or dental advice,
                diagnosis, or prognosis. A definitive diagnosis and treatment plan can only be established through an in-person
                clinical evaluation by a registered dental surgeon.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">2. Appointment Scheduling &amp; Hold Policy</h2>
              <p>
                Online booking requests through this platform represent an expression of intent to consult. An appointment is
                considered confirmed only after our front desk verifies operatory availability and issues an explicit SMS/email confirmation.
                Operatory slots are subject to triage priority for emergency trauma cases.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">3. Indicative Fees &amp; Payments</h2>
              <p>
                All fees listed on the website represent indicative ranges. Clinical complexities (e.g. additional root canals,
                severe curvature, bone grafting needs) may alter treatment scope. Any fee quotation provided in writing following clinical
                radiography is valid for 30 calendar days from the date of consultation.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">4. Intellectual Property</h2>
              <p>
                All trademarks, clinical photography, logos, educational text, and design tokens on this platform are the property of{" "}
                <TBDText value={clinic.brandName} fallbackKey="clinic_brand" /> or used under explicit license. Unauthorized reproduction
                or scraping is prohibited.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
