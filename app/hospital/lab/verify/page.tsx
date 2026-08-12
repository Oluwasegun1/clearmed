"use client";

/**
 * Lab Staff — Verify Test Authorization Code
 */

import { useState } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClipboardCheck, Search, Loader2, CheckCircle2, AlertCircle, Microscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LabVerifyPage() {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setVerifying(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/authorizations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authCode: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Invalid pre-authorization code");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <HospitalSidebarWrapper currentPath="/hospital/lab/verify" role={UserRole.LAB}>
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-3xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Verify Laboratory Test Authorization
          </h1>
          <p className="text-sm text-muted-foreground">Validate pre-authorized lab investigation codes before conducting tests</p>
        </div>

        <Card className="data-visualization">
          <CardHeader>
            <CardTitle className="text-base">Enter Authorization Code</CardTitle>
            <CardDescription>Enter the code provided by the patient or ordering doctor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="flex gap-3">
              <Input
                placeholder="e.g. AUTH-982341"
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
                <AlertTitle>Invalid Code</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert className="mt-4 bg-green-500/10 border-green-500/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-base font-semibold">Valid Authorization Code!</AlertTitle>
                <AlertDescription className="mt-2 space-y-2 text-sm">
                  <p><strong>Patient:</strong> {result.patientName || "Verified Patient"}</p>
                  <p><strong>Approved Lab Test:</strong> {result.serviceName || "Laboratory Investigation"}</p>
                  <p><strong>HMO Provider:</strong> {result.hmoName || "ClearMed HMO"}</p>
                  <Badge className="bg-green-600 text-white mt-2">Cleared for Specimen Collection</Badge>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </HospitalSidebarWrapper>
  );
}
