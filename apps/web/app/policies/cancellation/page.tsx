import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export const metadata = {
  title: "Appointment Cancellation & Rescheduling Policy | Dental Clinic",
  description:
    "Clinic notice windows, rescheduling protocol, and deposit rules for booked operatory time slots.",
};

export default function CancellationPolicyPage() {
  const { clinic } = clinicContent;

  return (
    <PublicShell>
      {/* Header Banner */}
      <section className="py-12 sm:py-16 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Patient Scheduling Guidelines
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Cancellation &amp; Rescheduling Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mt-3 leading-relaxed">
            Effective Date: November 2026 &bull; Ensures fair operatory availability for all patients, especially those requiring urgent care.
          </p>
        </Container>
      </section>

      {/* Cancellation Content */}
      <section className="py-16 sm:py-20 bg-background">
        <Container size="lg">
          <div className="max-w-4xl mx-auto prose prose-slate text-sm sm:text-base text-muted-foreground leading-relaxed flex flex-col gap-8">
            <div className="p-4 rounded-lg bg-accent/30 border border-border text-xs text-foreground">
              <span className="font-semibold text-primary">Compliance Status: </span>
              Policy terms template. Detailed fee rules remain <TBDText value={clinicContent.policies.cancellationPolicy} fallbackKey="cancellation_policy" /> pending clinic owner approval.
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">1. Prior Notice Requirement</h2>
              <p>
                Each dental appointment reserves dedicated operatory space, specialized equipment, sterile instrument trays,
                and clinical doctor time. We respectfully request at least <span className="font-semibold text-foreground">24 hours prior notice</span> if
                you need to reschedule or cancel a booked appointment.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">2. How to Reschedule or Cancel</h2>
              <p>You may cancel or reschedule through any of the following channels:</p>
              <ul className="list-disc list-inside space-y-1.5 mt-2">
                <li>By calling our clinic front desk directly at <TBDText value={clinic.phone} fallbackKey="clinic_phone" className="font-semibold text-foreground" />.</li>
                <li>Via our official WhatsApp Business line: <TBDText value={clinic.whatsapp} fallbackKey="clinic_whatsapp" className="font-semibold text-foreground" />.</li>
                <li>Through the Patient Portal &gt; My Appointments section (for registered patients).</li>
              </ul>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">3. Advanced Surgical Procedures (Implants &amp; Aligners)</h2>
              <p>
                For multi-hour surgical bookings or clear aligner delivery sessions requiring specialized laboratory staging,
                a <span className="font-semibold text-foreground">48-hour notice</span> is requested. Any consultation advance paid is adjusted toward your
                rescheduled slot.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">4. Medical Emergencies Exception</h2>
              <p>
                We understand that acute medical events and unforeseen family emergencies occur. Cancellation notice windows are
                immediately waived in documented medical emergencies.
              </p>
            </div>

            <div className="pt-6 border-t border-border flex flex-wrap gap-4 items-center">
              <Link href="/contact#book">
                <Button variant="primary" size="md">
                  Book or Modify an Appointment
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="md">
                  Contact Front Desk
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
