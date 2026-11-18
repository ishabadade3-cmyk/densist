import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SmileGalleryPage from "./gallery/page";
import {
  clinicContent,
  findUnresolvedTBDs,
  getConsentedGallery,
  getConsentedTestimonials,
} from "@/config/clinic-content";
import sitemap from "./sitemap";
import robots from "./robots";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

describe("Clinic Content, Anti-Hallucination & Legal Consent Guardrails", () => {
  it("detects all unresolved TBD keys from content-bank.md", () => {
    const tbds = findUnresolvedTBDs(clinicContent);
    expect(tbds.length).toBeGreaterThan(0);

    // Verify key fields match content-bank.md TBD items
    expect(tbds.some((t) => t.includes("TBD:clinic_legal_name"))).toBe(true);
    expect(tbds.some((t) => t.includes("TBD:clinic_brand"))).toBe(true);
    expect(tbds.some((t) => t.includes("TBD:clinic_phone"))).toBe(true);
    expect(tbds.some((t) => t.includes("TBD:dentist_roster"))).toBe(true);
    expect(tbds.some((t) => t.includes("TBD:service_prices"))).toBe(true);
  });

  it("strictly excludes unconsented gallery transformations from public display", () => {
    const rawGallery = clinicContent.gallery;
    const unconsentedItem = rawGallery.find((item) => item.id === "gal-04-unconsented");
    expect(unconsentedItem).toBeDefined();
    expect(unconsentedItem?.consentRecorded).toBe(false);

    // Filtered public gallery must omit unconsented item
    const publicGallery = getConsentedGallery();
    expect(publicGallery.some((item) => item.id === "gal-04-unconsented")).toBe(false);

    // All published gallery items must have consent recorded and a consentReferenceId
    publicGallery.forEach((item) => {
      expect(item.consentRecorded).toBe(true);
      expect(item.consentReferenceId).toBeDefined();
      expect(item.consentReferenceId?.length).toBeGreaterThan(0);
    });
  });

  it("strictly excludes unconsented testimonials from public display", () => {
    const rawTestimonials = clinicContent.testimonials;
    const unconsentedTestimonial = rawTestimonials.find((t) => t.id === "tst-03-unconsented");
    expect(unconsentedTestimonial).toBeDefined();
    expect(unconsentedTestimonial?.consentRecorded).toBe(false);

    // Filtered public testimonials must omit unconsented item
    const publicTestimonials = getConsentedTestimonials();
    expect(publicTestimonials.some((t) => t.id === "tst-03-unconsented")).toBe(false);

    // All published testimonials must have consent recorded and a reference
    publicTestimonials.forEach((t) => {
      expect(t.consentRecorded).toBe(true);
      expect(t.consentReferenceId).toBeDefined();
    });
  });

  it("fails the production build check when TBDs remain in published content", () => {
    const scriptPath = path.resolve(__dirname, "../scripts/check-content.mjs");
    expect(fs.existsSync(scriptPath)).toBe(true);

    // Executing check-content without ALLOW_UNVERIFIED_CONTENT must exit with code 1
    let exitCode = 0;
    try {
      execSync(`node "${scriptPath}"`, {
        stdio: "pipe",
        env: { ...process.env, ALLOW_UNVERIFIED_CONTENT: undefined },
      });
    } catch (err: unknown) {
      const execError = err as { status?: number };
      exitCode = execError.status || 1;
    }
    expect(exitCode).toBe(1);

    // Executing check-content WITH ALLOW_UNVERIFIED_CONTENT=1 must exit with code 0 (bypass)
    let bypassCode = 1;
    try {
      execSync(`node "${scriptPath}"`, {
        stdio: "pipe",
        env: { ...process.env, ALLOW_UNVERIFIED_CONTENT: "1" },
      });
      bypassCode = 0;
    } catch {
      bypassCode = 1;
    }
    expect(bypassCode).toBe(0);
  });

  it("generates a comprehensive dynamic sitemap including all static and dynamic routes", () => {
    const map = sitemap();
    expect(map.length).toBeGreaterThanOrEqual(11 + clinicContent.services.length + clinicContent.blogPosts.length);

    const urls = map.map((m) => m.url);
    expect(urls).toContain("https://example-dental.in");
    expect(urls).toContain("https://example-dental.in/about");
    expect(urls).toContain("https://example-dental.in/services");
    expect(urls).toContain("https://example-dental.in/dentists");
    expect(urls).toContain("https://example-dental.in/gallery");
    expect(urls).toContain("https://example-dental.in/blog");
    expect(urls).toContain("https://example-dental.in/faq");
    expect(urls).toContain("https://example-dental.in/contact");
    expect(urls).toContain("https://example-dental.in/policies/privacy");
    expect(urls).toContain("https://example-dental.in/policies/terms");
    expect(urls).toContain("https://example-dental.in/policies/cancellation");

    // Dynamic services
    clinicContent.services.forEach((s) => {
      expect(urls).toContain(`https://example-dental.in/services/${s.slug}`);
    });

    // Dynamic blog posts
    clinicContent.blogPosts.forEach((b) => {
      expect(urls).toContain(`https://example-dental.in/blog/${b.slug}`);
    });
  });

  it("generates robots.txt disallowing private portal and admin paths", () => {
    const rob = robots();
    expect(rob.sitemap).toBe("https://example-dental.in/sitemap.xml");

    const rules = Array.isArray(rob.rules) ? rob.rules[0] : rob.rules;
    expect(rules.disallow).toContain("/api/");
    expect(rules.disallow).toContain("/portal/");
    expect(rules.disallow).toContain("/admin/");
  });

  it("supports keyboard navigation through the gallery viewer", () => {
    render(<SmileGalleryPage />);

    // Open the first case viewer
    const openButtons = screen.getAllByRole("button", { name: /Open Case Viewer/i });
    expect(openButtons.length).toBeGreaterThan(0);
    fireEvent.click(openButtons[0]);

    // Modal dialog must be open
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();

    // Navigate with ArrowRight
    fireEvent.keyDown(window, { key: "ArrowRight" });

    // Navigate with ArrowLeft
    fireEvent.keyDown(window, { key: "ArrowLeft" });

    // Dismiss with Escape key
    fireEvent.keyDown(window, { key: "Escape" });
  });

  it("enforces no hard-coded realistic clinic addresses or phone numbers in app page files", () => {
    const appDir = path.resolve(__dirname, "./");
    const findPageFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(findPageFiles(fullPath));
        } else if (file.endsWith("page.tsx") && !file.includes("styleguide")) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const pageFiles = findPageFiles(appDir);
    expect(pageFiles.length).toBeGreaterThanOrEqual(8);

    // Look for realistic invented contact details that should come from content config
    const forbiddenPatterns = [
      /\+91[\s-]?[789]\d{9}/, // Unbracketed raw real Indian phone number in page source
      /[a-zA-Z0-9._%+-]+@dr[a-zA-Z0-9.-]+\.com/, // Invented dentist email
      /₹\s?\d{2,5}/, // Hard-coded currency price in page markup (should be in content config or TBD)
    ];

    for (const pageFile of pageFiles) {
      const content = fs.readFileSync(pageFile, "utf-8");
      // Skip commented lines or placeholder examples in form inputs
      const nonInputLines = content
        .split("\n")
        .filter((l) => !l.includes('placeholder="') && !l.includes('defaultValue="'))
        .join("\n");

      for (const pattern of forbiddenPatterns) {
        const match = pattern.exec(nonInputLines);
        expect(
          match,
          `File ${path.basename(pageFile)} contains hard-coded unverified clinic fact: ${match?.[0]}`
        ).toBeNull();
      }
    }
  });
});
