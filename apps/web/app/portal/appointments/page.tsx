"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea, Label } from "@/components/ui/form-fields";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type AppointmentOut } from "@/lib/api-client";

export default function PortalAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<AppointmentOut[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "past">("all");

  // Cancellation Dialog State
  const [cancellingAppt, setCancellingAppt] = React.useState<AppointmentOut | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = React.useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = React.useState<string | null>(null);

  const fetchAppointments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.appointments.list();
      setAppointments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setIsSubmittingCancel(true);
    try {
      await apiClient.appointments.cancel(
        cancellingAppt.appointment_id,
        cancelReason.trim() || undefined
      );
      setCancelSuccessMsg(
        `Appointment for ${cancellingAppt.service_name} has been cancelled.`
      );
      setCancellingAppt(null);
      setCancelReason("");
      fetchAppointments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel appointment");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const isPast = new Date(a.start_time) < new Date() || a.status === "completed" || a.status === "cancelled";
    if (filter === "upcoming") return !isPast;
    if (filter === "past") return isPast;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Your Dental Visits
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your scheduled consultations, cancellations, and treatment appointments.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/book">+ Book New Appointment</Link>
        </Button>
      </div>

      {/* Success Notification Alert */}
      {cancelSuccessMsg && (
        <div
          role="alert"
          className="p-4 rounded-md bg-success/10 border border-success/30 text-success text-sm flex items-center justify-between"
        >
          <span>✓ {cancelSuccessMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setCancelSuccessMsg(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Error Alert */}
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

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {(["all", "upcoming", "past"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md capitalize transition-colors ${
              filter === tab
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              🔍
            </div>
            <h2 className="text-base font-semibold text-foreground">
              No {filter !== "all" ? filter : ""} appointments found
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              When you schedule a visit, details and clinician instructions appear here.
            </p>
            <div className="pt-2">
              <Button asChild size="sm">
                <Link href="/book">Schedule an Appointment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => {
            const isCancelled = appt.status === "cancelled";
            const isConfirmed = appt.status === "confirmed" || appt.status === "scheduled";

            return (
              <Card
                key={appt.appointment_id}
                className={`transition-shadow hover:shadow-xs ${
                  isCancelled ? "opacity-75 bg-muted/20" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isConfirmed
                          ? "bg-success/10 text-success"
                          : isCancelled
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary/20 text-secondary-foreground"
                      }`}
                    >
                      {appt.status}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      ID: {appt.appointment_id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-serif mt-1">
                    {appt.service_name}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Doctor: <strong className="text-foreground">{appt.dentist_name}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5 pb-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-muted-foreground text-xs">Date & Time:</span>
                    <span className="font-medium text-xs sm:text-sm">
                      {new Date(appt.start_time).toLocaleString([], {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  {appt.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Note: {appt.notes}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex flex-wrap justify-end gap-2 border-t border-border/40 pt-3">
                  {isConfirmed && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                        onClick={() => {
                          setCancellingAppt(appt);
                          setCancelReason("");
                        }}
                      >
                        Cancel Visit
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs" asChild>
                        <Link href="/book">Reschedule</Link>
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Accessible Cancellation Confirmation Dialog */}
      <Dialog
        isOpen={!!cancellingAppt}
        onClose={() => setCancellingAppt(null)}
        title="Cancel Appointment"
        description="Are you sure you wish to cancel this scheduled consultation? This slot will be made available to other patients."
      >
        <div className="space-y-4">
          {cancellingAppt && (
            <div className="p-3 bg-muted/40 rounded-md border border-border text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">Service: </span>
                <strong className="text-foreground">{cancellingAppt.service_name}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Scheduled: </span>
                <span>
                  {new Date(cancellingAppt.start_time).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="cancel-reason">Reason for Cancellation (Optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Schedule conflict, feeling better, illness..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="text-xs min-h-[70px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancellingAppt(null)}
              disabled={isSubmittingCancel}
            >
              Keep Appointment
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleConfirmCancel}
              disabled={isSubmittingCancel}
            >
              {isSubmittingCancel ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
