"use client";

/**
 * Receptionist workspace (FR-018, ADM-019, ADM-020, ADM-021).
 * - Today / All tabs for appointment calendar.
 * - Confirm / Complete / No-show inline actions.
 * - Rescheduling dialog (FR-016, ADM-020).
 * - Walk-in patient registration (ADM-019).
 * - Clinical notes hidden per ADM-023 (receptionist role has no access to patient records endpoint).
 */

import * as React from "react";
import { StaffGuard } from "@/components/staff/staff-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input, Label } from "@/components/ui/form-fields";
import { Dialog } from "@/components/ui/dialog";
import { apiClient, type StaffAppointment } from "@/lib/api-client";

type CalTab = "today" | "all";
type StatusFilter = "all" | "requested" | "confirmed" | "completed" | "cancelled";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  requested: "Requested",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
  rescheduled: "Rescheduled",
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  requested: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  "no-show": "bg-zinc-100 text-zinc-600 border-zinc-200",
  rescheduled: "bg-violet-50 text-violet-700 border-violet-200",
};

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function todayISO() { return isoDate(new Date()); }
function thirtyDaysISO() { const d = new Date(); d.setDate(d.getDate() + 30); return isoDate(d); }

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLOR[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function ReceptionWorkspace() {
  const [tab, setTab] = React.useState<CalTab>("today");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [appointments, setAppointments] = React.useState<StaffAppointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Rescheduling dialog state
  const [rescheduleTarget, setRescheduleTarget] = React.useState<StaffAppointment | null>(null);
  const [rescheduleTime, setRescheduleTime] = React.useState("");
  const [rescheduleReason, setRescheduleReason] = React.useState("");
  const [rescheduleError, setRescheduleError] = React.useState<string | null>(null);
  const [rescheduling, setRescheduling] = React.useState(false);

  const refresh = React.useCallback(async (currentTab: CalTab, currentStatus: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const filters: Parameters<typeof apiClient.staff.calendar>[0] = {};
      if (currentTab === "today") {
        filters.date_from = todayISO();
        filters.date_to = todayISO();
      } else {
        filters.date_from = todayISO();
        filters.date_to = thirtyDaysISO();
      }
      if (currentStatus !== "all") filters.status = currentStatus;
      setAppointments(await apiClient.staff.calendar(filters));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(tab, statusFilter); }, [refresh, tab, statusFilter]);

  async function updateStatus(id: string, status: string) {
    setError(null);
    try {
      await apiClient.staff.updateAppointment(id, status);
      setMessage(`Appointment marked as ${STATUS_LABEL[status] ?? status}.`);
      void refresh(tab, statusFilter);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update"); }
  }

  async function confirmAppt(id: string) {
    setError(null);
    try {
      await apiClient.staff.confirmAppointment(id);
      setMessage("Appointment confirmed.");
      void refresh(tab, statusFilter);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to confirm"); }
  }

  async function doReschedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rescheduleTarget) return;
    setRescheduleError(null);
    setRescheduling(true);
    try {
      // datetime-local value is "YYYY-MM-DDTHH:mm" — convert to ISO with local timezone
      const isoString = new Date(rescheduleTime).toISOString();
      await apiClient.staff.reschedule(rescheduleTarget.appointment_id, {
        new_start_time: isoString,
        reason: rescheduleReason || undefined,
      });
      setMessage(`Appointment rescheduled to ${new Date(rescheduleTime).toLocaleString()}.`);
      setRescheduleTarget(null);
      void refresh(tab, statusFilter);
    } catch (cause) {
      setRescheduleError(
        cause instanceof Error
          ? cause.message === "TIME_SLOT_CONFLICT"
            ? "That time slot is already taken. Please choose another."
            : cause.message
          : "Rescheduling failed"
      );
    } finally {
      setRescheduling(false);
    }
  }

  async function registerWalkIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const result = await apiClient.staff.registerWalkIn({
        name: String(form.get("name") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim() || undefined,
        email: String(form.get("email") ?? "").trim() || undefined,
      });
      setMessage(`Walk-in registered (ref: ${String(result.patient_id).slice(0, 8)}…). Verification pending.`);
      (event.target as HTMLFormElement).reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Registration failed"); }
    finally { setSubmitting(false); }
  }

  // Min datetime for rescheduling (now + 15 min)
  const minRescheduleTime = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return d.toISOString().slice(0, 16);
  })();

  return (
    <main className="py-10 sm:py-14">
      <Container>
        <header className="mb-8">
          <p className="text-sm font-semibold text-primary">Receptionist workspace</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">Appointments & walk-ins</h1>
          <p className="mt-2 text-muted-foreground">
            Clinical notes are not accessible from this workspace per access policy.
          </p>
        </header>

        {error && (
          <p role="alert" className="mb-4 rounded-md border border-destructive/30 p-3 text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
            {message}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Calendar panel */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Appointment calendar</CardTitle>
                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Filter by appointment status"
                  >
                    <option value="all">All statuses</option>
                    <option value="requested">Requested</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              {/* Tabs */}
              <div
                role="tablist"
                aria-label="Calendar range"
                className="mt-3 flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit"
              >
                {(["today", "all"] as const).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "today" ? "Today" : "Next 30 days"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div aria-busy="true" className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />)}
                </div>
              ) : appointments.length === 0 ? (
                <div className="py-10 text-center" role="status">
                  <p className="text-muted-foreground">No appointments match this view.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border" aria-label="Appointment list">
                  {appointments.map((appt) => (
                    <li key={appt.appointment_id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{appt.service_name}</p>
                          <StatusBadge status={appt.status} />
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {appt.dentist_name} · {new Date(appt.start_time).toLocaleString(undefined, {
                            weekday: "short", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm font-medium">{appt.patient_name}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start pt-1">
                        {appt.status === "requested" && (
                          <Button size="sm" onClick={() => void confirmAppt(appt.appointment_id)}>
                            Confirm
                          </Button>
                        )}
                        {appt.status === "confirmed" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void updateStatus(appt.appointment_id, "completed")}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void updateStatus(appt.appointment_id, "no-show")}
                            >
                              No-show
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRescheduleTarget(appt);
                                setRescheduleTime("");
                                setRescheduleReason("");
                                setRescheduleError(null);
                              }}
                              aria-haspopup="dialog"
                            >
                              Reschedule
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Walk-in registration */}
          <Card>
            <CardHeader><CardTitle>Register walk-in</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => void registerWalkIn(e)}>
                <div>
                  <Label htmlFor="walkin-name" required>Full name</Label>
                  <Input id="walkin-name" name="name" required autoComplete="name" />
                </div>
                <div>
                  <Label htmlFor="walkin-phone">Mobile number</Label>
                  <Input id="walkin-phone" name="phone" type="tel" autoComplete="tel" />
                </div>
                <div>
                  <Label htmlFor="walkin-email">Email address</Label>
                  <Input id="walkin-email" name="email" type="email" autoComplete="email" />
                </div>
                <Button type="submit" isLoading={submitting} className="w-full">
                  Register patient
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Rescheduling dialog */}
        {rescheduleTarget && (
          <Dialog
            isOpen={!!rescheduleTarget}
            onClose={() => setRescheduleTarget(null)}
            title={`Reschedule — ${rescheduleTarget.service_name}`}
          >
            <form className="space-y-4" onSubmit={(e) => void doReschedule(e)}>
              <p className="text-sm text-muted-foreground">
                Patient: <strong>{rescheduleTarget.patient_name}</strong>
                <br />
                Current: {new Date(rescheduleTarget.start_time).toLocaleString()}
              </p>
              {rescheduleError && (
                <p role="alert" id="reschedule-error" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {rescheduleError}
                </p>
              )}
              <div>
                <Label htmlFor="new-time" required>New date and time</Label>
                <Input
                  id="new-time"
                  type="datetime-local"
                  required
                  min={minRescheduleTime}
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  aria-invalid={!!rescheduleError}
                  aria-describedby={rescheduleError ? "reschedule-error" : undefined}
                />
              </div>
              <div>
                <Label htmlFor="reschedule-reason">Reason (optional)</Label>
                <Input
                  id="reschedule-reason"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Patient request, dentist availability…"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setRescheduleTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={rescheduling}>
                  Confirm reschedule
                </Button>
              </div>
            </form>
          </Dialog>
        )}
      </Container>
    </main>
  );
}

export default function ReceptionistPage() {
  return (
    <StaffGuard roles={["receptionist"]}>
      <ReceptionWorkspace />
    </StaffGuard>
  );
}
