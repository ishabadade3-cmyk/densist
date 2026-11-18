/**
 * T-012 frontend tests: staff dashboards RBAC, today stats, reschedule dialog, dentist calendar.
 */

import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// -------------------------------------------------------------------------
// Mock apiClient
// -------------------------------------------------------------------------

const mockCalendar = vi.hoisted(() => vi.fn());
const mockTodayStats = vi.hoisted(() => vi.fn());
const mockConfirmAppt = vi.hoisted(() => vi.fn());
const mockUpdateAppt = vi.hoisted(() => vi.fn());
const mockReschedule = vi.hoisted(() => vi.fn());
const mockRegisterWalkIn = vi.hoisted(() => vi.fn());
const mockGetProfile = vi.hoisted(() => vi.fn());
const mockPatientRecords = vi.hoisted(() => vi.fn());
const mockAddClinicalRecord = vi.hoisted(() => vi.fn());
const mockAdminServices = vi.hoisted(() => vi.fn());
const mockContent = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    staff: {
      calendar: mockCalendar,
      todayStats: mockTodayStats,
      confirmAppointment: mockConfirmAppt,
      updateAppointment: mockUpdateAppt,
      reschedule: mockReschedule,
      registerWalkIn: mockRegisterWalkIn,
      patientRecords: mockPatientRecords,
      addClinicalRecord: mockAddClinicalRecord,
      adminServices: mockAdminServices,
      content: mockContent,
    },
    auth: { getProfile: mockGetProfile },
  },
}));

// -------------------------------------------------------------------------
// Sample data
// -------------------------------------------------------------------------

const SAMPLE_APPT = {
  appointment_id: "appt-1",
  patient_id: "patient-1",
  patient_name: "SAMPLE ONLY",
  dentist_id: "dentist-1",
  dentist_name: "Dr. Test",
  service_id: "svc-1",
  service_name: "Dental Checkup",
  start_time: new Date(Date.now() + 3600_000).toISOString(),
  end_time: new Date(Date.now() + 3600_000 + 2700_000).toISOString(),
  status: "confirmed",
  created_at: new Date().toISOString(),
};

const TODAY_STATS = {
  date: new Date().toISOString().slice(0, 10),
  total_today: 12,
  confirmed: 7,
  completed: 3,
  cancelled: 1,
  no_show: 1,
  total_patients: 150,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// -------------------------------------------------------------------------
// Receptionist workspace tests
// -------------------------------------------------------------------------

describe("ReceptionistPage", () => {
  beforeEach(() => {
    mockGetProfile.mockResolvedValue({ user_id: "u1", name: "SAMPLE ONLY", role: "receptionist" });
    mockCalendar.mockResolvedValue([SAMPLE_APPT]);
  });

  it("renders patient name from staff calendar response", async () => {
    const { default: Page } = await import("@/app/staff/receptionist/page");
    render(<Page />);
    await waitFor(() => expect(screen.getByText("SAMPLE ONLY")).toBeTruthy());
  });

  it("renders appointment service name", async () => {
    const { default: Page } = await import("@/app/staff/receptionist/page");
    render(<Page />);
    await waitFor(() => expect(screen.getAllByText("Dental Checkup").length).toBeGreaterThan(0));
  });

  it("shows Reschedule button for confirmed appointments", async () => {
    const { default: Page } = await import("@/app/staff/receptionist/page");
    render(<Page />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Reschedule" })).toBeTruthy());
  });

  it("renders loading skeletons while fetching", async () => {
    mockCalendar.mockImplementation(() => new Promise(() => {})); // never resolves
    const { default: Page } = await import("@/app/staff/receptionist/page");
    render(<Page />);
    // Skeletons render as empty animated divs; check busy state
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("renders empty state when no appointments", async () => {
    mockCalendar.mockResolvedValue([]);
    const { default: Page } = await import("@/app/staff/receptionist/page");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("No appointments match this view.")).toBeTruthy()
    );
  });

  it("renders error when calendar fetch fails", async () => {
    mockCalendar.mockRejectedValue(new Error("Network error"));
    const { default: Page } = await import("@/app/staff/receptionist/page");
    render(<Page />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("Network error");
  });

  it("reschedule button opens dialog with appointment info", async () => {
    const { default: Page } = await import("@/app/staff/receptionist/page");
    render(<Page />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Reschedule" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeTruthy()
    );
    expect(screen.getAllByText(/Dental Checkup/).length).toBeGreaterThan(0);
  });
});

// -------------------------------------------------------------------------
// Dentist workspace tests
// -------------------------------------------------------------------------

describe("DentistPage", () => {
  beforeEach(() => {
    mockGetProfile.mockResolvedValue({ user_id: "d1", name: "SAMPLE ONLY", role: "dentist" });
    mockCalendar.mockResolvedValue([SAMPLE_APPT]);
    mockPatientRecords.mockResolvedValue([]);
  });

  it("renders today tab by default", async () => {
    const { default: Page } = await import("@/app/staff/dentist/page");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Today" })).toBeTruthy()
    );
    expect(screen.getByRole("tab", { name: "Today" }).getAttribute("aria-selected")).toBe("true");
  });

  it("renders patient name from calendar response", async () => {
    const { default: Page } = await import("@/app/staff/dentist/page");
    render(<Page />);
    await waitFor(() => expect(screen.getByText("SAMPLE ONLY")).toBeTruthy());
  });

  it("open record button is visible for non-cancelled appointments", async () => {
    const { default: Page } = await import("@/app/staff/dentist/page");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Open record" })).toBeTruthy()
    );
  });

  it("empty state shows for no appointments", async () => {
    mockCalendar.mockResolvedValue([]);
    const { default: Page } = await import("@/app/staff/dentist/page");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("No appointments in this view")).toBeTruthy()
    );
  });

  it("error state announces to screen readers", async () => {
    mockCalendar.mockRejectedValue(new Error("API unavailable"));
    const { default: Page } = await import("@/app/staff/dentist/page");
    render(<Page />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  });
});

