import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import BookingWizardPage from "./book/page";
import PortalLayout from "./portal/layout";
import PortalDashboardPage from "./portal/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/portal",
}));

// Mock the typed api-client
vi.mock("@/lib/api-client", () => {
  return {
    apiClient: {
      services: {
        list: vi.fn().mockResolvedValue([
          {
            service_id: "11111111-1111-1111-1111-111111111111",
            service_name: "Root Canal Treatment",
            duration_minutes: 60,
            price_min: 4500,
            price_max: 7500,
            active: true,
          },
        ]),
      },
      dentists: {
        list: vi.fn().mockResolvedValue([
          {
            dentist_id: "22222222-2222-2222-2222-222222222222",
            user_id: "33333333-3333-3333-3333-333333333333",
            name: "Dr. Aisha Sharma",
            qualification: "BDS, MDS",
            specialization: "Prosthodontics",
            experience_years: 12,
            active: true,
          },
        ]),
      },
      availability: {
        get: vi.fn().mockResolvedValue([]),
      },
      appointments: {
        list: vi.fn().mockResolvedValue([
          {
            appointment_id: "44444444-4444-4444-4444-444444444444",
            patient_id: "55555555-5555-5555-5555-555555555555",
            dentist_id: "22222222-2222-2222-2222-222222222222",
            dentist_name: "Dr. Aisha Sharma",
            service_id: "11111111-1111-1111-1111-111111111111",
            service_name: "Root Canal Treatment",
            start_time: "2026-12-15T10:00:00Z",
            end_time: "2026-12-15T11:00:00Z",
            status: "confirmed",
            created_at: "2026-11-17T12:00:00Z",
          },
        ]),
      },
      patient: {
        getProfile: vi.fn().mockResolvedValue({
          patient_id: "55555555-5555-5555-5555-555555555555",
          name: "Test Patient",
          phone: "+919876543210",
        }),
      },
      auth: {
        logout: vi.fn().mockResolvedValue({}),
      },
    },
  };
});

describe("Booking Wizard and Patient Portal components", () => {
  it("renders booking wizard with step 1 dental services", async () => {
    render(<BookingWizardPage />);
    expect(screen.getByText("Book Your Dental Visit")).toBeDefined();
    expect(screen.getByText("1. Select Dental Service")).toBeDefined();
    const serviceName = await screen.findByText("Root Canal Treatment");
    expect(serviceName).toBeDefined();
  });

  it("renders patient portal layout navigation items", () => {
    render(
      <PortalLayout>
        <div>Portal Content Test</div>
      </PortalLayout>
    );
    expect(screen.getByText("Patient Portal")).toBeDefined();
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Appointments")).toBeDefined();
    expect(screen.getByText("Profile")).toBeDefined();
    expect(screen.getByText("Documents")).toBeDefined();
    expect(screen.getByText("Billing & Receipts")).toBeDefined();
    expect(screen.getByText("Privacy & Consents")).toBeDefined();
    expect(screen.getByText("Portal Content Test")).toBeDefined();
  });

  it("renders portal dashboard with patient greeting and upcoming visit", async () => {
    render(<PortalDashboardPage />);
    const greeting = await screen.findByText(/Welcome back, Test Patient/i);
    expect(greeting).toBeDefined();
    const upcomingVisit = await screen.findByText("Next Upcoming Consultation");
    expect(upcomingVisit).toBeDefined();
  });
});
