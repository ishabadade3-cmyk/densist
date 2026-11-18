import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("web health page", () => {
  it("renders a minimal healthy state", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Web app health check" })).toBeTruthy();
    expect(screen.getByText("Healthy")).toBeTruthy();
  });
});