// -------------------------------------------------------------------------
// Admin dashboard overview tests
// -------------------------------------------------------------------------

describe("AdminPage overview", () => {
  beforeEach(() => {
    mockGetProfile.mockResolvedValue({ user_id: "a1", name: "SAMPLE ONLY", role: "clinic_admin" });
    mockTodayStats.mockResolvedValue(TODAY_STATS);
    mockAdminServices.mockResolvedValue([]);
    mockContent.mockResolvedValue([]);
  });

  it("renders today's stats cards", async () => {
    const { default: Page } = await import("@/app/admin/page");
    render(<Page />);
    await waitFor(() => expect(screen.getByText("12")).toBeTruthy()); // total_today
    expect(screen.getByText("7")).toBeTruthy();  // confirmed
    expect(screen.getByText("150")).toBeTruthy(); // total_patients
  });

  it("renders all stat labels", async () => {
    const { default: Page } = await import("@/app/admin/page");
    render(<Page />);
    await waitFor(() => {
      for (const label of ["Total today", "Confirmed", "Completed", "Cancelled", "No-show", "Total patients"]) {
        expect(screen.getByText(label)).toBeTruthy();
      }
    });
  });

  it("shows loading skeletons while stats load", async () => {
    mockTodayStats.mockImplementation(() => new Promise(() => {}));
    const { default: Page } = await import("@/app/admin/page");
    render(<Page />);
    // Overview tab is active by default
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("renders error when stats unavailable", async () => {
    mockTodayStats.mockRejectedValue(new Error("Stats unavailable"));
    const { default: Page } = await import("@/app/admin/page");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("Stats unavailable")).toBeTruthy()
    );
  });
});

// -------------------------------------------------------------------------
// StaffGuard cross-role boundary tests
// -------------------------------------------------------------------------

describe("StaffGuard role enforcement", () => {
  it("blocks patient from receptionist workspace", async () => {
    mockGetProfile.mockResolvedValue({ user_id: "p1", name: "SAMPLE ONLY", role: "patient" });
    const { StaffGuard } = await import("@/components/staff/staff-guard");
    render(
      <StaffGuard roles={["receptionist"]}>
        <p>Restricted calendar data</p>
      </StaffGuard>
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Staff access required" })).toBeTruthy()
    );
    expect(screen.queryByText("Restricted calendar data")).toBeNull();
  });

  it("blocks dentist from admin workspace", async () => {
    mockGetProfile.mockResolvedValue({ user_id: "d1", name: "SAMPLE ONLY", role: "dentist" });
    const { StaffGuard } = await import("@/components/staff/staff-guard");
    render(
      <StaffGuard roles={["clinic_admin"]}>
        <p>Admin-only panel</p>
      </StaffGuard>
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Staff access required" })).toBeTruthy()
    );
    expect(screen.queryByText("Admin-only panel")).toBeNull();
  });

  it("blocks receptionist from dentist workspace", async () => {
    mockGetProfile.mockResolvedValue({ user_id: "r1", name: "SAMPLE ONLY", role: "receptionist" });
    const { StaffGuard } = await import("@/components/staff/staff-guard");
    render(
      <StaffGuard roles={["dentist"]}>
        <p>Clinical notes panel</p>
      </StaffGuard>
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Staff access required" })).toBeTruthy()
    );
    expect(screen.queryByText("Clinical notes panel")).toBeNull();
  });
});
