"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";

interface ConsentItem {
  purpose: string;
  channel: "email" | "sms" | "whatsapp";
  title: string;
  description: string;
  enabled: boolean;
  required?: boolean;
}

export default function PortalPrivacyPage() {
  const [loading, setLoading] = React.useState(true);
  const [savingPurpose, setSavingPurpose] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [consents, setConsents] = React.useState<ConsentItem[]>([
    ...(["email", "sms", "whatsapp"] as const).map((channel) => ({
      purpose: "appointment_reminders",
      channel,
      title: `Appointment reminders by ${channel}`,
      description: `Allow appointment confirmations and reminders through ${channel}.`,
      enabled: false,
    })),
    ...(["email", "sms", "whatsapp"] as const).map((channel) => ({
      purpose: "payment_updates",
      channel,
      title: `Payment updates by ${channel}`,
      description: `Allow payment confirmations and receipt notifications through ${channel}.`,
      enabled: false,
    })),
    ...(["email", "sms", "whatsapp"] as const).map((channel) => ({
      purpose: "clinical_care",
      channel,
      title: `Clinical care messages by ${channel}`,
      description: `Allow care-related updates through ${channel}.`,
      enabled: false,
    })),
    ...(["email", "sms", "whatsapp"] as const).map((channel) => ({
      purpose: "care_delivery",
      channel,
      title: `General care updates by ${channel}`,
      description: `Allow non-marketing clinic updates related to your care through ${channel}.`,
      enabled: false,
    })),
    ...(["email", "sms", "whatsapp"] as const).map((channel) => ({
      purpose: "marketing",
      channel,
      title: `Marketing messages by ${channel}`,
      description: `Allow optional marketing messages through ${channel}.`,
      enabled: false,
    })),
  ]);

  const loadConsents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const recorded = await apiClient.auth.getConsents();
      if (recorded && recorded.length > 0) {
        setConsents((prev) =>
          prev.map((c) => {
            const match = recorded.find((r) => r.purpose === c.purpose && r.channel === c.channel);
            if (match) {
              return { ...c, enabled: match.status === "granted" };
            }
            return c;
          })
        );
      }
    } catch {
      // In dev fallback to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  const handleToggle = async (purpose: string, channel: ConsentItem["channel"], currentVal: boolean) => {
    const nextVal = !currentVal;
    setSavingPurpose(`${purpose}-${channel}`);
    setError(null);
    setNotice(null);
    try {
      await apiClient.auth.updateConsent(purpose, nextVal ? "granted" : "withdrawn", channel);
      setConsents((prev) =>
        prev.map((c) => (c.purpose === purpose && c.channel === channel ? { ...c, enabled: nextVal } : c))
      );
      setNotice(`Preference for "${purpose}" updated.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update consent choice");
    } finally {
      setSavingPurpose(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Privacy Settings & Consents
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          In compliance with the Digital Personal Data Protection (DPDP) Act, 2023, you have full control over your personal data.
        </p>
      </div>

      {notice && (
        <div
          role="alert"
          className="p-3 bg-success/10 border border-success/30 rounded-md text-xs text-success flex justify-between items-center"
        >
          <span>✓ {notice}</span>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive flex justify-between items-center"
        >
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {consents.map((item) => (
            <Card key={`${item.purpose}-${item.channel}`} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm sm:text-base font-semibold">
                        {item.title}
                      </CardTitle>
                      {item.required && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-xs leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </div>

                  <div className="shrink-0 pt-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.enabled}
                      aria-label={`Toggle consent for ${item.title}`}
                      disabled={savingPurpose === `${item.purpose}-${item.channel}`}
                      onClick={() => handleToggle(item.purpose, item.channel, item.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        item.enabled ? "bg-primary" : "bg-muted border border-border"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform shadow-xs ${
                          item.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
