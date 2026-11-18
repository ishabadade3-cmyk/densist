"use client";

import * as React from "react";
import Link from "next/link";
import type { StaffRole } from "@/lib/api-client";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function StaffGuard({ roles, children }: { roles: StaffRole[]; children: React.ReactNode }) {
  const [state, setState] = React.useState<"loading" | "allowed" | "denied">("loading");
  const roleKey = roles.join("|");

  React.useEffect(() => {
    let mounted = true;
    apiClient.auth.getProfile().then(
      (profile) => mounted && setState(roleKey.split("|").includes(profile.role) ? "allowed" : "denied"),
      () => mounted && setState("denied")
    );
    return () => { mounted = false; };
  }, [roleKey]);

  if (state === "loading") {
    return <main aria-busy="true" className="py-16 text-center">Checking staff access…</main>;
  }
  if (state === "denied") {
    return (
      <main className="py-16">
        <Container className="max-w-xl text-center">
          <h1 className="font-serif text-2xl font-bold">Staff access required</h1>
          <p className="mt-3 text-muted-foreground">This workspace is not available for the current account.</p>
          <Button asChild className="mt-6"><Link href="/login">Sign in with an authorized account</Link></Button>
        </Container>
      </main>
    );
  }
  return <>{children}</>;
}
