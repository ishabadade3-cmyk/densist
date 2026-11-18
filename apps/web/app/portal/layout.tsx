"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const navItems = [
    { label: "Dashboard", href: "/portal" },
    { label: "Appointments", href: "/portal/appointments" },
    { label: "Profile", href: "/portal/profile" },
    { label: "Documents", href: "/portal/documents" },
    { label: "Billing & Receipts", href: "/portal/payments" },
    { label: "Privacy & Consents", href: "/portal/privacy" },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiClient.auth.logout();
    } catch {
      // ignore
    } finally {
      setLoggingOut(false);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top Portal Header Bar */}
      <header className="bg-card border-b border-border shadow-xs sticky top-0 z-30">
        <Container className="py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded p-1"
            >
              ← Back to Clinic Website
            </Link>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success" aria-hidden="true" />
              <span className="font-serif font-bold text-foreground text-sm sm:text-base">
                Patient Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/book">+ Book New Visit</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              {loggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </Container>

        {/* Horizontal Navigation Tabs */}
        <Container className="pt-1 pb-0 overflow-x-auto">
          <nav
            aria-label="Patient Portal Sections"
            className="flex items-center gap-1 sm:gap-2 border-t border-border/50 pt-2 pb-1 scrollbar-none"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </Container>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
