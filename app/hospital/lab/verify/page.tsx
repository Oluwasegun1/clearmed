"use client";

/**
 * Lab Staff — Verify Test Authorization Code & Confirm Service Fulfillment
 * Role 5.5 Laboratory: Access relevant authorization requests, view approved lab services, confirm fulfillment.
 */

import { useState } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClipboardCheck, Search, Loader2, CheckCircle2, AlertCircle, Microscope, ShieldCheck, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ValidationResult {
  valid: boolean;
  message: string;
  authRequest?: {
    id: string;
    authCode: string;
    status: string;
    quantity: number;
    diagnosisNotes?: string;
    service?: {
      id: string;
      name: string;
      category: string;
      standardPrice: number;
    };
    patient?: {
      membershipNumber: string;
      user?: {
        firstName: string;
        lastName: string;
        email: string;
      };
      hmo?: {
        name: string;
      };
    };
  };
}

export default function LabVerifyPage() {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState("");
  const [fulfilledSuccess, setFulfilledSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setVerifying(true);
    setError("");
    setResult(null);
    setFulfilledSuccess(false);

    try {
      const res = await fetch("/api/authorizations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorizationCode: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.message || data.error || "Invalid or unapproved lab authorization code");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmFulfillment = async () => {
    if (!result?.authRequest) return;
    setFulfilling(true);
    setError("");

    try {
      const res = await fetch("/api/authorizations/service-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorizationCode: result.authRequest.authCode,
          serviceId: result.authRequest.service?.id,
          actualQuantity: result.authRequest.quantity || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to record lab test fulfillment");

      setFulfilledSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fulfillment recording failed");
    } finally {
      setFulfilling(false);
    }
  };

  return (
    <HospitalSidebarWrapper currentPath="/hospital/lab/verify" role={UserRole.LAB}>
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-4xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Verify Lab Test Authorization
          </h1>
          <p className="text-sm text-muted-foreground">
            Validate pre-authorized lab investigation codes and record diagnostic test fulfillment
          </p>
        </div>

        <Card className="data-visualization">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Microscope className="h-4 w-4 text-primary" /> Enter Test Authorization Code
            </CardTitle>
            <CardDescription>Enter the code provided by the patient or ordering doctor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="flex gap-3">
              <Input
                placeholder="e.g. AUTH-000123"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-base uppercase"
                required
              />
              <Button type="submit" disabled={verifying} className="gap-2 shrink-0">
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Verify Code
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Notice</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result?.authRequest && (
              <div className="mt-6 border rounded-lg p-5 bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Authorized Lab Investigation</h3>
                      <p className="text-xs text-muted-foreground font-mono">Code: {result.authRequest.authCode}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                    {result.authRequest.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Patient Name</span>
                    <p className="font-medium text-foreground">
                      {result.authRequest.patient?.user?.firstName} {result.authRequest.patient?.user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Membership: {result.authRequest.patient?.membershipNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">HMO Provider</span>
                    <p className="font-medium text-foreground">
                      {result.authRequest.patient?.hmo?.name ?? "ClearMed HMO"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Authorized Investigation</span>
                    <p className="font-medium text-foreground">
                      {result.authRequest.service?.name} ({result.authRequest.service?.category})
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Approved Amount</span>
                    <p className="font-semibold text-foreground">
                      ₦{((result.authRequest.service?.standardPrice ?? 0) * result.authRequest.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>

                {result.authRequest.diagnosisNotes && (
                  <div className="p-3 bg-muted/40 rounded-md text-xs">
                    <span className="font-semibold block mb-1">Clinical Indication & Notes:</span>
                    <p className="text-muted-foreground">{result.authRequest.diagnosisNotes}</p>
                  </div>
                )}

                {fulfilledSuccess ? (
                  <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Lab Service Recorded & Completed</AlertTitle>
                    <AlertDescription>
                      Service delivery record created. The authorization is marked as completed and ready for billing/claims reconciliation.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleConfirmFulfillment}
                      disabled={fulfilling}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {fulfilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Confirm Test Conducted & Record Fulfillment
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </HospitalSidebarWrapper>
  );
}
