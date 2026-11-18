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

export interface TBDBadgeProps {
  keyName: string;
  label?: string;
  className?: string;
}

/**
 * Visual badge for unverified clinic facts in development.
 * Emits a visible marker with data attribute for auditability.
 */
export function TBDBadge({ keyName, label, className = "" }: TBDBadgeProps) {
  const cleanKey = extractTBDKey(keyName);

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
