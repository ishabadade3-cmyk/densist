"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type AppointmentOut, type PatientProfileOut } from "@/lib/api-client";

export default function PortalDashboardPage() {
  const [profile, setProfile] = React.useState<PatientProfileOut | null>(null);
  const [appointments, setAppointments] = React.useState<AppointmentOut[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, apptsData] = await Promise.all([
        apiClient.patient.getProfile(),
        apiClient.appointments.list(),
      ]);
      setProfile(profileData);
      setAppointments(apptsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard details");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "confirmed" || a.status === "scheduled"
  );
  const nextVisit = upcomingAppointments[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 text-center py-12">
        <CardContent className="space-y-4">
          <div role="alert" className="text-destructive font-medium text-sm">
            {error}
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={loadData}>Retry</Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign In Again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Welcome back, {profile?.name || "Patient"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your upcoming dental visits, released medical records, and billing receipts.
        </p>
      </div>

      {/* Next Upcoming Visit Hero Banner */}
      {nextVisit ? (
        <Card className="border-primary/30 bg-primary/5 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Next Upcoming Consultation
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Ref: {nextVisit.appointment_id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-serif mt-2">
              {nextVisit.service_name}
            </CardTitle>
            <CardDescription className="text-sm">
              Attending Clinician: <strong className="text-foreground">{nextVisit.dentist_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {new Date(nextVisit.start_time).toLocaleString([], {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </CardContent>
          <CardFooter className="pt-2 flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/portal/appointments">View Details & Manage Visit →</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/book">Reschedule</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="text-center py-8 border-dashed">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              🗓️
            </div>
            <h2 className="text-lg font-semibold text-foreground">No Upcoming Visits Booked</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Keep up with regular preventive cleanings and oral health examinations every 6 months.
            </p>
            <div className="pt-2">
              <Button asChild>
                <Link href="/book">Book an Appointment Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Total Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-foreground">
              {appointments.length}
            </div>
            <Link
              href="/portal/appointments"
              className="text-xs text-primary hover:underline font-medium mt-1 inline-block"
            >
              View visit history →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Clinical Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-foreground">2</div>
            <Link
              href="/portal/documents"
              className="text-xs text-primary hover:underline font-medium mt-1 inline-block"
            >
              Prescriptions & Reports →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Billing Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-foreground">1 Paid</div>
            <Link
              href="/portal/payments"
              className="text-xs text-primary hover:underline font-medium mt-1 inline-block"
            >
              Download Receipts →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Shortcuts */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Patient Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/book"
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors flex flex-col justify-between h-28 group"
          >
            <span className="text-lg">📅</span>
            <div>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                Book Visit
              </span>
              <span className="text-xs text-muted-foreground">Select slot & clinician</span>
            </div>
          </Link>

          <Link
            href="/portal/profile"
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors flex flex-col justify-between h-28 group"
          >
            <span className="text-lg">👤</span>
            <div>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                Edit Profile
              </span>
              <span className="text-xs text-muted-foreground">Contact & emergency info</span>
            </div>
          </Link>

          <Link
            href="/portal/documents"
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors flex flex-col justify-between h-28 group"
          >
            <span className="text-lg">📄</span>
            <div>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                Records & Rx
              </span>
              <span className="text-xs text-muted-foreground">Released prescriptions</span>
            </div>
          </Link>

          <Link
            href="/portal/privacy"
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors flex flex-col justify-between h-28 group"
          >
            <span className="text-lg">🔒</span>
            <div>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                Privacy
              </span>
              <span className="text-xs text-muted-foreground">DPDP consent settings</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
