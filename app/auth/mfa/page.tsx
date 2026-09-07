"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, KeyRound, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function MfaPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      const mfaVerified = (session?.user as unknown as { mfaVerified?: boolean })?.mfaVerified;
      if (mfaVerified) {
        router.push("/");
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || code.trim().length !== 6) {
      setError("Please enter a 6-digit MFA code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "MFA verification failed.");
      }

      // Update NextAuth JWT token with mfaVerified = true
      await update({ mfaVerified: true });

      toast.success("MFA verification successful!");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground">
            Multi-Factor Authentication (MFA) is required for your staff account.
          </p>
        </div>

        <Card className="glass-card p-6 shadow-xl border-border/60">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-destructive mb-1 text-sm">
                  Verification Failed
                </h3>
                <p className="text-xs text-destructive/90">{error}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-xs text-muted-foreground mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Enter the 6-digit code from your Authenticator app (or use test code <strong>123456</strong>).</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-foreground">
                6-Digit Security Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                maxLength={6}
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                placeholder="000000"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full py-3 font-semibold bg-primary hover:bg-primary/90 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Verify Code</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

