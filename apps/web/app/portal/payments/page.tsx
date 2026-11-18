"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, type InvoiceOut, type PaymentOut } from "@/lib/api-client";

export default function PortalPaymentsPage() {
  const [invoices, setInvoices] = React.useState<InvoiceOut[]>([]);
  const [payments, setPayments] = React.useState<PaymentOut[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchFinancials = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invData, pmtData] = await Promise.all([
        apiClient.patient.getInvoices(),
        apiClient.patient.getPayments(),
      ]);
      setInvoices(invData);
      setPayments(pmtData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load billing history");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Billing, Invoices & Receipts
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your detailed itemized invoices, tax receipts, and payment transactions.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between"
        >
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => fetchFinancials()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {/* Invoices Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Itemized Invoices</h2>
            {invoices.length === 0 ? (
              <Card className="text-center py-8 border-dashed">
                <CardContent>
                  <p className="text-sm text-muted-foreground">No invoices generated yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <Card key={inv.invoice_id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {inv.invoice_number}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
                            inv.status === "paid"
                              ? "bg-success/10 text-success"
                              : "bg-secondary/20 text-secondary-foreground"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <CardDescription className="text-xs">
                        Issued: {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : "Recent"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground border-b pb-1">
                        <span>Base Amount</span>
                        <span>₹{inv.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground border-b pb-1">
                        <span>GST / Taxes</span>
                        <span>₹{inv.tax_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-foreground pt-1">
                        <span>Total Net Payable</span>
                        <span className="text-primary font-bold">
                          ₹{inv.net_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Payment Receipts Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Payment History & Receipts</h2>
            {payments.length === 0 ? (
              <Card className="text-center py-8 border-dashed">
                <CardContent>
                  <p className="text-sm text-muted-foreground">No payment transactions recorded.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">Payment ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((pmt) => (
                      <tr key={pmt.payment_id} className="hover:bg-muted/20">
                        <td className="p-3 font-mono font-medium text-foreground">
                          {pmt.payment_id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(pmt.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-semibold text-foreground">
                          ₹{pmt.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-success/10 text-success">
                            {pmt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
