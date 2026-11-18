"use client";

/**
 * Dentist workspace — assigned schedule + clinical notes (FR-017, ADM-014, ADM-015, ADM-016).
 * Fetches only appointments scoped to the authenticated dentist's dentist_id.
 * Patient names come from the staff calendar endpoint; receptionist/admin notes are hidden.
 */

import * as React from "react";
import { StaffGuard } from "@/components/staff/staff-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiClient, type StaffAppointment } from "@/lib/api-client";

type Tab = "today" | "upcoming";

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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayISO(): string { return isoDate(new Date()); }
function tomorrowISO(): string {
  const d = new Date(); d.setDate(d.getDate() + 1); return isoDate(d);
}
function thirtyDaysISO(): string {
  const d = new Date(); d.setDate(d.getDate() + 30); return isoDate(d);
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLOR[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function DentistWorkspace() {
  const [tab, setTab] = React.useState<Tab>("today");
  const [appointments, setAppointments] = React.useState<StaffAppointment[]>([]);
  const [selectedAppt, setSelectedAppt] = React.useState<StaffAppointment | null>(null);
  const [records, setRecords] = React.useState<Array<{ record_id: string; clinical_notes: string; created_at: string }>>([]);
  const [note, setNote] = React.useState("");
  const [noteError, setNoteError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingNote, setSavingNote] = React.useState(false);

  const refresh = React.useCallback(async (currentTab: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const filters =
        currentTab === "today"
          ? { date_from: todayISO(), date_to: todayISO() }
          : { date_from: tomorrowISO(), date_to: thirtyDaysISO() };
      const result = await apiClient.staff.calendar(filters);
      setAppointments(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load assigned appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(tab); }, [refresh, tab]);

  async function openPatient(appt: StaffAppointment) {
    setNoteError(null);
    setNote("");
    setSelectedAppt(appt);
    try {
      setRecords(await apiClient.staff.patientRecords(appt.patient_id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load patient records");
    }
  }

  async function saveNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAppt || !note.trim()) return;
    setNoteError(null);
    setSavingNote(true);
    try {
      await apiClient.staff.addClinicalRecord(selectedAppt.patient_id, note.trim());
      setNote("");
      setRecords(await apiClient.staff.patientRecords(selectedAppt.patient_id));
    } catch (cause) {
      setNoteError(cause instanceof Error ? cause.message : "Unable to save clinical note");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <main className="py-10 sm:py-14">
      <Container>
        <header className="mb-8">
          <p className="text-sm font-semibold text-primary">Dentist workspace</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">Appointment schedule</h1>
          <p className="mt-2 text-muted-foreground">Only appointments assigned to your account are shown.</p>
        </header>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Schedule view"
          className="mb-6 flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit"
        >
          {(["today", "upcoming"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-md px-5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "today" ? "Today" : "Next 30 days"}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-md border border-destructive/30 p-3 text-destructive">
            {error}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{tab === "today" ? "Today's appointments" : "Upcoming appointments"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div aria-busy="true" className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center" role="status">
                <p className="text-lg font-medium text-muted-foreground">No appointments in this view</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tab === "today" ? "No scheduled appointments for today." : "Nothing scheduled in the next 30 days."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border" aria-label="Appointment list">
                {appointments.map((appt) => (
                  <li
                    key={appt.appointment_id}
                    className={`grid gap-3 py-4 sm:grid-cols-[1fr_auto] ${
                      selectedAppt?.appointment_id === appt.appointment_id ? "bg-primary/5 -mx-4 px-4 rounded-md" : ""
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{appt.service_name}</p>
                        <AppointmentStatusBadge status={appt.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {new Date(appt.start_time).toLocaleString(undefined, {
                          weekday: "short", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                        {" – "}
                        {new Date(appt.end_time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="mt-0.5 text-sm font-medium">{appt.patient_name}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start pt-1">
                      {appt.status !== "cancelled" && appt.status !== "completed" && (
                        <Button
                          size="sm"
                          variant={selectedAppt?.appointment_id === appt.appointment_id ? "primary" : "outline"}
                          onClick={() => void openPatient(appt)}
                          aria-expanded={selectedAppt?.appointment_id === appt.appointment_id}
                          aria-controls={`records-${appt.appointment_id}`}
                        >
                          {selectedAppt?.appointment_id === appt.appointment_id ? "Close record" : "Open record"}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Clinical notes panel */}
        {selectedAppt && (
          <section
            id={`records-${selectedAppt.appointment_id}`}
            aria-label={`Clinical record for ${selectedAppt.patient_name}`}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Clinical record — {selectedAppt.service_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Patient: <strong>{selectedAppt.patient_name}</strong>
                  {" · "}
                  {new Date(selectedAppt.start_time).toLocaleDateString()}
                </p>

                {records.length === 0 ? (
                  <p className="text-muted-foreground">No clinical notes recorded yet.</p>
                ) : (
                  <ul className="mb-5 space-y-3" aria-label="Clinical notes">
                    {records.map((r) => (
                      <li key={r.record_id} className="rounded-md border border-border p-3">
                        <p className="text-sm">{r.clinical_notes}</p>
                        <time className="mt-2 block text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}

                <form className="space-y-3" onSubmit={(e) => void saveNote(e)} aria-label="Add clinical note">
                  {noteError && (
                    <p role="alert" className="text-sm text-destructive">
                      {noteError}
                    </p>
                  )}
                  <div>
                    <label htmlFor="clinical-note" className="block text-sm font-medium">
                      Add clinical note
                    </label>
                    <textarea
                      id="clinical-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      required
                      rows={4}
                      aria-describedby={noteError ? "note-error" : undefined}
                      aria-invalid={!!noteError}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <Button type="submit" isLoading={savingNote}>
                    Save note
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        )}
      </Container>
    </main>
  );
}

export default function DentistPage() {
  return (
    <StaffGuard roles={["dentist"]}>
      <DentistWorkspace />
    </StaffGuard>
  );
}
