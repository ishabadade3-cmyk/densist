/**
 * Fully typed API client generated from the backend OpenAPI schema.
 * Source: apps/web/lib/api-schema.ts
 *
 * Invariant: Zero hand-typed URL strings across components.
 */

import type { components } from "./api-schema";

export type ServiceOut = components["schemas"]["ServiceOut"];
export type DentistOut = components["schemas"]["DentistOut"];
export type SlotOut = components["schemas"]["SlotOut"];
export type BookingIn = components["schemas"]["BookingIn"];
export type AppointmentOut = components["schemas"]["AppointmentOut"];
export type AppointmentPatchIn = components["schemas"]["AppointmentPatchIn"];
export type PatientProfileOut = components["schemas"]["PatientProfileOut"];
export type PatientProfileUpdateIn = components["schemas"]["PatientProfileUpdateIn"];
export type DocumentOut = components["schemas"]["DocumentOut"];
export type InvoiceOut = components["schemas"]["InvoiceOut"];
export type PaymentOut = components["schemas"]["PaymentOut"];
export type OTPRequestIn = components["schemas"]["OTPRequestIn"];
export type OTPResponseOut = components["schemas"]["OTPResponseOut"];
export type LoginIn = components["schemas"]["LoginIn"] & { totp_code?: string | null };
export type OTPVerifyIn = components["schemas"]["OTPVerifyIn"];

export type StaffRole = "receptionist" | "dentist" | "clinic_admin" | "system_admin";
export type StaffProfile = { user_id: string; name: string; role: StaffRole };
export type StaffAppointment = {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  dentist_id: string;
  dentist_name: string;
  service_id: string;
  service_name: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
};
export type AdminService = {
  service_id: string;
  service_name: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  duration_minutes: number | null;
  active: boolean;
};
export type AdminContent = {
  content_id: string;
  slug: string;
  title: string;
  body: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
};
export type AggregateReport = {
  date_from: string;
  date_to: string;
  aggregate_by: "day" | "status";
  appointment_count: number;
  buckets: Array<{ key: string; count: number }>;
};

export type TodayStats = {
  date: string;
  total_today: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  total_patients: number;
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message || code);
    this.name = "ApiError";
  }
}

