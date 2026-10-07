"use client";

import { useState, useEffect, useCallback } from "react";
import { HMOSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  PageShell,
  PageHeader,
  MetricCard,
} from "@/components/shared";
import { HMOPlanSetupModal } from "@/components/hmo";
import {
  Layers,
  Plus,
  RefreshCw,
  Users,
  Shield,
  Percent,
  DollarSign,
  CheckCircle2,
  FileText,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface CoveragePlan {
  id: string;
  name: string;
  description: string | null;
  annualLimit: number | null;
  coveragePercent: number | null;
  resetCadence: string;
  includedServices: string | null;
  excludedServices: string | null;
  createdAt: string;
  _count?: {
    patients: number;
    coverageRules: number;
  };
}

export default function HMOPlansPage() {
  const [plans, setPlans] = useState<CoveragePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hmo/coverage-plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : []);
      } else {
        toast.error("Failed to load coverage plans");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while loading plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const totalPatients = plans.reduce((acc, p) => acc + (p._count?.patients ?? 0), 0);
  const avgCoverage = plans.length
    ? Math.round(plans.reduce((acc, p) => acc + (p.coveragePercent ?? 100), 0) / plans.length)
    : 0;

  const parseServices = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <HMOSidebarWrapper currentPath="/hmo/plans">
      <PageShell>
        <PageHeader
          title="Coverage Plans"
          subtitle="Manage healthcare coverage packages, member benefit limits, and coverage percentages"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPlans}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setSetupModalOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add New Plan
              </Button>
            </div>
          }
        />

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Total Plans"
            value={plans.length.toString()}
            icon={Layers}
            iconColor="primary"
            sub="Active coverage packages"
          />
          <MetricCard
            label="Enrolled Beneficiaries"
            value={totalPatients.toLocaleString()}
            icon={Users}
            iconColor="green"
            sub="Across all plans"
          />
          <MetricCard
            label="Average Benefit Cover"
            value={`${avgCoverage}%`}
            icon={Percent}
            iconColor="blue"
            sub="Mean co-pay support"
          />
        </div>

        {/* Plans Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Active Plan Catalog
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border/60">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Loading coverage plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border/80 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-semibold text-foreground">No coverage plans configured yet</h4>
                <p className="text-xs text-muted-foreground">
                  Create your first plan to start allowing patients and corporate groups to enroll with your HMO.
                </p>
              </div>
              <Button onClick={() => setSetupModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Set Up Plans Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const incServices = parseServices(plan.includedServices);
                return (
                  <Card
                    key={plan.id}
                    className="flex flex-col justify-between border-border/70 hover:border-primary/50 transition-all shadow-sm hover:shadow-md bg-card/60 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg font-bold text-foreground">
                          {plan.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="font-mono bg-primary/5 text-primary border-primary/20 text-xs shrink-0"
                        >
                          {plan.coveragePercent ?? 100}% Cover
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {plan.description || "No description specified for this plan."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <div className="p-3 bg-muted/40 rounded-xl border border-border/40 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Annual Benefit Limit</span>
                          <span className="font-bold text-foreground">
                            {plan.annualLimit ? `₦${plan.annualLimit.toLocaleString()}` : "Unlimited"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Reset Schedule</span>
                          <span className="font-medium text-foreground capitalize">
                            {plan.resetCadence.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Enrolled Members</span>
                          <span className="font-semibold text-foreground">
                            {plan._count?.patients ?? 0}
                          </span>
                        </div>
                      </div>

                      {incServices.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Included Benefits ({incServices.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {incServices.map((srv) => (
                              <Badge
                                key={srv}
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 font-normal bg-background/80"
                              >
                                {srv}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {plan.excludedServices && (
                        <div className="text-[11px] text-muted-foreground line-clamp-2 pt-1 border-t border-border/40">
                          <span className="font-medium text-foreground">Exclusions: </span>
                          {plan.excludedServices}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Setup Modal */}
        <HMOPlanSetupModal
          open={setupModalOpen}
          onOpenChange={setSetupModalOpen}
          onPlansUpdated={fetchPlans}
        />
      </PageShell>
    </HMOSidebarWrapper>
  );
}
