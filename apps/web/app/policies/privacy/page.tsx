import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export const metadata = {
  title: "Privacy Policy & DPDP Act Data Protection Notice | Dental Clinic",
  description:
    "Patient data privacy notice, digital health record governance, and consent rights under the Digital Personal Data Protection Act 2023.",
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy &amp; Data Protection Notice
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mt-3 leading-relaxed">
            Effective Date: November 2026 &bull; Formulated in adherence with the Digital Personal Data Protection Act 2023 (DPDP Act) and Information Technology (SPDI) Rules.
          </p>
        </Container>
      </section>

      {/* Policy Content */}
      <section className="py-16 sm:py-20 bg-background">
        <Container size="lg">
          <div className="max-w-4xl mx-auto prose prose-slate text-sm sm:text-base text-muted-foreground leading-relaxed flex flex-col gap-8">
            <div className="p-4 rounded-lg bg-accent/30 border border-border text-xs text-foreground">
              <span className="font-semibold text-primary">Compliance Status: </span>
              This privacy notice outlines data minimization, purpose limitation, and consent principles.
              Specific clinic clauses remain <TBDText value={clinicContent.policies.privacyNotice} fallbackKey="privacy_notice" /> pending formal legal review.
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">1. Data Fiduciary Identity</h2>
              <p>
                The Data Fiduciary responsible for processing your digital personal and health data under this policy is{" "}
                <TBDText value={clinic.legalName} fallbackKey="clinic_legal_name" className="font-semibold text-foreground" />, operating as{" "}
                <TBDText value={clinic.brandName} fallbackKey="clinic_brand" className="font-semibold text-foreground" />, having its clinic premises at{" "}
                <TBDText value={clinic.address.street} fallbackKey="clinic_address" />, {clinic.address.city}, {clinic.address.state}, India.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">2. Categories of Data Collected</h2>
              <p>We collect only data necessary for clinical care and booking administration:</p>
              <ul className="list-disc list-inside space-y-1.5 mt-2">
                <li><span className="font-semibold text-foreground">Demographic Data:</span> Full name, date of birth, gender, residential address.</li>
                <li><span className="font-semibold text-foreground">Contact Data:</span> Verified mobile number (for DLT SMS / OTP transactional notices) and email address.</li>
                <li><span className="font-semibold text-foreground">Clinical Records:</span> Intraoral scans, digital radiographs (RVG/OPG), medical history, allergies, clinical notes, and treatment plans recorded by registered dentists.</li>
                <li><span className="font-semibold text-foreground">Billing Records:</span> Invoice identifiers, payment mode, transaction receipts (PCI-DSS compliant hosted payment flows).</li>
              </ul>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">3. Purpose Limitation &amp; Consent</h2>
              <p>
                Personal and clinical data are processed strictly for defined purposes: scheduling consultations,
                diagnosing dental conditions, executing authorized surgical procedures, delivering payment receipts,
                and fulfilling statutory medical record-keeping mandates. We do not sell, rent, or trade patient personal data.
                We never train machine learning or AI models on patient clinical records.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">4. Clinical Imagery &amp; Smile Gallery Consent</h2>
              <p>
                Under Dental Council of India regulations and DPDP Act provisions, any clinical photography or
                transformation imagery displayed on this platform requires prior, specific, freely given, and recorded written consent.
                Every public gallery item references an auditable consent record. Patients maintain the unconditional right
                to withdraw image consent at any time.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">5. Data Retention &amp; Security</h2>
              <p>
                Clinical health records are retained in compliance with applicable medical establishment regulations.
                Digital communications and access logs are protected using TLS 1.3 encryption in transit, AES-256 encryption at rest,
                and least-privilege role-based access control (RBAC).
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">6. Patient Data Rights</h2>
              <p>Under the DPDP Act 2023, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1.5 mt-2">
                <li>Access a summary of your personal data processed by the clinic.</li>
                <li>Request correction, completion, or updating of inaccurate personal data.</li>
                <li>Request erasure of personal data that is no longer required for statutory medical or billing retention.</li>
                <li>Nominate an individual to exercise rights in the event of death or incapacity.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">7. Grievance Redressal</h2>
              <p>
                For questions regarding data processing or to exercise your rights under the DPDP Act, contact our
                designated Data Grievance Officer:
              </p>
              <div className="p-4 rounded-lg bg-card border border-border mt-3 text-xs flex flex-col gap-1">
                <p>Officer: <TBDText value="TBD:grievance_contact" fallbackKey="grievance_contact" /></p>
                <p>Clinic Email: <TBDText value={clinic.email} fallbackKey="clinic_email" /></p>
                <p>Clinic Helpline: <TBDText value={clinic.phone} fallbackKey="clinic_phone" /></p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
