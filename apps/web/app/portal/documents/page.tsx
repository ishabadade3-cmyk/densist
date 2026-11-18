"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type DocumentOut } from "@/lib/api-client";

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = React.useState<DocumentOut[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.patient.getDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load clinical records");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Clinical Records & Prescriptions
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Access your digital prescriptions, diagnostic radiographs, and doctor-approved summaries.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between"
        >
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => fetchDocuments()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              📑
            </div>
            <h2 className="text-base font-semibold text-foreground">No Released Documents Yet</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Prescriptions and digital radiographs released by your attending dentist will be securely accessible here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const kindLabels: Record<string, { label: string; badge: string }> = {
              prescription: { label: "Prescription", badge: "bg-primary/10 text-primary" },
              lab_report: { label: "Radiology / RVG", badge: "bg-secondary/20 text-secondary-foreground" },
              invoice: { label: "Invoice", badge: "bg-muted text-foreground" },
            };
            const meta = kindLabels[doc.kind] || {
              label: doc.kind,
              badge: "bg-muted text-foreground",
            };

            return (
              <Card key={doc.document_id} className="hover:shadow-xs transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Released: {doc.created_at}
                    </span>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-serif mt-1">
                    {doc.title}
                  </CardTitle>
                  {doc.released_by_name && (
                    <CardDescription className="text-xs">
                      Released by: <strong className="text-foreground">{doc.released_by_name}</strong>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="pt-2 flex justify-end">
                  <a
                    href={doc.file_url}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    rel="noreferrer"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
