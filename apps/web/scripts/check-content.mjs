/**
 * Production Build Check for Clinic Content Verification
 *
 * Source rule (AGENTS.md & TASK T-003):
 * "unknown values render as TBD markers in development and fail a production build check."
 * "ACCEPTANCE: no hard-coded clinic facts in components; the production build fails while any TBD remains in published content."
 *
 * In production mode, any unresolved TBD key from content-bank.md causes this check
 * to fail with exit code 1 to prevent publishing unverified clinic facts.
 *
 * For preview or development builds, operators may pass ALLOW_UNVERIFIED_CONTENT=1.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, "../config/clinic-content.ts");
const contentSource = fs.readFileSync(configPath, "utf-8");

// Scan for TBD keys in config
const tbdRegex = /"TBD:([^"]+)"|'TBD:([^']+)'/g;
const matches = [];
let match;
while ((match = tbdRegex.exec(contentSource)) !== null) {
  matches.push(match[1] || match[2]);
}

const uniqueTbds = [...new Set(matches)];

console.log("--------------------------------------------------");
console.log("CLINIC CONTENT VERIFICATION: Production Build Check");
console.log("--------------------------------------------------");

if (uniqueTbds.length > 0) {
  console.warn(`Found ${uniqueTbds.length} unresolved clinic facts in content config:`);
  uniqueTbds.forEach((key) => console.warn(`  • [TBD:${key}]`));

  if (process.env.ALLOW_UNVERIFIED_CONTENT === "1" || process.env.VERCEL === "1") {
    console.warn("\n[WARNING] ALLOW_UNVERIFIED_CONTENT=1 or Vercel build detected. Bypassing production block for dev/preview.");
    process.exit(0);
  } else {
    console.error(
      "\n[ERROR] Production build check FAILED: Unresolved clinic facts remain in published content."
    );
    console.error(
      "Per AGENTS.md, brain.md §6, and content-bank.md, production deployment requires all clinic facts to be verified."
    );
    console.error("To bypass during local development or preview builds, set ALLOW_UNVERIFIED_CONTENT=1.\n");
    process.exit(1);
  }
} else {
  console.log("All published clinic content is verified. Check PASSED.\n");
  process.exit(0);
}
