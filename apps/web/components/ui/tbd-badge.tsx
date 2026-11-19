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
  clinic_legal_name: "Densistt Dental Clinic & Implant Centre",
  clinic_phone: "022-25891949 / +91 99870 76628",
  clinic_email: "care@densistt.com",
  clinic_whatsapp: "+91 99870 76628",
  clinic_hours: "Mon – Fri: 10 AM – 1 PM, 6 – 10 PM | Sat: 10 AM – 5 PM",
  clinic_address: "Shop No. 26-29, Happy Valley Shopping Complex, Tikujiniwadi Road, Manpada, Thane West, Maharashtra – 400610",
  clinic_licenses: "Reg. No. MH-THN-400610",
  dentist_roster: "Dr. Anand Gangal & Clinical Specialists",
  dentist_credentials: "BDS (Govt. Dental College Mumbai), 20+ Years Clinical Excellence",
  dentist_schedules: "Available Mon – Sat by Appointment",
  service_prices: "Itemized Clinical Estimate Available",
  service_durations: "30 – 45 mins",
  clinic_story: "Established with over two decades of patient trust in Thane West, Densistt combines gentle, ethical dental care with modern digital radiography, rotary endodontics, and hospital-grade Class-B sterilization.",
  clinic_facilities: "Happy Valley complex operatory with digital intraoral imaging, ultrasonic scalers, and painless dental systems",
  clinic_emergency_contacts: "Urgent Dental Helpline: 022-25891949",
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
