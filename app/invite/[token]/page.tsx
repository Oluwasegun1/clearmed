"use client";

/**
 * Invite acceptance page — /invite/[token]
 * Validates the token, shows org/role context, and lets the invitee complete their profile.
 */

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Shield, Loader2, AlertCircle, CheckCircle2,
  User, Lock, Phone, Mail,
} from "lucide-react";

interface InviteInfo {
  email: string;
  orgType: "HOSPITAL" | "HMO";
  orgId: string;
  orgName: string;
  roleName: string;
  inviterName: string;
  expiresAt: string;
}

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ firstName: "", lastName: "", password: "", confirmPassword: "", phoneNumber: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setLoadError(data.error);
        else setInvite(data);
      })
      .catch(() => setLoadError("Failed to load invite"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (form.password !== form.confirmPassword) {
      setSubmitError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          phoneNumber: form.phoneNumber,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to accept invite");
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login?invited=true");
      }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="w-full max-w-md data-visualization">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Invite invalid</h2>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={() => router.push("/auth/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="w-full max-w-md data-visualization">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-lg font-semibold">You're in!</h2>
            <p className="text-sm text-muted-foreground">
              Your account has been created. Redirecting to login…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isHospital = invite?.orgType === "HOSPITAL";

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />
      <div className="relative max-w-lg mx-auto px-6 py-12 space-y-6">

        {/* Invite context banner */}
        <Card className="data-visualization border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0
                ${isHospital ? "bg-blue-100 text-blue-700" : "bg-primary/10 text-primary"}`}>
                {isHospital ? <Building2 className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base">{invite?.orgName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {isHospital ? "Hospital" : "HMO"}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {invite?.roleName}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Invited by <span className="font-medium">{invite?.inviterName}</span>
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" /> {invite?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="data-visualization">
          <CardHeader>
            <CardTitle>Complete your profile</CardTitle>
            <CardDescription>
              Set up your account to join {invite?.orgName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> First name
                  </Label>
                  <Input id="firstName" value={form.firstName} onChange={set("firstName")}
                    placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" value={form.lastName} onChange={set("lastName")}
                    placeholder="Doe" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone number
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input id="phoneNumber" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")}
                  placeholder="+2348012345678" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                </Label>
                <Input value={invite?.email ?? ""} disabled className="bg-muted cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Password
                  </Label>
                  <Input id="password" type="password" value={form.password} onChange={set("password")}
                    placeholder="Min 8 characters" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm</Label>
                  <Input id="confirmPassword" type="password" value={form.confirmPassword}
                    onChange={set("confirmPassword")} placeholder="Re-enter" required />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
                  : "Accept invite & create account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