let cachedCsrfToken: string | null = null;

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (cachedCsrfToken && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", cachedCsrfToken);
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    try {
      const errorJson = await response.json();
      errorCode = errorJson.detail || errorJson.message || `HTTP_${response.status}`;
    } catch {
      errorCode = `HTTP_${response.status}`;
    }
    throw new ApiError(response.status, errorCode);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  // Services
  services: {
    list: async (): Promise<ServiceOut[]> => {
      return request<ServiceOut[]>("/api/v1/services");
    },
  },

  // Dentists
  dentists: {
    list: async (serviceId?: string): Promise<DentistOut[]> => {
      const q = serviceId ? `?service_id=${encodeURIComponent(serviceId)}` : "";
      return request<DentistOut[]>(`/api/v1/dentists${q}`);
    },
  },

  // Availability
  availability: {
    get: async (params: {
      service_id: string;
      date?: string;
      dentist_id?: string;
    }): Promise<SlotOut[]> => {
      const search = new URLSearchParams();
      search.set("service_id", params.service_id);
      if (params.date) search.set("date", params.date);
      if (params.dentist_id) search.set("dentist_id", params.dentist_id);
      return request<SlotOut[]>(`/api/v1/availability?${search.toString()}`);
    },
  },

  // Appointments
  appointments: {
    create: async (payload: BookingIn): Promise<AppointmentOut> => {
      return request<AppointmentOut>("/api/v1/appointments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    list: async (filters?: { date_from?: string; date_to?: string; status?: string }): Promise<AppointmentOut[]> => {
      const query = new URLSearchParams();
      if (filters?.date_from) query.set("date_from", filters.date_from);
      if (filters?.date_to) query.set("date_to", filters.date_to);
      if (filters?.status) query.set("status", filters.status);
      const suffix = query.size ? `?${query.toString()}` : "";
      return request<AppointmentOut[]>(`/api/v1/appointments${suffix}`);
    },
    get: async (appointmentId: string): Promise<AppointmentOut> => {
      return request<AppointmentOut>(`/api/v1/appointments/${appointmentId}`);
    },
    patch: async (
      appointmentId: string,
      payload: AppointmentPatchIn
    ): Promise<AppointmentOut> => {
      return request<AppointmentOut>(`/api/v1/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    cancel: async (
      appointmentId: string,
      reason?: string
    ): Promise<AppointmentOut> => {
      return request<AppointmentOut>(`/api/v1/appointments/${appointmentId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancellation_reason: reason || "Patient requested cancellation" }),
      });
    },
  },

  // Patient Profile & Records
  patient: {
    getProfile: async (): Promise<PatientProfileOut> => {
      return request<PatientProfileOut>("/api/v1/patients/me");
    },
    updateProfile: async (
      payload: PatientProfileUpdateIn
    ): Promise<PatientProfileOut> => {
      return request<PatientProfileOut>("/api/v1/patients/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    getDocuments: async (): Promise<DocumentOut[]> => {
      return request<DocumentOut[]>("/api/v1/patients/me/documents");
    },
    getInvoices: async (): Promise<InvoiceOut[]> => {
      return request<InvoiceOut[]>("/api/v1/invoices");
    },
    getPayments: async (): Promise<PaymentOut[]> => {
      return request<PaymentOut[]>("/api/v1/payments");
    },
  },

  // Authentication & Verification
  auth: {
    getProfile: async (): Promise<StaffProfile> => request<StaffProfile>("/api/v1/auth/profile"),
    enrollMfa: async (): Promise<{ shared_secret: string; provisioning_uri: string }> =>
      request("/api/v1/auth/mfa/enroll", { method: "POST" }),
    verifyMfa: async (code: string): Promise<{ authenticated: boolean; role?: string; csrf_token?: string }> => {
      const result = await request<{ authenticated: boolean; role?: string; csrf_token?: string }>("/api/v1/auth/mfa/verify", {
        method: "POST", body: JSON.stringify({ code }),
      });
      if (result.csrf_token) cachedCsrfToken = result.csrf_token;
      return result;
    },
    sendOtp: async (payload: OTPRequestIn): Promise<OTPResponseOut> => {
      return request<OTPResponseOut>("/api/v1/auth/otp/send", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    verifyOtp: async (
      payload: OTPVerifyIn
    ): Promise<{ authenticated: boolean; user_id?: string; role?: string; csrf_token?: string }> => {
      const res = await request<{
        authenticated: boolean;
        user_id?: string;
        role?: string;
        csrf_token?: string;
      }>("/api/v1/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.csrf_token) {
        cachedCsrfToken = res.csrf_token;
      }
      return res;
    },
    login: async (
      payload: LoginIn
    ): Promise<{ authenticated: boolean; mfa_required?: boolean; mfa_setup_required?: boolean; user_id?: string; role?: string; csrf_token?: string }> => {
      const res = await request<{
        authenticated: boolean;
        mfa_required?: boolean;
        mfa_setup_required?: boolean;
        user_id?: string;
        role?: string;
        csrf_token?: string;
      }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.csrf_token) {
        cachedCsrfToken = res.csrf_token;
      }
      return res;
    },
    logout: async (): Promise<void> => {
      await request<void>("/api/v1/auth/logout", {
        method: "POST",
      });
      cachedCsrfToken = null;
    },
    getConsents: async (): Promise<Array<{ consent_id: string; purpose: string; channel: string | null; status: string; recorded_at: string }>> => {
      return request<Array<{ consent_id: string; purpose: string; channel: string | null; status: string; recorded_at: string }>>("/api/v1/auth/consents");
    },
    updateConsent: async (
      purpose: string,
      status: string,
      channel?: "email" | "sms" | "whatsapp"
    ): Promise<{ consent_id: string; status: string }> => {
      return request<{ consent_id: string; status: string }>(`/api/v1/auth/consents/${encodeURIComponent(purpose)}`, {
        method: "PUT",
        body: JSON.stringify({ status, channel }),
      });
    },
  },

  staff: {
    calendar: async (filters?: { date_from?: string; date_to?: string; status?: string }): Promise<StaffAppointment[]> => {
      const query = new URLSearchParams();
      if (filters?.date_from) query.set("date_from", filters.date_from);
      if (filters?.date_to) query.set("date_to", filters.date_to);
      if (filters?.status) query.set("status", filters.status);
      const suffix = query.size ? `?${query.toString()}` : "";
      return request<StaffAppointment[]>(`/api/v1/staff/calendar${suffix}`);
    },
    staffCalendar: async (filters?: { date_from?: string; date_to?: string; status?: string; dentist_id?: string }): Promise<StaffAppointment[]> => {
      const query = new URLSearchParams();
      if (filters?.date_from) query.set("date_from", filters.date_from);
      if (filters?.date_to) query.set("date_to", filters.date_to);
      if (filters?.status) query.set("status", filters.status);
      if (filters?.dentist_id) query.set("dentist_id", filters.dentist_id);
      const suffix = query.size ? `?${query.toString()}` : "";
      return request<StaffAppointment[]>(`/api/v1/staff/calendar${suffix}`);
    },
    reschedule: async (id: string, payload: { new_start_time: string; new_dentist_id?: string; reason?: string }): Promise<StaffAppointment> =>
      request(`/api/v1/appointments/${encodeURIComponent(id)}/reschedule`, { method: "POST", body: JSON.stringify(payload) }),
    todayStats: async (): Promise<TodayStats> => request("/api/v1/admin/stats/today"),
    registerWalkIn: async (payload: { name: string; phone?: string; email?: string; date_of_birth?: string }): Promise<{ patient_id: string; user_id: string; status: string }> =>
      request("/api/v1/patients", { method: "POST", body: JSON.stringify(payload) }),
    patientRecords: async (patientId: string): Promise<Array<{ record_id: string; clinical_notes: string; created_at: string }>> =>
      request(`/api/v1/patients/${encodeURIComponent(patientId)}/records`),
    addClinicalRecord: async (patientId: string, clinical_notes: string): Promise<{ record_id: string; created_at: string }> =>
      request(`/api/v1/patients/${encodeURIComponent(patientId)}/records`, { method: "POST", body: JSON.stringify({ clinical_notes }) }),
    updateAppointment: async (id: string, status: string): Promise<AppointmentOut> =>
      request(`/api/v1/appointments/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    confirmAppointment: async (id: string): Promise<AppointmentOut> =>
      request(`/api/v1/appointments/${encodeURIComponent(id)}/confirm`, { method: "POST", body: JSON.stringify({ status: "confirmed" }) }),
    adminServices: async (): Promise<AdminService[]> => request("/api/v1/admin/services"),
    createService: async (payload: Omit<AdminService, "service_id">): Promise<AdminService> =>
      request("/api/v1/admin/services", { method: "POST", body: JSON.stringify(payload) }),
    updateService: async (id: string, payload: Partial<Omit<AdminService, "service_id">>): Promise<AdminService> =>
      request(`/api/v1/admin/services/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
    reports: async (params: { date_from: string; date_to: string; aggregate_by: "day" | "status" }): Promise<AggregateReport> => {
      const query = new URLSearchParams(params);
      return request<AggregateReport>(`/api/v1/admin/reports?${query.toString()}`);
    },
    content: async (): Promise<AdminContent[]> => request("/api/v1/admin/content"),
    createContent: async (payload: Pick<AdminContent, "slug" | "title" | "body" | "status">): Promise<AdminContent> =>
      request("/api/v1/admin/content", { method: "POST", body: JSON.stringify(payload) }),
    updateContent: async (slug: string, payload: Partial<Pick<AdminContent, "title" | "body" | "status">>): Promise<AdminContent> =>
      request(`/api/v1/admin/content/${encodeURIComponent(slug)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  },
};
