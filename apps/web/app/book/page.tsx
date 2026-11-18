"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form-fields";
import { Skeleton } from "@/components/ui/skeleton";
import {
  apiClient,
  type ServiceOut,
  type DentistOut,
  type SlotOut,
  type AppointmentOut,
} from "@/lib/api-client";

type Step = "service" | "dentist" | "slot" | "details" | "otp" | "confirmed";

export default function BookingWizardPage() {
  const [currentStep, setCurrentStep] = React.useState<Step>("service");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Data loaded from typed API client
  const [services, setServices] = React.useState<ServiceOut[]>([]);
  const [dentists, setDentists] = React.useState<DentistOut[]>([]);
  const [slots, setSlots] = React.useState<SlotOut[]>([]);

  // Wizard selections
  const [selectedService, setSelectedService] = React.useState<ServiceOut | null>(null);
  const [selectedDentist, setSelectedDentist] = React.useState<DentistOut | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = React.useState<SlotOut | null>(null);

  // Patient Details form
  const [patientName, setPatientName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // OTP Verification
  const [otpCode, setOtpCode] = React.useState("");
  const [otpDevHint, setOtpDevHint] = React.useState<string | null>(null);
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);

  // Confirmation result
  const [confirmedAppointment, setConfirmedAppointment] = React.useState<AppointmentOut | null>(null);

  // Load Services on mount
  React.useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [servicesData, dentistsData] = await Promise.all([
          apiClient.services.list(),
          apiClient.dentists.list(),
        ]);
        setServices(servicesData);
        setDentists(dentistsData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load clinic booking options");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Fetch slots whenever service, dentist, or date changes
  React.useEffect(() => {
    if (!selectedService) return;
    async function fetchSlots() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.availability.get({
          service_id: selectedService!.service_id,
          date: selectedDate,
          dentist_id: selectedDentist ? selectedDentist.dentist_id : undefined,
        });
        setSlots(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load available slots");
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [selectedService, selectedDentist, selectedDate]);

  // Validate Step 4 Details Form
  const validateDetails = (): boolean => {
    const errors: Record<string, string> = {};
    if (!patientName.trim() || patientName.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters.";
    }
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      errors.phone = "Valid contact phone number is required (min 8 digits).";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Trigger OTP when proceeding from Details
  const handleProceedToOtp = async () => {
    if (!validateDetails()) return;
    setLoading(true);
    setOtpError(null);
    try {
      const res = await apiClient.auth.sendOtp({
        email_or_phone: phone.trim(),
        purpose: "booking",
      });
      if (res.dev_code) {
        setOtpDevHint(res.dev_code);
        setOtpCode(res.dev_code); // Pre-fill in development for fast testing
      }
      setCurrentStep("otp");
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Submit Booking with OTP verification
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      if (!selectedService || !selectedSlot) {
        throw new Error("Missing booking service or time slot.");
      }

      const dentistId = selectedDentist ? selectedDentist.dentist_id : selectedSlot.dentist_id;

      // Create appointment via generated typed API client
      const appointment = await apiClient.appointments.create({
        service_id: selectedService.service_id,
        dentist_id: dentistId,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        patient_name: patientName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        date_of_birth: dob || undefined,
        notes: notes.trim() || undefined,
      });

      setConfirmedAppointment(appointment);
      setCurrentStep("confirmed");
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Booking confirmation failed");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const stepsList: { key: Step; label: string; number: number }[] = [
    { key: "service", label: "Service", number: 1 },
    { key: "dentist", label: "Dentist", number: 2 },
    { key: "slot", label: "Date & Slot", number: 3 },
    { key: "details", label: "Patient Info", number: 4 },
    { key: "otp", label: "Verification", number: 5 },
    { key: "confirmed", label: "Confirmed", number: 6 },
  ];

  const currentStepNumber = stepsList.find((s) => s.key === currentStep)?.number || 1;

  return (
    <div className="min-h-screen bg-background py-10">
      <Container className="max-w-4xl">
        {/* Header & Accessibility Breadcrumb */}
        <div className="text-center mb-8">
          <SectionHeading
            eyebrow="Online Reservation (WF-001)"
            title="Book Your Dental Visit"
            description="Experience seamless, transparent dental scheduling with our verified clinicians."
            align="center"
          />

          {/* Stepper Navigation */}
          {currentStep !== "confirmed" && (
            <nav aria-label="Booking Progress" className="mt-8">
              <ol className="flex items-center justify-between relative max-w-2xl mx-auto px-2">
                <div
                  className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-muted -z-0"
                  aria-hidden="true"
                />
                {stepsList.slice(0, 5).map((step) => {
                  const isCompleted = step.number < currentStepNumber;
                  const isCurrent = step.key === currentStep;
                  return (
                    <li key={step.key} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-card text-muted-foreground border border-border"
                        }`}
                        aria-current={isCurrent ? "step" : undefined}
                      >
                        {isCompleted ? "✓" : step.number}
                      </div>
                      <span className="text-xs font-medium mt-1.5 hidden sm:inline text-muted-foreground">
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between"
          >
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* --- STEP 1: SELECT SERVICE --- */}
        {currentStep === "service" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground">1. Select Dental Service</h2>
                <p className="text-sm text-muted-foreground">Choose the care or treatment reason for your visit.</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <Card className="text-center py-10">
                <CardContent>
                  <p className="text-muted-foreground">No dental services currently available for booking.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((svc) => {
                  const isSelected = selectedService?.service_id === svc.service_id;
                  return (
                    <Card
                      key={svc.service_id}
                      onClick={() => setSelectedService(svc)}
                      className={`cursor-pointer transition-all duration-200 hover:border-primary/60 ${
                        isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base font-semibold">{svc.service_name}</CardTitle>
                          {isSelected && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                              Selected
                            </span>
                          )}
                        </div>
                        <CardDescription className="text-xs line-clamp-2 mt-1">
                          {svc.description || "Comprehensive clinical diagnosis and specialized care."}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center">
                        <span className="font-medium text-foreground">Duration: ~{svc.duration_minutes} mins</span>
                        {svc.price_min && (
                          <span className="text-primary font-semibold">
                            ₹{svc.price_min.toLocaleString("en-IN")}+
                          </span>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                disabled={!selectedService}
                onClick={() => setCurrentStep("dentist")}
                className="w-full sm:w-auto"
              >
                Continue to Dentist Selection →
              </Button>
            </div>
          </div>
        )}

        {/* --- STEP 2: SELECT DENTIST --- */}
        {currentStep === "dentist" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">2. Choose Your Dentist</h2>
              <p className="text-sm text-muted-foreground">
                Select your preferred dental surgeon or choose any clinician available for {selectedService?.service_name}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option: Any Available Dentist */}
              <Card
                onClick={() => setSelectedDentist(null)}
                className={`cursor-pointer transition-all duration-200 hover:border-primary/60 ${
                  selectedDentist === null ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">First Available Specialist</CardTitle>
                    {selectedDentist === null && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                        Selected
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Maximum slot flexibility. We will match you with the first available verified dental specialist.
                  </CardDescription>
                </CardHeader>
              </Card>

              {dentists.map((d) => {
                const isSelected = selectedDentist?.dentist_id === d.dentist_id;
                return (
                  <Card
                    key={d.dentist_id}
                    onClick={() => setSelectedDentist(d)}
                    className={`cursor-pointer transition-all duration-200 hover:border-primary/60 ${
                      isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">{d.name}</CardTitle>
                          <p className="text-xs text-primary font-medium mt-0.5">{d.specialization}</p>
                        </div>
                        {isSelected && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                            Selected
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-1">{d.qualification}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between">
                      <span>{d.experience_years ? `${d.experience_years} years exp` : "Verified Specialist"}</span>
                      <span>{d.languages ? d.languages.join(", ") : "English, Hindi"}</span>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep("service")}>
                ← Back
              </Button>
              <Button onClick={() => setCurrentStep("slot")}>
                Continue to Time Slots →
              </Button>
            </div>
          </div>
        )}

        {/* --- STEP 3: SELECT DATE & TIME SLOT --- */}
        {currentStep === "slot" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">3. Select Appointment Date & Slot</h2>
              <p className="text-sm text-muted-foreground">
                All slots reflect real-time operatory and clinician availability.
              </p>
            </div>

            {/* Date Picker Control */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <Label htmlFor="booking-date" required>
                Select Consultation Date
              </Label>
              <Input
                id="booking-date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="max-w-xs"
              />
            </div>

            {/* Slots Grid */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Available Time Slots for {selectedDate}:
              </h3>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-md" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      No consultation slots available on this date. Please select another date.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.slot_id === slot.slot_id;
                    const timeLabel = new Date(slot.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });

                    if (!slot.available) {
                      return (
                        <div
                          key={slot.slot_id}
                          className="p-3 rounded-md border border-border/50 bg-muted/40 text-center opacity-60 cursor-not-allowed select-none"
                        >
                          <span className="text-sm line-through text-muted-foreground">{timeLabel}</span>
                          <span className="block text-[10px] text-destructive mt-0.5">Booked</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.slot_id}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-md border text-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "border-border bg-card hover:border-primary/50 text-foreground"
                        }`}
                      >
                        <span className="text-sm block">{timeLabel}</span>
                        <span className={`text-[10px] block mt-0.5 ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                          {slot.dentist_name.split(" ")[0]} {slot.dentist_name.split(" ")[1] || ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep("dentist")}>
                ← Back
              </Button>
              <Button
                disabled={!selectedSlot}
                onClick={() => setCurrentStep("details")}
              >
                Continue to Details →
              </Button>
            </div>
          </div>
        )}

        {/* --- STEP 4: PATIENT DETAILS --- */}
        {currentStep === "details" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-foreground">4. Patient Contact & Details</h2>
              <p className="text-sm text-muted-foreground">
                We will send booking confirmations and appointment reminders to this contact.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="patient-name" required>
                    Full Name
                  </Label>
                  <Input
                    id="patient-name"
                    placeholder="Enter patient full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    state={formErrors.name ? "error" : "default"}
                    errorMessage={formErrors.name}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient-phone" required>
                      Mobile Phone Number
                    </Label>
                    <Input
                      id="patient-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      state={formErrors.phone ? "error" : "default"}
                      errorMessage={formErrors.phone}
                      helperText="Used for OTP verification and WhatsApp reminders"
                    />
                  </div>

                  <div>
                    <Label htmlFor="patient-email">Email Address (Optional)</Label>
                    <Input
                      id="patient-email"
                      type="email"
                      placeholder="patient@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      state={formErrors.email ? "error" : "default"}
                      errorMessage={formErrors.email}
                      helperText="For calendar invite and invoice receipts"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="patient-dob">Date of Birth (Optional)</Label>
                  <Input
                    id="patient-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="patient-notes">Chief Complaint / Visit Notes (Optional)</Label>
                  <Textarea
                    id="patient-notes"
                    placeholder="Briefly describe your symptoms or reason for visit (e.g. sharp toothache, routine scaling, cosmetic smile consultation)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep("slot")}>
                ← Back
              </Button>
              <Button onClick={handleProceedToOtp} disabled={loading}>
                {loading ? "Sending Verification..." : "Verify & Confirm Booking →"}
              </Button>
            </div>
          </div>
        )}

        {/* --- STEP 5: OTP VERIFICATION --- */}
        {currentStep === "otp" && (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="text-center">
              <h2 className="text-xl font-serif font-bold text-foreground">5. Verify Contact Number</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-digit verification code sent to <strong className="text-foreground">{phone}</strong>.
              </p>
            </div>

            <Card>
              <form onSubmit={handleConfirmBooking}>
                <CardContent className="pt-6 space-y-4">
                  {otpDevHint && (
                    <div className="p-3 bg-secondary/20 rounded-md border border-secondary text-xs text-foreground">
                      <span className="font-semibold">Development Code:</span> {otpDevHint} (automatically filled)
                    </div>
                  )}

                  <div>
                    <Label htmlFor="otp-input" required>
                      6-Digit Security Code
                    </Label>
                    <Input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      state={otpError ? "error" : "default"}
                      errorMessage={otpError || undefined}
                      className="text-center tracking-widest text-lg font-mono"
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                    <span>Didn&apos;t receive the code?</span>
                    <button
                      type="button"
                      onClick={handleProceedToOtp}
                      className="text-primary hover:underline font-medium"
                    >
                      Resend Code
                    </button>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep("details")}
                    disabled={isVerifyingOtp}
                  >
                    ← Edit Details
                  </Button>
                  <Button type="submit" disabled={isVerifyingOtp} className="flex-1">
                    {isVerifyingOtp ? "Verifying..." : "Confirm Booking ✓"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}

        {/* --- STEP 6: CONFIRMED SUCCESS SCREEN --- */}
        {currentStep === "confirmed" && confirmedAppointment && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <Card className="border-success/40 bg-success/5 text-center py-8 px-4">
              <div className="w-14 h-14 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Appointment Successfully Booked!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your consultation has been confirmed. A booking summary has been dispatched to your contact.
              </p>

              <div className="bg-card border border-border rounded-lg p-5 mt-6 text-left max-w-md mx-auto space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Booking ID</span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    {confirmedAppointment.appointment_id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Service</span>
                  <span className="text-xs font-semibold text-foreground">
                    {confirmedAppointment.service_name}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Dentist</span>
                  <span className="text-xs font-semibold text-foreground">
                    {confirmedAppointment.dentist_name}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-xs text-muted-foreground">Scheduled Time</span>
                  <span className="text-xs font-semibold text-foreground">
                    {new Date(confirmedAppointment.start_time).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="text-xs font-bold text-success uppercase">
                    {confirmedAppointment.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button asChild>
                  <Link href="/portal">Go to Patient Portal →</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep("service");
                    setSelectedService(null);
                    setSelectedDentist(null);
                    setSelectedSlot(null);
                    setConfirmedAppointment(null);
                  }}
                >
                  Book Another Visit
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Container>
    </div>
  );
}
