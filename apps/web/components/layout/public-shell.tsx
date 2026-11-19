"use client";

import * as React from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { QuickContactBar } from "./quick-contact-bar";
import { Dialog } from "@/components/ui/dialog";
import { Label, Input, Select, Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { clinicContent } from "@/config/clinic-content";

export interface PublicShellProps {
  children: React.ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsBookingOpen(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar onBookClick={() => setIsBookingOpen(true)} />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <Footer />

      {/* Floating & Mobile Quick Action Bar (Call, WhatsApp, Directions, Book) */}
      <QuickContactBar onBookClick={() => setIsBookingOpen(true)} />

      {/* Appointment Consultation Request Modal */}
      <Dialog
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title="Schedule a Dental Consultation"
        description="Select your desired treatment and preferred time. Our clinical reception will verify availability and confirm your operatory slot."
      >
        {isSubmitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center text-2xl font-bold">
              ✓
            </span>
            <h4 className="font-serif text-xl font-semibold text-foreground">Appointment Request Received</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Our front desk will contact you shortly to confirm your clinical time slot.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="modal-name" required>Full Name</Label>
              <Input id="modal-name" required placeholder="e.g., Rajesh Sharma" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-phone" required>Mobile Phone (for OTP)</Label>
                <Input id="modal-phone" type="tel" required placeholder="+91 98200 12345" />
              </div>
              <div>
                <Label htmlFor="modal-email">Email Address</Label>
                <Input id="modal-email" type="email" placeholder="patient@example.com" />
              </div>
            </div>

            <div>
              <Label htmlFor="modal-service" required>Treatment Category</Label>
              <Select id="modal-service" required defaultValue="">
                <option value="" disabled>Select clinical treatment...</option>
                {clinicContent.services.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.title}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="modal-notes">Chief Complaint / Notes</Label>
              <Textarea
                id="modal-notes"
                placeholder="Describe your symptoms, tooth sensitivity, or cosmetic goals..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
              <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Request
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
