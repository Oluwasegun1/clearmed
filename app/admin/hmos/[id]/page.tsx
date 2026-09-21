"use client";

/**
 * Admin HMO Detail page — /admin/hmos/[id]
 * Three tabs:
 *   1. Overview — editable HMO details (name, address, contact, logo URL) + activate/deactivate
 *   2. Coverage Plans — list plans, add new plan, toggle plan active/inactive
 *   3. Staff — read-only list of HMO staff members
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Save,
  PlusCircle,
  Users,
  FileText,
  MapPin,
  Phone,
  Mail,
  Hash,
  Image,
  Calendar,
  Building2,
  Coins,
  Percent,
  RotateCcw,
  Check,
  Ban,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Types ─────────────────────────────────────────────────── */

interface CoveragePlan {
  id: string;
  name: string;
  description: string | null;
  annualLimit: number | null;
  coveragePercent: number | null;
  includedServices: string | null;
  excludedServices: string | null;
  resetCadence: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { patients: number; coverageRules: number };
}

interface StaffMember {
  id: string;
  position: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
  };
}

interface HMODetail {
  id: string;
  name: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  email: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staff: StaffMember[];
  coveragePlans: CoveragePlan[];
  _count: { patients: number; hospitalContracts: number };
}

/* ── Helpers ─────────────────────────────────────────────── */

