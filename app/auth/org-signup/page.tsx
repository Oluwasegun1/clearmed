"use client";

/**
 * Organisation signup — two-step wizard.
 * Step 1: Choose org type (Hospital or HMO).
 * Step 2: Fill org details + admin personal details → POST /api/org/signup.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Building2, Shield, ArrowLeft, ArrowRight, Loader2,
  AlertCircle, CheckCircle2, MapPin, Phone, Mail, Hash, User, Lock,
} from "lucide-react";

type OrgType = "HOSPITAL" | "HMO";
type Step = 1 | 2;

interface FormState {
  orgName: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  orgEmail: string;
  licenseNumber: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

const EMPTY: FormState = {
  orgName: "", address: "", city: "", state: "",
  phoneNumber: "", orgEmail: "", licenseNumber: "",
  adminFirstName: "", adminLastName: "",
  adminEmail: "", adminPassword: "", confirmPassword: "",
};

export default function OrgSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.adminPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/org/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgType, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess(true);
      // Redirect after short delay so user sees success state
      setTimeout(() => {
        router.push(orgType === "HOSPITAL" ? "/hospital/dashboard" : "/hmo/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/auth/register">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Register your Organisation</h1>
            <p className="text-xs text-muted-foreground">
              Step {step} of 2 — {step === 1 ? "Choose type" : "Organisation & admin details"}
            </p>
          </div>
          <div className="w-20" />
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: step === 1 ? "50%" : "100%" }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* ── Step 1 — Choose org type ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-1">What are you registering?</h2>
              <p className="text-sm text-muted-foreground">
                You will become the Admin for this organisation. Staff members join via invites.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["HOSPITAL", "HMO"] as const).map((type) => {
                const isHosp = type === "HOSPITAL";
                const selected = orgType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setOrgType(type)}
                    className={`relative flex flex-col items-start gap-4 rounded-xl border-2 p-6 text-left transition-all duration-200 hover:border-primary/60
                      ${selected ? "border-primary bg-primary/5" : "border-border bg-card/60"}`}
                  >
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center
                      ${isHosp ? "bg-blue-100 text-blue-700" : "bg-primary/10 text-primary"}`}>
                      {isHosp ? <Building2 className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg">
                        {isHosp ? "Hospital" : "HMO"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isHosp
                          ? "A clinic, hospital, or healthcare facility that treats patients."
                          : "A Health Maintenance Organisation managing member coverage & claims."}
                      </p>
                    </div>
                    {selected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full gap-2"
              disabled={!orgType}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── Step 2 — Details form ── */}
        {step === 2 && (
          <div className="space-y-6">
            {success && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Organisation registered!</AlertTitle>
                <AlertDescription>Redirecting to your dashboard…</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Org details */}
              <Card className="data-visualization">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {orgType === "HOSPITAL"
                      ? <><Building2 className="h-4 w-4 text-blue-600" /> Hospital details</>
                      : <><Shield className="h-4 w-4 text-primary" /> HMO details</>}
                  </CardTitle>
                  <CardDescription>Official organisation information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">
                      {orgType === "HOSPITAL" ? "Hospital name" : "HMO name"}
                    </Label>
                    <Input id="orgName" value={form.orgName} onChange={set("orgName")}
                      placeholder={orgType === "HOSPITAL" ? "e.g. Lagos University Teaching Hospital" : "e.g. Hygeia HMO"}
                      required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Street address
                    </Label>
                    <Input id="address" value={form.address} onChange={set("address")}
                      placeholder="e.g. 1 Idi-Araba, Surulere" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={form.city} onChange={set("city")} placeholder="e.g. Lagos" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={form.state} onChange={set("state")} placeholder="e.g. Lagos" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone number
                    </Label>
                    <Input id="phoneNumber" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")}
                      placeholder="+2348012345678" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail" className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Official email
                    </Label>
                    <Input id="orgEmail" type="email" value={form.orgEmail} onChange={set("orgEmail")}
                      placeholder="info@hospital.ng" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Licence number
                    </Label>
                    <Input id="licenseNumber" value={form.licenseNumber} onChange={set("licenseNumber")}
                      placeholder={orgType === "HOSPITAL" ? "HOSP-20240001" : "HMO-20240001"} required />
                  </div>
                </CardContent>
              </Card>

              {/* Admin details */}
              <Card className="data-visualization">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" /> Your admin account
                  </CardTitle>
                  <CardDescription>
                    You will be the organisation Admin. Staff join via invites.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminFirstName">First name</Label>
                      <Input id="adminFirstName" value={form.adminFirstName} onChange={set("adminFirstName")}
                        placeholder="John" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminLastName">Last name</Label>
                      <Input id="adminLastName" value={form.adminLastName} onChange={set("adminLastName")}
                        placeholder="Doe" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail" className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Your email
                    </Label>
                    <Input id="adminEmail" type="email" value={form.adminEmail} onChange={set("adminEmail")}
                      placeholder="admin@hospital.ng" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword" className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Password
                      </Label>
                      <Input id="adminPassword" type="password" value={form.adminPassword}
                        onChange={set("adminPassword")} placeholder="Min 8 characters" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input id="confirmPassword" type="password" value={form.confirmPassword}
                        onChange={set("confirmPassword")} placeholder="Re-enter password" required />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button type="submit" disabled={isSubmitting || success} className="flex-1">
                  {isSubmitting
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering…</>
                    : `Register ${orgType === "HOSPITAL" ? "Hospital" : "HMO"}`}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
