import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "info";
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, title, description, variant = "default" } = toast;

  const variantStyles = {
    default: "border-border bg-card text-card-foreground shadow-md",
    success: "border-success/40 bg-card text-foreground shadow-md border-l-4 border-l-success",
    error: "border-destructive/40 bg-card text-foreground shadow-md border-l-4 border-l-destructive",
    info: "border-primary/40 bg-card text-foreground shadow-md border-l-4 border-l-primary",
  };

  const iconVariants = {
    default: (
      <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-destructive shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" />
      </svg>
    ),
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start justify-between gap-3 p-4 rounded-lg border max-w-sm w-full transition-all duration-fast",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start gap-3">
        {iconVariants[variant]}
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground leading-normal">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="text-muted-foreground hover:text-foreground rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[32px] min-w-[32px] flex items-center justify-center -mr-1 -mt-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-2 sm:p-0"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

