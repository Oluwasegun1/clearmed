"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  Plus,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Trash2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

interface CoveragePlanItem {
  id: string;
  name: string;
  description: string | null;
  annualLimit: number | null;
  coveragePercent: number | null;
  resetCadence: string;
  includedServices: string | null;
  excludedServices: string | null;
  _count?: {
    patients: number;
  };
}

interface HMOPlanSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlansUpdated?: () => void;
}

const COMMON_SERVICES = [
  "General Consultation",
  "Specialist Consultation",
  "Emergency & Trauma",
  "Basic Lab & Diagnostics",
  "Advanced Imaging (CT/MRI)",
  "Prescription Medications",
  "Minor Surgery",
  "Major Surgery",
  "Maternity & Antenatal",
  "Dental Care",
  "Optical Care",
  "Physiotherapy",
];

const PRESETS = [
  {
    name: "Bronze / Basic Care",
    description: "Affordable basic healthcare coverage for individuals and entry-level employees.",
    annualLimit: 500000,
    coveragePercent: 80,
    resetCadence: "ANNUAL",
    includedServices: [
      "General Consultation",
      "Emergency & Trauma",
      "Basic Lab & Diagnostics",
      "Prescription Medications",
    ],
    excludedServices: "Cosmetic procedures, overseas care, experimental treatments, major elective surgery",
  },
  {
    name: "Silver / Standard Plan",
    description: "Comprehensive coverage covering essential diagnostics, maternity, and specialist visits.",
    annualLimit: 1500000,
    coveragePercent: 90,
    resetCadence: "ANNUAL",
    includedServices: [
      "General Consultation",
      "Specialist Consultation",
      "Emergency & Trauma",
      "Basic Lab & Diagnostics",
      "Prescription Medications",
      "Minor Surgery",
      "Maternity & Antenatal",
      "Dental Care",
    ],
    excludedServices: "Cosmetic surgery, overseas treatment, high-end experimental therapy",
  },
  {
    name: "Gold / Comprehensive",
    description: "Premium healthcare package with wide specialist coverage, major surgical and diagnostic cover.",
    annualLimit: 5000000,
    coveragePercent: 100,
    resetCadence: "ANNUAL",
    includedServices: [
      "General Consultation",
      "Specialist Consultation",
      "Emergency & Trauma",
      "Basic Lab & Diagnostics",
      "Advanced Imaging (CT/MRI)",
      "Prescription Medications",
      "Minor Surgery",
      "Major Surgery",
      "Maternity & Antenatal",
      "Dental Care",
      "Optical Care",
      "Physiotherapy",
    ],
    excludedServices: "Pure cosmetic surgery, non-medical wellness resorts",
  },
];

export function HMOPlanSetupModal({
  open,
  onOpenChange,
  onPlansUpdated,
}: HMOPlanSetupModalProps) {
  const [existingPlans, setExistingPlans] = useState<CoveragePlanItem[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [annualLimit, setAnnualLimit] = useState<number | string>(1500000);
  const [coveragePercent, setCoveragePercent] = useState<number | string>(90);
  const [resetCadence, setResetCadence] = useState("ANNUAL");
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "General Consultation",
    "Emergency & Trauma",
    "Basic Lab & Diagnostics",
    "Prescription Medications",
  ]);
  const [excludedServices, setExcludedServices] = useState("");

  const fetchExistingPlans = async () => {
    try {
      setLoadingExisting(true);
      const res = await fetch("/api/hmo/coverage-plans");
      if (res.ok) {
        const data = await res.json();
        setExistingPlans(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load HMO coverage plans:", err);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchExistingPlans();
      setError(null);
    }
  }, [open]);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setDescription(preset.description);
    setAnnualLimit(preset.annualLimit);
    setCoveragePercent(preset.coveragePercent);
    setResetCadence(preset.resetCadence);
    setSelectedServices(preset.includedServices);
    setExcludedServices(preset.excludedServices);
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleCreatePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a plan name");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/hmo/coverage-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          annualLimit: annualLimit ? Number(annualLimit) : null,
          coveragePercent: coveragePercent ? Number(coveragePercent) : 100,
          resetCadence,
          includedServices: selectedServices,
          excludedServices: excludedServices.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create plan");
      }

      toast.success(`Plan "${name}" created successfully!`);
      // Reset form
      setName("");
      setDescription("");
      setAnnualLimit(2000000);
      setCoveragePercent(100);
      setExcludedServices("");

      await fetchExistingPlans();
      if (onPlansUpdated) onPlansUpdated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error creating coverage plan";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:rounded-2xl">
        <DialogHeader className="space-y-2 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Set Up Health Coverage Plans
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Define the coverage packages, limits, and covered benefits that patients and corporate clients can enroll in.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">Error</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* Existing Plans preview */}
          {existingPlans.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Configured Plans ({existingPlans.length})
                </span>
                <span className="text-xs text-muted-foreground">
                  Available for patient enrollment
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {existingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex flex-col justify-between p-3 rounded-lg border border-border/60 bg-card shadow-sm hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground">{plan.name}</p>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0 bg-primary/5 text-primary border-primary/20">
                        {plan.coveragePercent ?? 100}% Cover
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {plan.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                      <span>Limit: {plan.annualLimit ? `₦${plan.annualLimit.toLocaleString()}` : "Unlimited"}</span>
                      <span>{plan._count?.patients ?? 0} Enrolled</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Quick-Start Templates
              </Label>
              <span className="text-[11px] text-muted-foreground">Click a template to pre-fill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => handleApplyPreset(preset)}
                  className="group relative flex flex-col text-left p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/60 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                      {preset.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      ₦{(preset.annualLimit / 1000000).toFixed(1)}M
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Plan Form */}
          <form onSubmit={handleCreatePlan} className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Plan Details
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="planName" className="text-xs font-medium">
                  Plan Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="planName"
                  placeholder="e.g. Standard Corporate Care"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="annualLimit" className="text-xs font-medium">
                    Annual Limit (₦)
                  </Label>
                  <Input
                    id="annualLimit"
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="2000000"
                    value={annualLimit}
                    onChange={(e) => setAnnualLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="coveragePercent" className="text-xs font-medium">
                    Coverage %
                  </Label>
                  <Input
                    id="coveragePercent"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="90"
                    value={coveragePercent}
                    onChange={(e) => setCoveragePercent(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium">
                Summary / Description
              </Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="Brief summary of eligibility, target members, and hospital network tier..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Covered Services Checkboxes */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-medium">Covered Benefits & Services</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_SERVICES.map((srv) => {
                  const isChecked = selectedServices.includes(srv);
                  return (
                    <button
                      type="button"
                      key={srv}
                      onClick={() => toggleService(srv)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all ${
                        isChecked
                          ? "border-primary/60 bg-primary/10 text-primary font-medium"
                          : "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isChecked && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <span className="truncate">{srv}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="excludedServices" className="text-xs font-medium">
                Excluded Services (Optional)
              </Label>
              <Input
                id="excludedServices"
                placeholder="e.g. Overseas treatment, cosmetic surgery, non-generic medication"
                value={excludedServices}
                onChange={(e) => setExcludedServices(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Plan...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add This Plan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {existingPlans.length > 0
              ? `${existingPlans.length} plan(s) ready for member enrollment.`
              : "Create at least one plan so patients can register under your HMO."}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {existingPlans.length > 0 ? "Done" : "Close"}
            </Button>
            {existingPlans.length > 0 && (
              <Button
                type="button"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onOpenChange(false)}
              >
                <CheckCircle2 className="h-4 w-4" /> Finished Setup
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
