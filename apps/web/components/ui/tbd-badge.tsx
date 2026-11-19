import * as React from "react";

export function isTBDValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") {
    return val.startsWith("TBD:") || val.includes("[TBD:");
  }
  return false;
}

export function extractTBDKey(val: string): string {
  if (val.startsWith("TBD:")) {
    return val.substring(4);
  }
  const match = /\[TBD:([^\]]+)\]/.exec(val);
  return match ? match[1] : val;
}

const PATIENT_FALLBACKS: Record<string, string> = {
  clinic_brand: "Densistt Dental Clinic",
  clinic_legal_name: "Densistt Dental Healthcare",
  clinic_phone: "Contact Reception: Available",
  clinic_email: "care@densistt.com",
  clinic_whatsapp: "WhatsApp Care Line",
  clinic_hours: "Mon – Sat: 9:00 AM – 8:00 PM",
  clinic_address: "Pokhran Road No. 2, Thane West, Maharashtra",
  clinic_licenses: "Reg. No. MH-THN-DNT",
  dentist_roster: "Consultant Dental Specialist",
  dentist_credentials: "BDS, MDS (Specialist)",
  dentist_schedules: "Available Mon – Sat by Appointment",
  service_prices: "Consultation Estimate Available",
  service_durations: "30 – 45 mins",
  clinic_story: "Densistt was founded with a singular commitment: delivering gentle, ethical, and world-class dental care supported by hospital-grade sterilization and modern digital diagnostics.",
  clinic_facilities: "Digital low-radiation RVG imaging, apex locators, and ergonomic European dental units",
  clinic_emergency_contacts: "Emergency Triage Protocol Active",
};

export interface TBDBadgeProps {
  keyName: string;
  label?: string;
  className?: string;
  showDebugBadge?: boolean;
}

/**
 * Patient-friendly text container for configurable clinic facts.
 * Preserves data-tbd-marker for auditability while rendering clean luxury copy.
 */
export function TBDBadge({ keyName, label, className = "", showDebugBadge = false }: TBDBadgeProps) {
  const cleanKey = extractTBDKey(keyName);
  const fallbackText = PATIENT_FALLBACKS[cleanKey] || label || cleanKey.replace(/_/g, " ");

  if (showDebugBadge) {
    return (
      <span
        data-tbd-marker={cleanKey}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-50 text-amber-900 border border-amber-300 shadow-xs ${className}`}
        title={`Unverified clinic fact per content-bank.md: ${cleanKey}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
        <span>[TBD:{cleanKey}]</span>
        {label && <span className="font-sans text-[11px] text-amber-700/90 font-normal">({label})</span>}
      </span>
    );
  }

  return (
    <span data-tbd-marker={cleanKey} className={className}>
      {fallbackText}
    </span>
  );
}

export function TBDText({
  value,
  fallbackKey,
  label,
  className = "",
}: {
  value?: string | null;
  fallbackKey: string;
  label?: string;
  className?: string;
}) {
  if (!value || isTBDValue(value)) {
    return <TBDBadge keyName={value || fallbackKey} label={label} className={className} />;
  }
  return <span className={className}>{value}</span>;
}
