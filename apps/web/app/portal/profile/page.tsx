"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-fields";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type PatientProfileOut } from "@/lib/api-client";

export default function PortalProfilePage() {
  const [profile, setProfile] = React.useState<PatientProfileOut | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [city, setCity] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [emergencyName, setEmergencyName] = React.useState("");
  const [emergencyPhone, setEmergencyPhone] = React.useState("");

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.patient.getProfile();
      setProfile(data);
      setName(data.name || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setDob(data.date_of_birth || "");
      if (data.address) {
        setStreet(data.address.street || "");
        setCity(data.address.city || "");
        setPostalCode(data.address.postal_code || "");
      }
      if (data.emergency_contact) {
        setEmergencyName(data.emergency_contact.name || "");
        setEmergencyPhone(data.emergency_contact.phone || "");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load patient profile");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Full name must be at least 2 characters.";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await apiClient.patient.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        date_of_birth: dob || undefined,
        address: {
          street: street.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
        },
        emergency_contact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
        },
      });
      setProfile(updated);
      setSuccessMsg("Profile details saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Patient Profile & Details
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your contact information, address, and emergency contact for clinical records.
        </p>
      </div>

      {successMsg && (
        <div
          role="alert"
          className="p-4 rounded-md bg-success/10 border border-success/30 text-success text-sm flex items-center justify-between"
        >
          <span>✓ {successMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setSuccessMsg(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between"
        >
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Personal & Contact Info</CardTitle>
            <CardDescription className="text-xs">
              Primary identification used on prescriptions and invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profile-name" required>
                Full Name
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                state={formErrors.name ? "error" : "default"}
                errorMessage={formErrors.name}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-phone">Mobile Phone</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled
                  helperText="Primary phone identifier (verified)"
                />
              </div>

              <div>
                <Label htmlFor="profile-email">Email Address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  state={formErrors.email ? "error" : "default"}
                  errorMessage={formErrors.email}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="profile-dob">Date of Birth</Label>
              <Input
                id="profile-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Residential Address</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="profile-street">Street Address</Label>
                  <Input
                    id="profile-street"
                    placeholder="Apartment, building, street name"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="profile-city">City</Label>
                    <Input
                      id="profile-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-postal">PIN / Postal Code</Label>
                    <Input
                      id="profile-postal"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="profile-emergency-name">Contact Person Name</Label>
                  <Input
                    id="profile-emergency-name"
                    placeholder="Spouse / Parent / Relative"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="profile-emergency-phone">Emergency Phone</Label>
                  <Input
                    id="profile-emergency-phone"
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4 border-t border-border">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
