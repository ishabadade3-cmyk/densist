import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import StyleguidePage from "./page";
import * as fs from "fs";
import * as path from "path";

// Ensure DOM is cleaned up between each test so rendered trees do not bleed.
afterEach(() => cleanup());

describe("Styleguide and Design System Components", () => {
  it("renders the styleguide with all core sections", () => {
    render(<StyleguidePage />);

    expect(
      screen.getByRole("heading", { name: /Design System & UI Components/i })
    ).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: /Color Tokens & Contrast Verification/i })
    ).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: /Serif & Sans-Serif Font Scale/i })
    ).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: /Buttons & Action Triggers/i })
    ).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: /Form Controls with Explicit Validation States/i })
    ).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: /Cards & Container Variants/i })
    ).toBeTruthy();
  });

  it("renders the persistent Book Appointment CTA in the Navbar", () => {
    render(<StyleguidePage />);
    // The Navbar always renders a persistent CTA with id="nav-book-cta".
    // Use getAllByRole in case multiple viewports produce duplicate nodes in jsdom.
    const bookCtaButtons = screen.getAllByRole("button", { name: /Book Appointment/i });
    expect(bookCtaButtons.length).toBeGreaterThanOrEqual(1);
    // The navbar CTA is always rendered first and carries a stable id.
    const navCta = bookCtaButtons.find(
      (el) => el.getAttribute("id") === "nav-book-cta"
    );
    expect(navCta).toBeTruthy();
  });

  it("handles mobile menu toggling accessible via keyboard", () => {
    render(<StyleguidePage />);
    const menuBtn = screen.getByRole("button", { name: /Toggle navigation menu/i });
    expect(menuBtn).toBeTruthy();
    expect(menuBtn.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(menuBtn);
    expect(menuBtn.getAttribute("aria-expanded")).toBe("true");

    // Close on escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(menuBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens and closes the appointment dialog with accessible role and labels", () => {
    render(<StyleguidePage />);
    const openBtn = screen.getByRole("button", { name: /Open Appointment Dialog/i });
    fireEvent.click(openBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    // Close via Close dialog button
    const closeBtn = screen.getByRole("button", { name: /Close dialog/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("displays form validation states with accessible ARIA descriptions", () => {
    render(<StyleguidePage />);

    const errorInput = screen.getByLabelText(/Email Address/i);
    expect(errorInput.getAttribute("aria-invalid")).toBe("true");

    // The error message renders with role="alert"; check text content rather than
    // accessible name (alerts derive content from text, not aria-label).
    const alertMessages = screen.getAllByRole("alert");
    const emailAlert = alertMessages.find((el) =>
      /Please enter a valid email format/i.test(el.textContent ?? "")
    );
    expect(emailAlert).toBeTruthy();

    const successInput = screen.getByLabelText(/Mobile Phone/i);
    expect(successInput.getAttribute("aria-invalid")).toBe("false");
  });

  it("dispatches and dismisses toast notifications", () => {
    render(<StyleguidePage />);

    // Click the success toast trigger button (unique label in the page)
    const toastTriggers = screen.getAllByRole("button", { name: /Trigger Success Toast/i });
    expect(toastTriggers.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(toastTriggers[0]);

    // Toast appears with role="status" (polite live region)
    const toastStatuses = screen.getAllByRole("status");
    expect(toastStatuses.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Booking Confirmed/i)).toBeTruthy();

    // Dismiss the first notification
    const dismissBtns = screen.getAllByRole("button", { name: /Dismiss notification/i });
    expect(dismissBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(dismissBtns[0]);
    expect(screen.queryByText(/Booking Confirmed/i)).toBeNull();
  });

  it("enforces no hard-coded hex colors in components or styleguide outside theme files", () => {
    const webDir = path.resolve(__dirname, "../../");
    const componentsDir = path.join(webDir, "components");
    const appDir = path.join(webDir, "app");

    const findFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(findFiles(fullPath));
        } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const codeFiles = [...findFiles(componentsDir), ...findFiles(appDir)];
    // Exclude this test file itself
    const filesToAudit = codeFiles.filter(f => !f.endsWith("page.test.tsx"));

    // Regex matching CSS color hex codes (e.g., #0B5D5E, #fff, etc.)
    // Allowed only in globals.css / tailwind.config.js
    const hexRegex = /(?:class|className|style)\s*=\s*["'][^"']*#[0-9a-fA-F]{3,8}[^"']*["']/i;

    for (const file of filesToAudit) {
      const content = fs.readFileSync(file, "utf-8");
      const match = hexRegex.exec(content);
      expect(
        match,
        `File ${path.basename(file)} contains hard-coded hex in className/style: ${match?.[0]}`
      ).toBeNull();
    }
  });
});

