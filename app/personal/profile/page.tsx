"use client";

/**
 * Patient Profile — ClearMed Section 11 Compliance.
 * Allows viewing and editing permitted profile fields (First name, Last name, Phone number, Email, Profile Photo).
 * Sensitive membership and HMO parameters are strictly read-only and locked.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared";
import {
  User,
  Shield,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  Building,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  PlusCircle,
  FileText,
  Lock,
  Camera,
  ShieldAlert,
  Wallet,
} from "lucide-react";

interface ProfileData {
  id: string;
  membershipNumber: string;
  coverageStartDate: string;
  coverageEndDate: string;
  coveragePercentage: number;
  annualLimit: number;
  usedAmount: number;
  remainingCoverage: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
  };
  hmo: {
    id: string;
    name: string;
  };
  coveragePlan: {
    id: string;
    name: string;
    description?: string | null;
  };
  recentAuthorizations: Array<{
    id: string;
    status: string;
    requestDate: string;
    quantity: number;
    service: {
      name: string;
      standardPrice: number;
    };
    hospital: {
      name: string;
    };
  }>;
}

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form edit states (Permitted profile information)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/patient/profile");
        if (!res.ok) throw new Error("Failed to load patient profile");
        const data = await res.json();
        setProfile(data);
        setFirstName(data.user?.firstName || "");
        setLastName(data.user?.lastName || "");
        setEmail(data.user?.email || "");
        setPhoneNumber(data.user?.phoneNumber || "");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error loading profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setSuccessMsg("Personal profile information updated successfully!");
      if (profile) {
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            firstName,
            lastName,
            phoneNumber,
          },
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const remainingBalance = profile ? Math.max(0, profile.annualLimit - profile.usedAmount) : 0;
  const usedPercentage = profile && profile.annualLimit > 0
    ? Math.min(100, Math.round((profile.usedAmount / profile.annualLimit) * 100))
    : 0;

  return (
    <PersonalSidebarWrapper currentPath="/personal/profile">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-6xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" /> Patient Profile & Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage personal contact details and view verified HMO coverage credentials
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/personal/coverage">
                <Shield className="h-4 w-4 text-primary" /> View Coverage Plan
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/personal/request/new">
                <PlusCircle className="h-4 w-4" /> New Authorization
              </Link>
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle>Profile Updated</AlertTitle>
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Editable Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="data-visualization">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Permitted Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your name, contact phone number, and personal preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-6">
                    {/* Avatar / Photo Selector */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/80">
                      <div className={`h-16 w-16 rounded-full bg-gradient-to-tr ${AVATAR_COLORS[avatarIndex]} flex items-center justify-center text-white text-xl font-bold shadow-md`}>
                        {firstName?.[0]?.toUpperCase() || "P"}{lastName?.[0]?.toUpperCase() || "T"}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5" /> Profile Photo / Avatar Badge
                        </Label>
                        <p className="text-xs text-muted-foreground">Select an avatar style color</p>
                        <div className="flex gap-2 pt-1">
                          {AVATAR_COLORS.map((color, idx) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setAvatarIndex(idx)}
                              className={`h-6 w-6 rounded-full bg-gradient-to-tr ${color} border-2 ${
                                avatarIndex === idx ? "border-primary scale-110" : "border-transparent"
                              } transition-all`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Name Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                        </Label>
                        <Input
                          id="email"
                          value={email}
                          disabled
                          className="bg-muted/40 cursor-not-allowed font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">Primary system login email</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
                        </Label>
                        <Input
                          id="phone"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button type="submit" disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Recent Authorizations */}
              <Card className="data-visualization">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Authorization History
                    </CardTitle>
                    <CardDescription>Recent pre-authorizations submitted to your HMO</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
                    <Link href="/personal/requests">
                      View All <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {profile.recentAuthorizations.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      No authorization requests found.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {profile.recentAuthorizations.map((req) => (
                        <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{req.service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {req.hospital.name} • {new Date(req.requestDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold">
                              ₦{(req.service.standardPrice * req.quantity).toLocaleString()}
                            </span>
                            <StatusBadge status={req.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Sensitive Membership & HMO Information (Section 11: Non-editable) */}
            <div className="space-y-6">
              {/* Sensitive HMO Info Card */}
              <Card className="data-visualization border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">HMO Coverage</span>
                    <Badge variant="outline" className="text-[10px] bg-muted gap-1 text-muted-foreground border-border">
                      <Lock className="h-3 w-3" /> Read-Only
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold mt-1">{profile.hmo.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Plan: <span className="font-semibold text-foreground">{profile.coveragePlan.name}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* Security Banner per Section 11 */}
                  <div className="p-3 bg-muted/50 rounded-lg border border-border text-xs text-muted-foreground flex items-start gap-2">
                    <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>HMO Policy Information:</strong> Sensitive membership and policy limits are managed directly by your HMO and cannot be edited by patients.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-background/90 border text-xs space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Membership No:</span>
                      <span className="font-mono font-bold text-foreground text-sm">{profile.membershipNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Coverage Rate:</span>
                      <span className="font-semibold text-emerald-600">{profile.coveragePercentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Policy Period:</span>
                      <span className="text-muted-foreground">
                        {new Date(profile.coverageStartDate).toLocaleDateString()} – {new Date(profile.coverageEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Coverage Limits & Section 12 Remaining Formula */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Annual Spending Limit:</span>
                      <span className="font-bold">₦{profile.annualLimit.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          usedPercentage > 85 ? "bg-red-500" : usedPercentage > 60 ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${usedPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Used: ₦{profile.usedAmount.toLocaleString()} ({usedPercentage}%)</span>
                      <span className="text-emerald-600 font-semibold">Remaining: ₦{remainingBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button asChild variant="outline" className="w-full text-xs mt-2" size="sm">
                    <Link href="/personal/coverage">
                      View Itemised Benefits & Rules
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="data-visualization">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Patient Hub Shortcuts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="secondary" className="w-full justify-start text-xs h-9" size="sm">
                    <Link href="/personal/request/new">
                      <PlusCircle className="h-3.5 w-3.5 mr-2 text-primary" />
                      Submit New Authorization Request
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full justify-start text-xs h-9" size="sm">
                    <Link href="/personal/authorizations">
                      <FileText className="h-3.5 w-3.5 mr-2 text-primary" />
                      Track Authorizations & Claims
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full justify-start text-xs h-9" size="sm">
                    <Link href="/personal/providers">
                      <Building className="h-3.5 w-3.5 mr-2 text-primary" />
                      Find Network Hospitals
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </PersonalSidebarWrapper>
  );
}
