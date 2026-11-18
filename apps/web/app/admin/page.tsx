"use client";

/**
 * Clinic administrator workspace (ADM-001, ADM-003–ADM-005, ADM-008, ADM-012).
 * - Today's operational statistics cards (ADM-001).
 * - Service catalogue management (ADM-005).
 * - Aggregate appointment reports (ADM-012).
 * - Website content (ADM-008).
 */

import * as React from "react";
import { StaffGuard } from "@/components/staff/staff-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input, Label } from "@/components/ui/form-fields";
import {
  apiClient,
  type AdminContent,
  type AdminService,
  type AggregateReport,
  type TodayStats,
} from "@/lib/api-client";

function monthStart(): string {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
}
function todayISO(): string { return new Date().toISOString().slice(0, 10); }

type AdminTab = "overview" | "services" | "content" | "reports";

interface StatCardProps {
  label: string;
  value: number | string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

function StatCard({ label, value, description, variant = "default" }: StatCardProps) {
  const accent: Record<string, string> = {
    default: "text-foreground",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-bold tabular-nums ${accent[variant]}`}>{value}</p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function AdminWorkspace() {
  const [activeTab, setActiveTab] = React.useState<AdminTab>("overview");
  const [todayStats, setTodayStats] = React.useState<TodayStats | null>(null);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  const [services, setServices] = React.useState<AdminService[]>([]);
  const [content, setContent] = React.useState<AdminContent[]>([]);
  const [report, setReport] = React.useState<AggregateReport | null>(null);
  const [dateFrom, setDateFrom] = React.useState(monthStart);
  const [dateTo, setDateTo] = React.useState(todayISO);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [loadingData, setLoadingData] = React.useState(false);

  // Load today's stats on mount.
  React.useEffect(() => {
    apiClient.staff.todayStats()
      .then(setTodayStats)
      .catch((cause: unknown) => setStatsError(cause instanceof Error ? cause.message : "Unable to load stats"));
  }, []);

  // Load services + content when those tabs are activated.
  async function loadServicesAndContent() {
    if (services.length > 0 || content.length > 0) return;
    setLoadingData(true);
    setError(null);
    try {
      const [svc, cnt] = await Promise.all([apiClient.staff.adminServices(), apiClient.staff.content()]);
      setServices(svc);
      setContent(cnt);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load data"); }
    finally { setLoadingData(false); }
  }

  React.useEffect(() => {
    if (activeTab === "services" || activeTab === "content") {
      void loadServicesAndContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function addService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError(null);
    try {
      const min = String(form.get("price_min") ?? "");
      const max = String(form.get("price_max") ?? "");
      const duration = String(form.get("duration_minutes") ?? "");
      const saved = await apiClient.staff.createService({
        service_name: String(form.get("service_name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim() || null,
        price_min: min ? Number(min) : null,
        price_max: max ? Number(max) : null,
        duration_minutes: duration ? Number(duration) : null,
        active: true,
      });
      setServices((cur) => [...cur, saved].sort((a, b) => a.service_name.localeCompare(b.service_name)));
      setMessage("Service saved.");
      formElement.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save service"); }
  }

  async function editService(event: React.FormEvent<HTMLFormElement>, service: AdminService) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    try {
      const min = String(form.get("price_min") ?? "");
      const max = String(form.get("price_max") ?? "");
      const duration = String(form.get("duration_minutes") ?? "");
      const saved = await apiClient.staff.updateService(service.service_id, {
        service_name: String(form.get("service_name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim() || null,
        price_min: min ? Number(min) : null,
        price_max: max ? Number(max) : null,
        duration_minutes: duration ? Number(duration) : null,
      });
      setServices((cur) => cur.map((r) => r.service_id === saved.service_id ? saved : r));
      setMessage("Service updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update service"); }
  }

  async function toggleServiceActive(service: AdminService) {
    setError(null);
    try {
      const saved = await apiClient.staff.updateService(service.service_id, { active: !service.active });
      setServices((cur) => cur.map((r) => r.service_id === saved.service_id ? saved : r));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update service"); }
  }

  async function addContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError(null);
    try {
      const saved = await apiClient.staff.createContent({
        slug: String(form.get("slug") ?? "").trim(),
        title: String(form.get("title") ?? "").trim(),
        body: String(form.get("body") ?? "").trim(),
        status: "draft",
      });
      setContent((cur) => [...cur, saved].sort((a, b) => a.slug.localeCompare(b.slug)));
      setMessage("Draft saved. Review before publishing.");
      formElement.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save content"); }
  }

  async function setPublished(item: AdminContent, status: AdminContent["status"]) {
    setError(null);
    try {
      const saved = await apiClient.staff.updateContent(item.slug, { status });
      setContent((cur) => cur.map((r) => r.content_id === item.content_id ? saved : r));
      setMessage(status === "published" ? "Content published." : "Returned to draft.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update content"); }
  }

  async function editContent(event: React.FormEvent<HTMLFormElement>, item: AdminContent) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    try {
      const saved = await apiClient.staff.updateContent(item.slug, {
        title: String(form.get("title") ?? "").trim(),
        body: String(form.get("body") ?? "").trim(),
      });
      setContent((cur) => cur.map((r) => r.content_id === saved.content_id ? saved : r));
      setMessage("Content updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update content"); }
  }

  async function loadReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      setReport(await apiClient.staff.reports({ date_from: dateFrom, date_to: dateTo, aggregate_by: "day" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load report"); }
  }

  const TABS: { key: AdminTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "services", label: "Services" },
    { key: "content", label: "Content" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <main className="py-10 sm:py-14">
      <Container>
        <header className="mb-8">
          <p className="text-sm font-semibold text-primary">Clinic administration</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">Admin dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage services, content and view aggregate reports.</p>
        </header>

        {/* Nav tabs */}
        <div
          role="tablist"
          aria-label="Admin sections"
          className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border bg-muted p-1 w-fit"
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              id={`tab-${key}`}
              aria-selected={activeTab === key}
              aria-controls={`panel-${key}`}
              onClick={() => setActiveTab(key)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-md border border-destructive/30 p-3 text-destructive">{error}</p>
        )}
        {message && (
          <p role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{message}</p>
        )}

        {/* Overview panel */}
        {activeTab === "overview" && (
          <section id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
            {statsError ? (
              <p role="alert" className="mb-6 text-destructive">{statsError}</p>
            ) : !todayStats ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-semibold">Today — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" role="list" aria-label="Today's statistics">
                  <StatCard label="Total today" value={todayStats.total_today} />
                  <StatCard label="Confirmed" value={todayStats.confirmed} variant="success" />
                  <StatCard label="Completed" value={todayStats.completed} variant="success" />
                  <StatCard label="Cancelled" value={todayStats.cancelled} variant="danger" description="Today" />
                  <StatCard label="No-show" value={todayStats.no_show} variant="warning" />
                  <StatCard label="Total patients" value={todayStats.total_patients} description="All time" />
                </div>
              </>
            )}
          </section>
        )}

        {/* Services panel */}
        {activeTab === "services" && (
          <section id="panel-services" role="tabpanel" aria-labelledby="tab-services">
            {loadingData ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />)}</div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Service catalogue</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <ul className="divide-y divide-border">
                      {services.length === 0 && <li className="py-3 text-muted-foreground">No services configured.</li>}
                      {services.map((service) => (
                        <li key={service.service_id} className="flex items-start justify-between gap-3 py-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{service.service_name}</p>
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${service.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                                {service.active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {service.duration_minutes ?? "—"} min
                              {service.price_min != null ? ` · ₹${service.price_min}${service.price_max ? `–${service.price_max}` : "+"}` : ""}
                            </p>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-primary">Edit</summary>
                              <form className="mt-3 grid gap-3" onSubmit={(e) => void editService(e, service)}>
                                <div><Label htmlFor={`en-${service.service_id}`} required>Name</Label><Input id={`en-${service.service_id}`} name="service_name" required defaultValue={service.service_name} /></div>
                                <div><Label htmlFor={`ed-${service.service_id}`}>Description</Label><Input id={`ed-${service.service_id}`} name="description" defaultValue={service.description ?? ""} /></div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div><Label htmlFor={`emin-${service.service_id}`}>Min ₹</Label><Input id={`emin-${service.service_id}`} name="price_min" type="number" min="0" step="0.01" defaultValue={service.price_min ?? ""} /></div>
                                  <div><Label htmlFor={`emax-${service.service_id}`}>Max ₹</Label><Input id={`emax-${service.service_id}`} name="price_max" type="number" min="0" step="0.01" defaultValue={service.price_max ?? ""} /></div>
                                  <div><Label htmlFor={`edur-${service.service_id}`}>Min</Label><Input id={`edur-${service.service_id}`} name="duration_minutes" type="number" min="1" defaultValue={service.duration_minutes ?? ""} /></div>
                                </div>
                                <Button type="submit" size="sm">Save</Button>
                              </form>
                            </details>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => void toggleServiceActive(service)}>
                            {service.active ? "Deactivate" : "Activate"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <form className="space-y-3 border-t border-border pt-5" onSubmit={(e) => void addService(e)}>
                      <h2 className="font-semibold">Add service</h2>
                      <div><Label htmlFor="service-name" required>Name</Label><Input id="service-name" name="service_name" required /></div>
                      <div><Label htmlFor="service-description">Description</Label><Input id="service-description" name="description" /></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><Label htmlFor="service-min">Min ₹</Label><Input id="service-min" name="price_min" type="number" min="0" step="0.01" /></div>
                        <div><Label htmlFor="service-max">Max ₹</Label><Input id="service-max" name="price_max" type="number" min="0" step="0.01" /></div>
                        <div><Label htmlFor="service-duration">Min</Label><Input id="service-duration" name="duration_minutes" type="number" min="1" /></div>
                      </div>
                      <Button type="submit">Add service</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        )}

        {/* Content panel */}
        {activeTab === "content" && (
          <section id="panel-content" role="tabpanel" aria-labelledby="tab-content">
            {loadingData ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />)}</div>
            ) : (
              <Card>
                <CardHeader><CardTitle>Website content</CardTitle></CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-2">
                  <ul className="divide-y divide-border">
                    {content.length === 0 && <li className="py-3 text-muted-foreground">No content records.</li>}
                    {content.map((item) => (
                      <li key={item.content_id} className="flex items-start justify-between gap-4 py-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">/{item.slug} · {item.status}</p>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-primary">Edit</summary>
                            <form className="mt-3 space-y-3" onSubmit={(e) => void editContent(e, item)}>
                              <div><Label htmlFor={`ct-${item.content_id}`} required>Title</Label><Input id={`ct-${item.content_id}`} name="title" required defaultValue={item.title} /></div>
                              <div><Label htmlFor={`cb-${item.content_id}`} required>Body</Label><textarea id={`cb-${item.content_id}`} name="body" required rows={5} defaultValue={item.body} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                              <Button type="submit" size="sm">Save changes</Button>
                            </form>
                          </details>
                        </div>
                        {item.status === "published"
                          ? <Button variant="outline" size="sm" onClick={() => void setPublished(item, "draft")}>Unpublish</Button>
                          : <Button variant="outline" size="sm" onClick={() => void setPublished(item, "published")}>Publish</Button>}
                      </li>
                    ))}
                  </ul>
                  <form className="space-y-3" onSubmit={(e) => void addContent(e)}>
                    <h2 className="font-semibold">Create draft</h2>
                    <div><Label htmlFor="content-slug" required>Slug</Label><Input id="content-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></div>
                    <div><Label htmlFor="content-title" required>Title</Label><Input id="content-title" name="title" required /></div>
                    <div><Label htmlFor="content-body" required>Body</Label><textarea id="content-body" name="body" required rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
                    <Button type="submit">Save draft</Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Reports panel */}
        {activeTab === "reports" && (
          <section id="panel-reports" role="tabpanel" aria-labelledby="tab-reports">
            <Card>
              <CardHeader><CardTitle>Aggregate appointment report</CardTitle></CardHeader>
              <CardContent>
                <form className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => void loadReport(e)}>
                  <div><Label htmlFor="report-from" required>From</Label><Input id="report-from" type="date" required value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
                  <div><Label htmlFor="report-to" required>To</Label><Input id="report-to" type="date" required value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
                  <Button type="submit">Load report</Button>
                </form>
                {report && (
                  <div aria-live="polite">
                    <p className="text-2xl font-semibold tabular-nums">{report.appointment_count} appointments</p>
                    <p className="mb-3 text-sm text-muted-foreground">{report.date_from} → {report.date_to}</p>
                    <ul className="mt-3 divide-y divide-border">
                      {report.buckets.map((bucket) => (
                        <li key={bucket.key} className="flex justify-between py-2">
                          <span>{bucket.key}</span>
                          <span className="font-semibold tabular-nums">{bucket.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </Container>
    </main>
  );
}

export default function AdminPage() {
  return (
    <StaffGuard roles={["clinic_admin"]}>
      <AdminWorkspace />
    </StaffGuard>
  );
}
