"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-fields";
import { apiClient } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isOtpMode, setIsOtpMode] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [totpRequired, setTotpRequired] = React.useState(false);
  const [mfaSetupRequired, setMfaSetupRequired] = React.useState(false);
  const [totpCode, setTotpCode] = React.useState("");
  const [mfaSecret, setMfaSecret] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!identifier.trim()) {
      errs.identifier = "Please enter your registered phone number or email.";
    }
    if (!isOtpMode && !password) {
      errs.password = "Password is required for password login.";
    }
    if (isOtpMode && otpSent && (!otpCode || otpCode.length < 4)) {
      errs.otp = "Please enter the verification code.";
    }
    if (totpRequired && (!totpCode || totpCode.length !== 6)) {
      errs.totp = "Enter the six-digit authenticator code.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setFormErrors({ identifier: "Enter phone or email to receive code." });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.auth.sendOtp({
        email_or_phone: identifier.trim(),
        purpose: "login",
      });
      setOtpSent(true);
      if (res.dev_code) {
        setDevCode(res.dev_code);
        setOtpCode(res.dev_code);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deliver OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    try {
      let role: string | undefined;
      if (isOtpMode) {
        const result = await apiClient.auth.verifyOtp({
          email_or_phone: identifier.trim(),
          code: otpCode.trim(),
        });
        role = result.role;
      } else {
        const result = await apiClient.auth.login({
          email_or_phone: identifier.trim(),
          password: password,
          ...(totpRequired ? { totp_code: totpCode.trim() } : {}),
        });
        if (result.mfa_setup_required) {
          setMfaSetupRequired(true);
          return;
        }
        if (result.mfa_required) {
          setTotpRequired(true);
          return;
        }
        role = result.role;
      }
      if (!role) throw new Error("The account did not receive an authorized session.");
      router.push(role === "dentist" ? "/staff/dentist" : role === "receptionist" ? "/staff/receptionist" : role === "clinic_admin" ? "/admin" : "/portal");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid credentials or verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const beginMfaSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const enrollment = await apiClient.auth.enrollMfa();
      setMfaSecret(enrollment.shared_secret);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to start MFA setup");
    } finally { setLoading(false); }
  };

  const completeMfaSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.auth.verifyMfa(totpCode.trim());
      if (!result.role) throw new Error("MFA verification did not return the account role.");
      router.push(result.role === "dentist" ? "/staff/dentist" : result.role === "receptionist" ? "/staff/receptionist" : "/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "MFA verification failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12 flex items-center justify-center">
      <Container className="max-w-md">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
          >
            ← Return to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Sign In to Your Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Patients and authorized staff can access their role-specific workspace.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs"
          >
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold">
                  {isOtpMode ? "Sign In via SMS / Email OTP" : "Password Sign In"}
                </CardTitle>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpMode(!isOtpMode);
                    setError(null);
                    setFormErrors({});
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {isOtpMode ? "Use Password" : "Use OTP Code"}
                </button>
              </div>
              <CardDescription className="text-xs">
                Enter your registered contact to access your records.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="login-identifier" required>
                  Mobile Phone or Email
                </Label>
                <Input
                  id="login-identifier"
                  type="text"
                  placeholder="+91 98765 43210 or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  state={formErrors.identifier ? "error" : "default"}
                  errorMessage={formErrors.identifier}
                />
              </div>

              {!isOtpMode ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="login-password" required>
                      Password
                    </Label>
                    <Link
                      href="/policies/privacy"
                      className="text-[11px] text-muted-foreground hover:underline"
                    >
                      Need help?
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    state={formErrors.password ? "error" : "default"}
                    errorMessage={formErrors.password}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {!otpSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      {loading ? "Sending Code..." : "Send Verification Code"}
                    </Button>
                  ) : (
                    <>
                      {devCode && (
                        <div className="p-2.5 bg-secondary/20 rounded border border-secondary text-xs">
                          <span className="font-semibold">Dev Code:</span> {devCode}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="login-otp" required>
                          6-Digit Verification Code
                        </Label>
                        <Input
                          id="login-otp"
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          state={formErrors.otp ? "error" : "default"}
                          errorMessage={formErrors.otp}
                          className="text-center tracking-widest font-mono"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Resend Code
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {totpRequired && (
                <div>
                  <Label htmlFor="staff-totp" required>Authenticator code</Label>
                  <Input id="staff-totp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))} state={formErrors.totp ? "error" : "default"} errorMessage={formErrors.totp} />
                  <p className="mt-1 text-xs text-muted-foreground">Enter the current code from your staff authenticator app.</p>
                </div>
              )}

              {mfaSetupRequired && (
                <div className="rounded-md border border-border p-4">
                  <p className="text-sm">Staff accounts require authenticator setup before entering the workspace.</p>
                  {!mfaSecret ? <Button className="mt-3" type="button" onClick={() => void beginMfaSetup()} isLoading={loading}>Begin authenticator setup</Button> : (
                    <>
                      <p className="mt-3 break-all font-mono text-sm">Setup secret: {mfaSecret}</p>
                      <Label htmlFor="setup-totp" required>Authenticator code</Label>
                      <Input id="setup-totp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))} />
                      <Button className="mt-3" type="button" onClick={() => void completeMfaSetup()} isLoading={loading}>Verify and continue</Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" disabled={loading || mfaSetupRequired} className="w-full">
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-1">
                New patient?{" "}
                <Link href="/book" className="text-primary hover:underline font-semibold">
                  Book an appointment
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </Container>
    </div>
  );
}