function fmtDate(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Overview / Edit Tab ────────────────────────────────── */

function OverviewTab({ hmo, onUpdated }: { hmo: HMODetail; onUpdated: () => void }) {
  const [form, setForm] = useState({
    name: hmo.name,
    address: hmo.address,
    city: hmo.city,
    state: hmo.state,
    phoneNumber: hmo.phoneNumber,
    email: hmo.email,
    logoUrl: hmo.logoUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hmos/${hmo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          logoUrl: form.logoUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("HMO details updated");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/hmos/${hmo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !hmo.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      toast.success(`"${hmo.name}" ${!hmo.isActive ? "activated" : "deactivated"}`);
      setConfirmToggle(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card className="data-visualization">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-foreground">Account Status</CardTitle>
              <CardDescription>Control whether this HMO is active on the platform</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {hmo.isActive ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Inactive
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmToggle(true)}
                disabled={toggling}
                className={hmo.isActive
                  ? "hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 gap-1.5"
                  : "hover:bg-emerald-500/10 hover:text-emerald-600 gap-1.5"}
              >
                {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : hmo.isActive ? (
                  <><XCircle className="h-4 w-4" /> Deactivate</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Activate</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Patients</p>
              <p className="font-semibold text-foreground mt-0.5">{hmo._count.patients}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hospital contracts</p>
              <p className="font-semibold text-foreground mt-0.5">{hmo._count.hospitalContracts}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registered</p>
              <p className="font-semibold text-foreground mt-0.5">{fmtDate(hmo.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="data-visualization">
        <CardHeader>
          <CardTitle className="text-base text-foreground">HMO Details</CardTitle>
          <CardDescription>
            Licence number cannot be changed. Changes are audit-logged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="hmo-name" className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" /> HMO Name
            </Label>
            <Input id="hmo-name" value={form.name} onChange={set("name")} />
          </div>

          {/* Licence (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-3.5 w-3.5" /> Licence Number (read-only)
            </Label>
            <Input value={hmo.licenseNumber} readOnly className="opacity-60 cursor-not-allowed" />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="hmo-address" className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Street Address
            </Label>
            <Input id="hmo-address" value={form.address} onChange={set("address")} />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hmo-city">City</Label>
              <Input id="hmo-city" value={form.city} onChange={set("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hmo-state">State</Label>
              <Input id="hmo-state" value={form.state} onChange={set("state")} />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="hmo-phone" className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
            </Label>
            <Input id="hmo-phone" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="hmo-email" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Official Email
            </Label>
            <Input id="hmo-email" type="email" value={form.email} onChange={set("email")} />
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="hmo-logo" className="flex items-center gap-2">
              <Image className="h-3.5 w-3.5 text-muted-foreground" /> Logo URL (optional)
            </Label>
            <Input
              id="hmo-logo"
              type="url"
              value={form.logoUrl}
              onChange={set("logoUrl")}
              placeholder="https://example.com/logo.png"
            />
            {form.logoUrl && (
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="h-12 w-auto rounded border border-border mt-1 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>

          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Confirm toggle */}
      {confirmToggle && (
        <Dialog open onOpenChange={(open) => !open && setConfirmToggle(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{hmo.isActive ? "Deactivate HMO" : "Activate HMO"}</DialogTitle>
              <DialogDescription>
                Are you sure you want to {hmo.isActive ? "deactivate" : "activate"}{" "}
                <strong>{hmo.name}</strong>?
                {hmo.isActive && (
                  <span className="block mt-2 text-rose-600 text-sm">
                    This will restrict access for all HMO staff and block new authorization processing.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmToggle(false)}>Cancel</Button>
              <Button
                variant={hmo.isActive ? "destructive" : "default"}
                disabled={toggling}
                onClick={toggleActive}
              >
                {toggling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {hmo.isActive ? "Yes, Deactivate" : "Yes, Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ── Coverage Plans Tab ──────────────────────────────────── */

function parseServiceList(jsonOrStr: string | null): string[] {
  if (!jsonOrStr) return [];
  try {
    const parsed = JSON.parse(jsonOrStr);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallback comma split
  }
  return jsonOrStr.split(",").map((s) => s.trim()).filter(Boolean);
}

function CoveragePlansTab({ hmoId }: { hmoId: string }) {
  const [plans, setPlans] = useState<CoveragePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    annualLimit: "",
    coveragePercent: "80",
    resetCadence: "ANNUAL",
    includedServices: "General Consultation, Pharmacy, Laboratory, Inpatient Services",
    excludedServices: "Cosmetic Surgery, Experimental Treatments",
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/hmos/${hmoId}/coverage-plans`);
      if (!res.ok) throw new Error("Failed to load plans");
      setPlans(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [hmoId]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const togglePlan = async (plan: CoveragePlan) => {
    setToggling(plan.id);
    try {
      const res = await fetch(`/api/admin/hmos/${hmoId}/coverage-plans`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, isActive: !plan.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update plan");
      toast.success(`"${plan.name}" ${!plan.isActive ? "activated" : "deactivated"}`);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setToggling(null);
    }
  };

  const addPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name.trim()) return;
    setAdding(true);
    try {
      const payload = {
        name: newPlan.name.trim(),
        description: newPlan.description.trim() || null,
        annualLimit: newPlan.annualLimit ? parseFloat(newPlan.annualLimit) : null,
        coveragePercent: newPlan.coveragePercent ? parseFloat(newPlan.coveragePercent) : null,
        resetCadence: newPlan.resetCadence,
        includedServices: newPlan.includedServices,
        excludedServices: newPlan.excludedServices,
      };

      const res = await fetch(`/api/admin/hmos/${hmoId}/coverage-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create plan");
      toast.success(`Coverage plan "${data.name}" created`);
      setNewPlan({
        name: "",
        description: "",
        annualLimit: "",
        coveragePercent: "80",
        resetCadence: "ANNUAL",
        includedServices: "General Consultation, Pharmacy, Laboratory, Inpatient Services",
        excludedServices: "Cosmetic Surgery, Experimental Treatments",
      });
      setShowAdd(false);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">HMO Coverage Plans</h3>
          <p className="text-xs text-muted-foreground">
            {plans.length} plan{plans.length !== 1 ? "s" : ""} defined for this HMO
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
          <PlusCircle className="h-4 w-4" /> Add Plan
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add plan form */}
      {showAdd && (
        <Card className="data-visualization border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base text-foreground">New Coverage Plan</CardTitle>
            <CardDescription>
              Define benefit limits, coverage percentage, services included/excluded, and reset cadence (v2.0 Section 12.1 & 27).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="plan-name">Plan name *</Label>
                  <Input
                    id="plan-name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Basic Plan or Premium Plan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-limit" className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground" /> Annual Limit (₦)
                  </Label>
                  <Input
                    id="plan-limit"
                    type="number"
                    min="0"
                    step="1000"
                    value={newPlan.annualLimit}
                    onChange={(e) => setNewPlan((p) => ({ ...p, annualLimit: e.target.value }))}
                    placeholder="e.g. 500000 or 2000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-percent" className="flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" /> Coverage Percentage (%)
                  </Label>
                  <Input
                    id="plan-percent"
                    type="number"
                    min="1"
                    max="100"
                    value={newPlan.coveragePercent}
                    onChange={(e) => setNewPlan((p) => ({ ...p, coveragePercent: e.target.value }))}
                    placeholder="e.g. 70 or 90"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="plan-reset" className="flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /> Annual Limit Reset Cadence (v2.0)
                  </Label>
                  <Select
                    value={newPlan.resetCadence}
                    onValueChange={(val) => setNewPlan((p) => ({ ...p, resetCadence: val }))}
                  >
                    <SelectTrigger id="plan-reset">
                      <SelectValue placeholder="Select cadence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANNUAL">Annual (Calendar Year: Jan 1 – Dec 31)</SelectItem>
                      <SelectItem value="POLICY_START">Policy Start (12 months from enrolment)</SelectItem>
                      <SelectItem value="MONTHLY">Monthly Reset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="plan-inc" className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Included Services (comma-separated)
                  </Label>
                  <Input
                    id="plan-inc"
                    value={newPlan.includedServices}
                    onChange={(e) => setNewPlan((p) => ({ ...p, includedServices: e.target.value }))}
                    placeholder="General Consultation, Pharmacy, Laboratory, Inpatient Services"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="plan-exc" className="flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5 text-rose-600" /> Excluded Services (comma-separated)
                  </Label>
                  <Input
                    id="plan-exc"
                    value={newPlan.excludedServices}
                    onChange={(e) => setNewPlan((p) => ({ ...p, excludedServices: e.target.value }))}
                    placeholder="Cosmetic Surgery, Experimental Treatments, Dental Implants"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="plan-desc">Description (optional)</Label>
                  <Textarea
                    id="plan-desc"
                    rows={2}
                    value={newPlan.description}
                    onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Comprehensive health plan covering primary, secondary, and emergency medical care…"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={adding} className="gap-2">
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Create Plan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Plans list */}
      {plans.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl p-8">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">No coverage plans yet</p>
          <p className="text-sm mt-1">Add the first plan using the button above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const inc = parseServiceList(plan.includedServices);
            const exc = parseServiceList(plan.excludedServices);

            return (
              <Card key={plan.id} className="data-visualization">
                <CardContent className="pt-5 pb-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-bold text-foreground text-base">{plan.name}</h4>
                        {plan.isActive ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                            Inactive
                          </Badge>
                        )}
                        {plan.resetCadence && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                            Reset: {plan.resetCadence.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>

                      {plan.description && (
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      )}

                      {/* Key Coverage Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-card/60 border border-border text-xs">
                        <div>
                          <span className="text-muted-foreground">Annual Limit:</span>
                          <p className="font-bold text-foreground text-sm font-mono mt-0.5">
                            {plan.annualLimit ? `₦${plan.annualLimit.toLocaleString()}` : "Unlimited"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coverage:</span>
                          <p className="font-bold text-foreground text-sm mt-0.5">
                            {plan.coveragePercent ? `${plan.coveragePercent}%` : "Standard"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Enrolled Patients:</span>
                          <p className="font-bold text-foreground text-sm mt-0.5">
                            {plan._count.patients}
                          </p>
                        </div>
                      </div>

                      {/* Included & Excluded Services */}
                      <div className="space-y-2 text-xs">
                        {inc.length > 0 && (
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className="font-semibold text-emerald-600 flex items-center gap-1 shrink-0 mt-0.5">
                              <Check className="h-3 w-3" /> Included:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {inc.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[11px]"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {exc.length > 0 && (
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className="font-semibold text-rose-600 flex items-center gap-1 shrink-0 mt-0.5">
                              <Ban className="h-3 w-3" /> Excluded:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {exc.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20 text-[11px]"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Created {fmtDate(plan.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={toggling === plan.id}
                        onClick={() => togglePlan(plan)}
                        className={`gap-1.5 text-xs h-8 ${plan.isActive
                          ? "hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30"
                          : "hover:bg-emerald-500/10 hover:text-emerald-600"}`}
                      >
                        {toggling === plan.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : plan.isActive ? (
                          <><XCircle className="h-3.5 w-3.5" /> Deactivate</>
                        ) : (
                          <><CheckCircle2 className="h-3.5 w-3.5" /> Activate</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Staff Tab ──────────────────────────────────────────── */

function StaffTab({ staff }: { staff: StaffMember[] }) {
  if (staff.length === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No staff members yet</p>
      <p className="text-sm mt-1">HMO staff are added via the invite flow.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{staff.length} staff member{staff.length !== 1 ? "s" : ""}</p>
      {staff.map((s) => (
        <Card key={s.id} className="data-visualization">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {s.user.firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {s.user.firstName} {s.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{s.position?.toLowerCase().replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {s.user.isActive ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-semibold">
                    <XCircle className="h-3.5 w-3.5" /> Inactive
                  </span>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3" /> Joined {fmtDate(s.user.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */

export default function HmoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [hmo, setHmo] = useState<HMODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHmo = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/hmos/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load HMO");
      }
      setHmo(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchHmo(); }, [fetchHmo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !hmo) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "HMO not found"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/admin/hmos")}>
          ← Back to HMOs
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-auto">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/hmos">
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <ArrowLeft className="h-4 w-4" /> All HMOs
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {hmo.logoUrl ? (
                <img
                  src={hmo.logoUrl}
                  alt={`${hmo.name} logo`}
                  className="h-10 w-10 rounded-lg object-contain border border-border bg-muted"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {hmo.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-foreground">{hmo.name}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> {hmo.city}, {hmo.state}
                  <span className="text-border">·</span>
                  <span className="font-mono">{hmo.licenseNumber}</span>
                </p>
              </div>
            </div>
          </div>
          {hmo.isActive ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 shrink-0">
              <XCircle className="h-3 w-3 mr-1" /> Inactive
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="relative max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <FileText className="h-4 w-4" /> Coverage Plans
              <Badge variant="secondary" className="ml-1 text-xs">{hmo.coveragePlans.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <Users className="h-4 w-4" /> Staff
              <Badge variant="secondary" className="ml-1 text-xs">{hmo.staff.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab hmo={hmo} onUpdated={fetchHmo} />
          </TabsContent>

          <TabsContent value="plans">
            <CoveragePlansTab hmoId={hmo.id} />
          </TabsContent>

          <TabsContent value="staff">
            <StaffTab staff={hmo.staff} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
