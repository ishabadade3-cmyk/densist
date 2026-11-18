"use client";

import * as React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Label, Input, Select, Textarea } from "@/components/ui/form-fields";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export default function ContactPage() {
  const { clinic, services } = clinicContent;
  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    email: "",
    treatment: "",
    preferredDate: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <PublicShell>
      {/* Header Banner */}
      <section className="py-12 sm:py-20 bg-accent/20 border-b border-border">
        <Container size="lg">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
            Get In Touch
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Contact &amp; Clinic Directions
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-4 leading-relaxed">
            Schedule your in-person clinical consultation, ask our front desk questions, or access
            urgent dental emergency care instructions.
          </p>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-24 bg-background">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Contact Details, Hours, Emergency Protocol */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              {/* Emergency Banner */}
              <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/30 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-ping" />
                  <h3 className="font-serif text-base font-bold text-destructive">
                    Urgent Dental Emergency?
                  </h3>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  For traumatic tooth avulsion, continuous hemorrhage, or rapidly spreading facial swelling,
                  do not wait for form replies. Call our urgent helpline directly.
                </p>
                <div className="text-xs font-semibold text-foreground pt-1 flex items-center justify-between">
                  <span>Urgent Line: <TBDText value={clinic.phone} fallbackKey="clinic_phone" /></span>
                  <span>Ambulance: {clinic.emergencyContacts.ambulance}</span>
                </div>
              </div>

              {/* Physical Location Card */}
              <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col gap-4">
                <h3 className="font-serif text-xl font-bold text-foreground">Clinic Address</h3>
                <address className="not-italic text-sm text-muted-foreground leading-relaxed flex flex-col gap-1">
                  <p className="font-medium text-foreground">
                    <TBDText value={clinic.brandName} fallbackKey="clinic_brand" />
                  </p>
                  <p>
                    <TBDText value={clinic.address.street} fallbackKey="clinic_address" />
                  </p>
                  <p>
                    {clinic.address.city}, {clinic.address.state} - <TBDText value={clinic.address.postalCode} fallbackKey="clinic_address" />
                  </p>
                  <p>Landmark: <TBDText value={clinic.address.landmark} fallbackKey="clinic_address" /></p>
                </address>

                <div className="pt-3 border-t border-border flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone (Click to call):</span>
                    <TBDText value={clinic.phone} fallbackKey="clinic_phone" className="font-medium text-primary" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <TBDText value={clinic.email} fallbackKey="clinic_email" className="font-medium text-foreground" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WhatsApp Business:</span>
                    <TBDText value={clinic.whatsapp} fallbackKey="clinic_whatsapp" className="font-medium text-primary" />
                  </div>
                </div>
              </div>

              {/* Operating Hours Card */}
              <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col gap-4">
                <h3 className="font-serif text-xl font-bold text-foreground">Consultation Hours</h3>
                <div className="flex flex-col gap-2 text-xs">
                  {clinic.hours.regular.map((h, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground">{h.days}:</span>
                      <TBDText value={h.hours} fallbackKey="clinic_hours" className="font-medium text-foreground" />
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground pt-2">
                    Note: <TBDText value={clinic.hours.holidayNote} fallbackKey="clinic_hours" />
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Consultation & Enquiry Form */}
            <div id="book" className="lg:col-span-7 scroll-mt-28">
              <div className="p-6 sm:p-10 rounded-2xl bg-card border border-border shadow-md flex flex-col gap-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Online Appointment Request
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-1">
                    Book Your Visit
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                    Fill in your details below. Our front desk will verify schedule openings and confirm your appointment.
                  </p>
                </div>

                {formSubmitted ? (
                  <div className="py-12 text-center flex flex-col items-center gap-4 bg-accent/20 rounded-xl p-8 border border-accent">
                    <span className="w-14 h-14 rounded-full bg-success/20 text-success flex items-center justify-center text-3xl font-bold">
                      ✓
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-foreground">
                      Request Submitted Successfully
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Thank you. We have recorded your clinical appointment enquiry for{" "}
                      <span className="font-semibold text-foreground">{formData.treatment || "General Consultation"}</span>.
                      Our patient coordinator will contact you at <span className="font-semibold text-foreground">{formData.phone}</span>.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setFormSubmitted(false)} className="mt-4">
                      Submit Another Enquiry
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                      <Label htmlFor="contact-name" required>Patient Full Name</Label>
                      <Input
                        id="contact-name"
                        required
                        placeholder="e.g., Rajesh Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        helperText="Provide your name as registered on government identity proofs."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-phone" required>Mobile Phone Number</Label>
                        <Input
                          id="contact-phone"
                          type="tel"
                          required
                          placeholder="+91 98200 12345"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          helperText="Required for SMS/WhatsApp verification."
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-email">Email Address</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          placeholder="patient@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-treatment" required>Desired Treatment Category</Label>
                        <Select
                          id="contact-treatment"
                          required
                          value={formData.treatment}
                          onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                        >
                          <option value="">Select a treatment...</option>
                          {services.map((s) => (
                            <option key={s.slug} value={s.title}>{s.title}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="contact-date">Preferred Date</Label>
                        <Input
                          id="contact-date"
                          type="date"
                          value={formData.preferredDate}
                          onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contact-message">Chief Complaint / Symptoms</Label>
                      <Textarea
                        id="contact-message"
                        placeholder="Describe any pain, sensitivity to hot/cold, duration of symptoms, or aesthetic goals..."
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                      <Button type="submit" variant="primary" size="lg" className="w-full justify-center">
                        Confirm Appointment Request
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        By submitting, you consent to clinic staff contacting you via phone/SMS/WhatsApp regarding this appointment request per our Privacy Policy.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
