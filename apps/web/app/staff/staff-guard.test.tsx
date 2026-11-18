import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StaffGuard } from "@/components/staff/staff-guard";

const getProfile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", () => ({ apiClient: { auth: { getProfile } } }));

afterEach(() => { cleanup(); getProfile.mockReset(); });

describe("StaffGuard", () => {
  it("does not render receptionist data for a patient account", async () => {
    getProfile.mockResolvedValue({ user_id: "opaque-user", name: "SAMPLE ONLY", role: "patient" });
    render(<StaffGuard roles={["receptionist"]}><p>Restricted calendar data</p></StaffGuard>);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Staff access required" })).toBeTruthy());
    expect(screen.queryByText("Restricted calendar data")).toBeNull();
  });

  it("does not render admin data for a receptionist account", async () => {
    getProfile.mockResolvedValue({ user_id: "opaque-user", name: "SAMPLE ONLY", role: "receptionist" });
    render(<StaffGuard roles={["clinic_admin"]}><p>Restricted report data</p></StaffGuard>);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Staff access required" })).toBeTruthy());
    expect(screen.queryByText("Restricted report data")).toBeNull();
  });
});
