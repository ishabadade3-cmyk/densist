"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label, Input, Textarea, Select, Checkbox } from "@/components/ui/form-fields";
import { Dialog } from "@/components/ui/dialog";
import { ToastContainer, type ToastItem } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function StyleguidePage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("all");

  const addToast = (variant: ToastItem["variant"], title: string, description: string) => {
    const newToast: ToastItem = {
      id: Math.random().toString(36).substring(2, 9),
      variant,
      title,
      description,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Persistent Navigation */}
      <Navbar onBookClick={() => setIsDialogOpen(true)} />

      <main id="main-content" className="flex-1 py-10 sm:py-16">
        <Container size="lg">
          {/* Header Banner */}
          <header className="mb-12 pb-8 border-b border-border">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold px-3 py-1 rounded-full bg-accent/60 inline-block mb-3">
              Living Design System Baseline
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Design System &amp; UI Components
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mt-3 leading-relaxed">
              Tailwind theme tokens and accessible shadcn/ui variants designed for a premium single-clinic dental platform in India. Fully compliant with WCAG 2.2 Level AA, responsive across all viewports, and restrained for luxury healthcare.
            </p>

            {/* Quick Jump Anchors */}
            <nav aria-label="Styleguide Table of Contents" className="mt-6 flex flex-wrap gap-2">
              {[
                { label: "Design Tokens", href: "#tokens" },
                { label: "Typography", href: "#typography" },
                { label: "Buttons", href: "#buttons" },
                { label: "Form Fields", href: "#forms" },
                { label: "Cards", href: "#cards" },
                { label: "Section Headings", href: "#headings" },
                { label: "Dialog Modal", href: "#dialog" },
                { label: "Toast Alerts", href: "#toasts" },
                { label: "Skeletons", href: "#skeletons" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-accent/40 text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </header>

          {/* 1. THEME TOKENS & CONTRAST SECTION */}
          <section id="tokens" className="mb-16 scroll-mt-24" aria-labelledby="tokens-heading">
            <SectionHeading
              eyebrow="Tokens (SRS §12.2)"
              title="Color Tokens & Contrast Verification"
              description="Core luxury healthcare palette paired to exceed WCAG 2.2 AA contrast standards (minimum 4.5:1 for standard text)."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Primary */}
              <div className="p-6 rounded-lg bg-primary text-primary-foreground shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-90">Primary Token</span>
                  <h3 className="font-serif text-2xl font-bold mt-1">Deep Teal</h3>
                  <p className="text-xs mt-1 opacity-80">CSS: var(--primary)</p>
                </div>
                <div className="text-xs font-semibold px-2 py-1 bg-background/20 rounded w-fit mt-4">
                  Contrast vs White: 7.4:1 (Passes AAA)
                </div>
              </div>

              {/* Secondary */}
              <div className="p-6 rounded-lg bg-secondary text-secondary-foreground shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-90">Secondary Token</span>
                  <h3 className="font-serif text-2xl font-bold mt-1">Champagne Gold</h3>
                  <p className="text-xs mt-1 opacity-80">CSS: var(--secondary)</p>
                </div>
                <div className="text-xs font-semibold px-2 py-1 bg-background/40 rounded w-fit mt-4">
                  Contrast vs Charcoal: 5.9:1 (Passes AA)
                </div>
              </div>

              {/* Background */}
              <div className="p-6 rounded-lg bg-background text-foreground border border-border shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Background Token</span>
                  <h3 className="font-serif text-2xl font-bold mt-1 text-foreground">Warm Ivory</h3>
                  <p className="text-xs mt-1 text-muted-foreground">CSS: var(--background)</p>
                </div>
                <div className="text-xs font-semibold px-2 py-1 bg-accent/70 text-accent-foreground rounded w-fit mt-4">
                  Base surface for content
                </div>
              </div>

              {/* Text / Foreground */}
              <div className="p-6 rounded-lg bg-foreground text-background shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">Text / Foreground Token</span>
                  <h3 className="font-serif text-2xl font-bold mt-1">Charcoal</h3>
                  <p className="text-xs mt-1 opacity-70">CSS: var(--foreground)</p>
                </div>
                <div className="text-xs font-semibold px-2 py-1 bg-background/20 rounded w-fit mt-4">
                  Contrast vs Ivory: 15.2:1 (Passes AAA)
                </div>
              </div>

              {/* Accent */}
              <div className="p-6 rounded-lg bg-accent text-accent-foreground border border-border shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-90">Accent Token</span>
                  <h3 className="font-serif text-2xl font-bold mt-1">Soft Sage</h3>
                  <p className="text-xs mt-1 opacity-80">CSS: var(--accent)</p>
                </div>
                <div className="text-xs font-semibold px-2 py-1 bg-background/50 rounded w-fit mt-4">
                  Contrast vs Charcoal: 11.3:1 (Passes AAA)
                </div>
              </div>

              {/* Muted */}
              <div className="p-6 rounded-lg bg-muted text-muted-foreground border border-border shadow-sm flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-90">Muted Token</span>
                  <h3 className="font-serif text-2xl font-bold mt-1 text-foreground">Soft Neutral</h3>
                  <p className="text-xs mt-1 opacity-80">CSS: var(--muted)</p>
                </div>
                <div className="text-xs font-semibold px-2 py-1 bg-background/50 rounded w-fit mt-4">
                  Secondary cards &amp; borders
                </div>
              </div>
            </div>

            {/* Scale Proposals: Radii, Spacing & Shadows */}
            <div className="mt-8 p-6 rounded-lg bg-card border border-border shadow-sm">
              <h4 className="font-serif text-lg font-semibold text-foreground mb-4">
                Scale Proposals (Radii, Shadows, Spacing)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                <div className="p-3 bg-accent/40 rounded-sm text-xs font-medium">rounded-sm (4px)</div>
                <div className="p-3 bg-accent/40 rounded-md text-xs font-medium">rounded-md (8px)</div>
                <div className="p-3 bg-accent/40 rounded-lg text-xs font-medium">rounded-lg (12px)</div>
                <div className="p-3 bg-accent/40 rounded-xl text-xs font-medium">rounded-xl (16px)</div>
                <div className="p-3 bg-accent/40 rounded-2xl text-xs font-medium">rounded-2xl (24px)</div>
                <div className="p-3 bg-accent/40 rounded-full text-xs font-medium">rounded-full (pill)</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-card border border-border rounded-lg shadow-sm text-center">
                  <p className="text-sm font-semibold text-foreground">shadow-sm</p>
                  <p className="text-xs text-muted-foreground">Cards, buttons</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg shadow-md text-center">
                  <p className="text-sm font-semibold text-foreground">shadow-md</p>
                  <p className="text-xs text-muted-foreground">Dropdowns, elevated cards</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg shadow-lg text-center">
                  <p className="text-sm font-semibold text-foreground">shadow-lg</p>
                  <p className="text-xs text-muted-foreground">Dialogs, mobile menus</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. TYPOGRAPHY SCALE */}
          <section id="typography" className="mb-16 scroll-mt-24" aria-labelledby="typography-heading">
            <SectionHeading
              eyebrow="Typography"
              title="Serif & Sans-Serif Font Scale"
              description="Playfair Display for refined editorial headings; Inter for highly readable body copy and technical records."
            />

            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border shadow-sm flex flex-col gap-6">
              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-6xl (60px) — Playfair Display Serif</span>
                <p className="font-serif text-6xl font-bold text-foreground tracking-tight mt-1">Excellence in Dental Care</p>
              </div>

              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-5xl (48px) — Playfair Display Serif</span>
                <p className="font-serif text-5xl font-bold text-foreground tracking-tight mt-1">Transform Your Smile</p>
              </div>

              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-4xl (36px) — Playfair Display Serif</span>
                <p className="font-serif text-4xl font-semibold text-foreground tracking-tight mt-1">Advanced Clinical Dentistry</p>
              </div>

              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-3xl (30px) — Playfair Display Serif</span>
                <p className="font-serif text-3xl font-semibold text-foreground tracking-tight mt-1">Comprehensive Consultation</p>
              </div>

              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-2xl (24px) — Playfair Display Serif</span>
                <p className="font-serif text-2xl font-semibold text-foreground tracking-tight mt-1">Precision Dental Implants &amp; Prosthetics</p>
              </div>

              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-xl (20px) — Inter Sans</span>
                <p className="text-xl font-medium text-foreground mt-1">Restrained, patient-centered clinical workflow with clear expectations.</p>
              </div>

              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-lg (18px) — Inter Sans</span>
                <p className="text-lg text-foreground mt-1">Our clinical practitioners maintain active registration with the Maharashtra State Dental Council.</p>
              </div>

              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-base (16px) — Inter Sans Body Default</span>
                <p className="text-base text-foreground leading-relaxed mt-1">
                  Root canal therapy relieves pain caused by inflamed or infected pulp tissue. Utilizing rotary endodontics and digital apex locators, single-sitting procedures can be completed comfortably under local anesthesia.
                </p>
              </div>

              <div className="border-b border-border/70 pb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-sm (14px) — Inter Sans Secondary</span>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  Indicative treatment estimates are based on average procedure complexity. Final fees are established after thorough physical examination.
                </p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">text-xs (12px) — Inter Sans Caption</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Medical disclaimer: AI assistance provides informational guidance only and never replaces clinical evaluation by a licensed dental surgeon.
                </p>
              </div>
            </div>
          </section>

          {/* 3. BUTTONS SECTION */}
          <section id="buttons" className="mb-16 scroll-mt-24" aria-labelledby="buttons-heading">
            <SectionHeading
              eyebrow="Interactive"
              title="Buttons &amp; Action Triggers"
              description="Accessible button variants across primary, secondary, outline, ghost, accent, destructive and link roles with 44px min touch targets."
            />

            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border shadow-sm flex flex-col gap-8">
              {/* Variants Showcase */}
              <div>
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  Button Variants (Medium Size)
                </h4>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="outline">Outline Action</Button>
                  <Button variant="accent">Accent Action</Button>
                  <Button variant="ghost">Ghost Action</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link Button</Button>
                </div>
              </div>

              {/* Sizes Showcase */}
              <div>
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  Button Sizes
                </h4>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary" size="sm">Small (sm: h-8)</Button>
                  <Button variant="primary" size="md">Medium Default (md: h-11 / 44px)</Button>
                  <Button variant="primary" size="lg">Large (lg: h-12)</Button>
                  <Button variant="outline" size="icon" aria-label="Sample icon button">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* States Showcase */}
              <div>
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  Component States
                </h4>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary">Default State</Button>
                  <Button variant="primary" isLoading>Loading State</Button>
                  <Button variant="primary" disabled>Disabled State</Button>
                  <Button variant="secondary" disabled>Disabled Secondary</Button>
                  <Button variant="outline" disabled>Disabled Outline</Button>
                </div>
              </div>
            </div>
          </section>

          {/* 4. FORM FIELDS & VALIDATION STATES */}
          <section id="forms" className="mb-16 scroll-mt-24" aria-labelledby="forms-heading">
            <SectionHeading
              eyebrow="Forms &amp; Inputs"
              title="Form Controls with Explicit Validation States"
              description="Fully accessible input controls featuring default, focused, disabled, invalid (with role=alert error messages), and verified success states."
            />

            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Default Input */}
              <div>
                <Label htmlFor="input-default">Patient Full Name</Label>
                <Input
                  id="input-default"
                  placeholder="e.g., Rajesh Sharma"
                  helperText="Enter your official name as registered on government ID."
                />
              </div>

              {/* Verified Success Input */}
              <div>
                <Label htmlFor="input-success">Mobile Phone (OTP Verified)</Label>
                <Input
                  id="input-success"
                  defaultValue="+91 98200 12345"
                  state="success"
                  helperText="Authenticated via Indian telecom SMS OTP."
                />
              </div>

              {/* Error / Invalid Input */}
              <div>
                <Label htmlFor="input-error" required>Email Address</Label>
                <Input
                  id="input-error"
                  defaultValue="invalid-email-address"
                  state="error"
                  errorMessage="Please enter a valid email format (e.g., patient@example.com)."
                />
              </div>

              {/* Disabled Input */}
              <div>
                <Label htmlFor="input-disabled">Patient Identifier (Auto-generated)</Label>
                <Input
                  id="input-disabled"
                  defaultValue="PT-2026-08492"
                  disabled
                  helperText="Immutable unique clinical patient identifier."
                />
              </div>

              {/* Select Control */}
              <div>
                <Label htmlFor="select-service">Preferred Treatment Category</Label>
                <Select id="select-service">
                  <option value="">Select a service category...</option>
                  <option value="rct">Root Canal Treatment (Rotary)</option>
                  <option value="implant">Single-Tooth Dental Implant</option>
                  <option value="aligners">Clear Aligners Consultation</option>
                  <option value="whitening">Laser Teeth Whitening</option>
                  <option value="cleaning">Routine Preventive Scaling</option>
                </Select>
              </div>

              {/* Textarea */}
              <div>
                <Label htmlFor="textarea-notes">Chief Complaint / Visit Reason</Label>
                <Textarea
                  id="textarea-notes"
                  placeholder="Briefly describe your symptoms or reason for scheduling..."
                  helperText="Optional details to help our front desk prepare your operatory."
                />
              </div>

              {/* Checkboxes */}
              <div className="md:col-span-2 flex flex-col gap-4 pt-2">
                <Checkbox
                  id="consent-booking"
                  label={
                    <span>
                      I understand that indicative fees are confirmed only after clinical examination by a registered dental surgeon.
                    </span>
                  }
                  defaultChecked
                />
                <Checkbox
                  id="consent-error"
                  label={
                    <span>
                      I acknowledge the 24-hour appointment cancellation policy.
                    </span>
                  }
                  errorMessage="You must accept the appointment cancellation policy to proceed."
                />
                <Checkbox
                  id="consent-disabled"
                  disabled
                  label={<span>Minor patient parental consent verified by clinic administrator.</span>}
                  defaultChecked
                />
              </div>
            </div>
          </section>

          {/* 5. CARDS & CONTAINERS */}
          <section id="cards" className="mb-16 scroll-mt-24" aria-labelledby="cards-heading">
            <SectionHeading
              eyebrow="Structure"
              title="Cards &amp; Container Variants"
              description="Modular card containers with standard, elevated, interactive, and accent highlight treatments."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Default Card */}
              <Card variant="default">
                <CardHeader>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Default Card</span>
                  <CardTitle>Preventive Dentistry</CardTitle>
                  <CardDescription>Comprehensive check-ups, digital radiographs, and ultrasonic scaling.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed">
                    Routine hygiene care prevents periodontal disease and catches early enamel demineralization before invasive restorations are required.
                  </p>
                </CardContent>
                <CardFooter>
                  <span className="text-xs font-medium text-muted-foreground">Indicative duration: 45 mins</span>
                  <Button variant="outline" size="sm">Details</Button>
                </CardFooter>
              </Card>

              {/* Interactive Card */}
              <Card variant="interactive">
                <CardHeader>
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Interactive Card</span>
                  <CardTitle>Dental Implants</CardTitle>
                  <CardDescription>Permanent titanium root replacements with monolithic zirconia crowns.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed">
                    Computer-guided implant surgery ensures optimal osseointegration with minimal post-operative discomfort.
                  </p>
                </CardContent>
                <CardFooter>
                  <span className="text-xs font-semibold text-primary">Hover effect active</span>
                  <Button variant="primary" size="sm">Explore</Button>
                </CardFooter>
              </Card>

              {/* Accent Card */}
              <Card variant="accent">
                <CardHeader>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Accent Highlight</span>
                  <CardTitle>Smile Makeover</CardTitle>
                  <CardDescription>Custom ceramic veneers engineered for facial harmony and natural aesthetics.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed">
                    Designed using facial photographic proportions without exaggerated artificial whitening.
                  </p>
                </CardContent>
                <CardFooter>
                  <span className="text-xs font-medium text-foreground">Consultation fee: [TBD:price]</span>
                  <Button variant="secondary" size="sm">Consult MDS</Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* 6. SECTION HEADINGS */}
          <section id="headings" className="mb-16 scroll-mt-24" aria-labelledby="headings-section">
            <SectionHeading
              eyebrow="Headings"
              title="Section Heading Styles"
              description="Visual contrast between left-aligned editorial sections and centered presentation headers."
            />

            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border shadow-sm flex flex-col gap-10">
              <div className="p-6 rounded-md bg-background border border-border/60">
                <SectionHeading
                  eyebrow="Clinical Excellence"
                  title="Left-Aligned Section Heading"
                  description="Used throughout editorial treatment pages and detailed clinical documentation."
                  align="left"
                />
              </div>

              <div className="p-6 rounded-md bg-background border border-border/60">
                <SectionHeading
                  eyebrow="Patient Care Journey"
                  title="Centered Section Heading"
                  description="Ideal for featured services, doctor introductions, and clinic values showcases."
                  align="center"
                />
              </div>
            </div>
          </section>

          {/* 7. DIALOG / MODAL */}
          <section id="dialog" className="mb-16 scroll-mt-24" aria-labelledby="dialog-heading">
            <SectionHeading
              eyebrow="Modals"
              title="Accessible Dialog Component"
              description="Full keyboard trap, Escape key dismissal, backdrop blur, and ARIA modal compliance."
            />

            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-serif text-xl font-semibold text-foreground">Interactive Dialog Demo</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Trigger an appointment request modal to test focus management, screen reader labels, and Escape dismissal.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsDialogOpen(true)}
                id="open-dialog-btn"
              >
                Open Appointment Dialog
              </Button>
            </div>

            {/* The Dialog */}
            <Dialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              title="Schedule Dental Consultation"
              description="Select your preferred treatment and our reception team will confirm operatory availability."
            >
              <form
                className="flex flex-col gap-4 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsDialogOpen(false);
                  addToast("success", "Appointment Requested", "Our front desk has received your slot request.");
                }}
              >
                <div>
                  <Label htmlFor="dialog-name" required>Full Name</Label>
                  <Input id="dialog-name" placeholder="Rajesh Sharma" required />
                </div>
                <div>
                  <Label htmlFor="dialog-phone" required>Mobile Number</Label>
                  <Input id="dialog-phone" type="tel" placeholder="+91 98000 00000" required />
                </div>
                <div>
                  <Label htmlFor="dialog-service">Select Service</Label>
                  <Select id="dialog-service">
                    <option>Consultation &amp; Oral Radiograph</option>
                    <option>Root Canal Therapy</option>
                    <option>Dental Implant Assessment</option>
                    <option>Orthodontic / Aligner Scan</option>
                  </Select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Submit Request
                  </Button>
                </div>
              </form>
            </Dialog>
          </section>

          {/* 8. TOAST NOTIFICATIONS */}
          <section id="toasts" className="mb-16 scroll-mt-24" aria-labelledby="toasts-heading">
            <SectionHeading
              eyebrow="Feedback"
              title="Toast Alerts &amp; Notifications"
              description="Polite live region notifications (`role=status` and `aria-live=polite`) for transactional feedback."
            />

            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border shadow-sm flex flex-col gap-6">
              <p className="text-sm text-muted-foreground">
                Click any button below to dispatch live floating notifications at the bottom-right of the viewport:
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => addToast("success", "Booking Confirmed", "Your visit is confirmed for tomorrow at 10:30 AM.")}
                >
                  Trigger Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addToast("error", "Slot Unavailable", "The selected operatory is booked. Please pick another time.")}
                >
                  Trigger Error Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addToast("info", "SMS Reminder Dispatched", "A DLT transactional reminder has been sent to your phone.")}
                >
                  Trigger Info Toast
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => addToast("default", "System Update", "Your patient profile has been updated successfully.")}
                >
                  Trigger Default Toast
                </Button>
              </div>
            </div>
          </section>

          {/* 9. SKELETON LOADERS */}
          <section id="skeletons" className="mb-16 scroll-mt-24" aria-labelledby="skeletons-heading">
            <SectionHeading
              eyebrow="Loading States"
              title="Skeleton Placeholders"
              description="Subtle shimmer placeholders with full reduced-motion overrides for perceived performance."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Skeleton */}
              <div className="p-6 rounded-lg bg-card border border-border shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" className="h-12 w-12" />
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton variant="text" className="h-4 w-3/4" />
                    <Skeleton variant="text" className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <Skeleton variant="text" className="h-3 w-full" />
                  <Skeleton variant="text" className="h-3 w-5/6" />
                </div>
                <Skeleton variant="button" className="h-10 w-28 mt-2" />
              </div>

              {/* Card Skeleton */}
              <div className="p-6 rounded-lg bg-card border border-border shadow-sm flex flex-col gap-4">
                <Skeleton variant="rectangular" className="h-32 w-full rounded-md" />
                <Skeleton variant="text" className="h-5 w-2/3 mt-1" />
                <Skeleton variant="text" className="h-3 w-full" />
                <Skeleton variant="text" className="h-3 w-4/5" />
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/50">
                  <Skeleton variant="text" className="h-4 w-20" />
                  <Skeleton variant="button" className="h-8 w-20" />
                </div>
              </div>

              {/* Data Table Row Skeleton */}
              <div className="p-6 rounded-lg bg-card border border-border shadow-sm flex flex-col gap-3 justify-center">
                <div className="flex justify-between items-center">
                  <Skeleton variant="text" className="h-4 w-28" />
                  <Skeleton variant="text" className="h-4 w-16" />
                </div>
                <div className="h-px bg-border/60 my-1" />
                <div className="flex justify-between items-center">
                  <Skeleton variant="text" className="h-4 w-32" />
                  <Skeleton variant="text" className="h-4 w-20" />
                </div>
                <div className="h-px bg-border/60 my-1" />
                <div className="flex justify-between items-center">
                  <Skeleton variant="text" className="h-4 w-24" />
                  <Skeleton variant="text" className="h-4 w-16" />
                </div>
              </div>
            </div>
          </section>
        </Container>
      </main>

      {/* Footer Component Showcase */}
      <Footer />
    </div>
  );
}

