"use client";

/**
 * Admin: Create HMO
 * Full onboarding form for registering a new Health Maintenance Organisation.
 * A default Standard Care Plan is auto-created alongside the HMO.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Hash,
} from "lucide-react";

interface FormState {
  name: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
}

const INITIAL: FormState = {
  name: "",
  address: "",
  city: "",
  state: "",
  phoneNumber: "",
  email: "",
  licenseNumber: "",
};

export default function CreateHmoPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdName, setCreatedName] = useState("");

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const missing = (Object.keys(INITIAL) as (keyof FormState)[]).filter(
      (k) => !form[k].trim()
    );
    if (missing.length) {
      setError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/hmos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create HMO");

      setCreatedName(form.name);
      setSuccess(true);
      setForm(INITIAL);
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
        <div className="px-6 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Admin Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Register HMO
            </h1>
            <p className="text-sm text-muted-foreground">
              Onboard a new Health Maintenance Organisation to the ClearMed network
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative max-w-2xl mx-auto px-6 py-10 space-y-6">
        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>HMO registered</AlertTitle>
            <AlertDescription>
              <strong>{createdName}</strong> has been added and a default Standard Care
              Plan has been created.{" "}
              <button
                onClick={() => router.push("/admin/hmos")}
                className="underline text-green-700 font-medium"
              >
                View all HMOs →
              </button>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="data-visualization">
          <CardHeader>
            <CardTitle className="text-foreground">HMO details</CardTitle>
            <CardDescription>
              All fields are required. A default Standard Care Plan will be created
              automatically. The licence number must be unique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  HMO name
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Hygeia HMO"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Street address
                </Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={set("address")}
                  placeholder="e.g. 12 Broad Street, Lagos Island"
                  required
                />
              </div>

              {/* City + State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={set("city")}
                    placeholder="e.g. Lagos"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={set("state")}
                    placeholder="e.g. Lagos"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={set("phoneNumber")}
                  placeholder="e.g. +2348012345678"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Official email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="e.g. info@hmo.ng"
                  required
                />
              </div>

              {/* Licence */}
              <div className="space-y-2">
                <Label htmlFor="license" className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Licence number
                </Label>
                <Input
                  id="license"
                  value={form.licenseNumber}
                  onChange={set("licenseNumber")}
                  placeholder="e.g. HMO-20240001"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be unique. Used for regulatory verification.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering…
                    </>
                  ) : (
                    "Register HMO"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
