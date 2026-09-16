"use client";

/**
 * Coverage & Benefits — enhanced view.
 * Shows:
 *   - Plan summary (name, HMO, membership number, coverage %, annual limit)
 *   - Itemised table of covered services: name, category, coverage %, annual limit,
 *     whether pre-auth is required, and waiting period.
 */

import { useEffect, useState } from "react";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import CoverageCard from "../dashboard/coverage-card";

interface CoverageRule {
  id: string;
  service: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    code: string;
    standardPrice: number;
  };
  coveragePercentage: number;
  requiresPreAuth: boolean;
  annualLimit: number | null;
  waitingPeriod: number;
}

interface CoverageData {
  membershipNumber: string;
  hmo: { id: string; name: string; email: string; phoneNumber: string };
  coveragePlan: { id: string; name: string; description: string | null; isActive: boolean };
  coverageRules: CoverageRule[];
}

const CATEGORIES = [
  "All",
  "Consultation",
  "Laboratory",
  "Medication",
  "Surgery",
  "Radiology",
  "Physiotherapy",
  "Dental",
  "Optical",
  "Maternity",
];

export default function CoveragePage() {
  const [patientData, setPatientData] = useState<{
    coveragePlan?: { name?: string };
    hmo?: { name?: string };
    membershipNumber?: string;
    coverageStartDate?: string;
    coverageEndDate?: string;
    coveragePercentage?: number;
    annualLimit?: number;
    usedAmount?: number;
    reservedAmount?: number;
    remainingCoverage?: number;
  } | null>(null);

  const [coverageData, setCoverageData] = useState<CoverageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, coverageRes] = await Promise.all([
          fetch("/api/patient/profile"),
          fetch("/api/patient/coverage"),
        ]);
        if (profileRes.ok) setPatientData(await profileRes.json());
        if (coverageRes.ok) setCoverageData(await coverageRes.json());
      } catch {
        // silently fall through; UI shows empty states
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredRules = (coverageData?.coverageRules ?? []).filter((rule) => {
    const matchesSearch =
      !search ||
      rule.service.name.toLowerCase().includes(search.toLowerCase()) ||
      rule.service.category.toLowerCase().includes(search.toLowerCase()) ||
      rule.service.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || rule.service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Unique categories from actual rules
  const availableCategories = [
    "All",
    ...Array.from(
      new Set(coverageData?.coverageRules.map((r) => r.service.category) ?? [])
    ).sort(),
  ];

  return (
    <PersonalSidebarWrapper currentPath="/personal/coverage">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />

        {/* Page header */}
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Coverage &amp; Benefits
            </h1>
            <p className="text-sm text-muted-foreground">
              Your plan details, covered services, and pre-authorisation requirements
            </p>
          </div>
        </div>

        <div className="relative p-6 space-y-8">
          {/* ── Plan summary card ─────────────────────────────── */}
          {isLoading ? (
            <Card className="data-visualization">
              <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : patientData ? (
            <CoverageCard
              planName={patientData.coveragePlan?.name ?? "Basic Plan"}
              hmoName={patientData.hmo?.name ?? "Default HMO"}
              membershipNumber={patientData.membershipNumber ?? "N/A"}
              coverageStartDate={
                patientData.coverageStartDate
                  ? new Date(patientData.coverageStartDate)
                  : new Date()
              }
              coverageEndDate={
                patientData.coverageEndDate
                  ? new Date(patientData.coverageEndDate)
                  : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              }
              coveragePercentage={patientData.coveragePercentage ?? 80}
              annualLimit={patientData.annualLimit ?? 500000}
              usedAmount={patientData.usedAmount ?? 0}
              reservedAmount={patientData.reservedAmount ?? 0}
            />
          ) : (
            <Card className="data-visualization">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">Coverage unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We could not load your coverage details. Try again later.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── HMO & Plan info strip ────────────────────────── */}
          {coverageData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="data-visualization">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">HMO Provider</p>
                    <p className="font-semibold text-sm text-foreground">
                      {coverageData.hmo.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="data-visualization">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coverage Plan</p>
                    <p className="font-semibold text-sm text-foreground">
                      {coverageData.coveragePlan.name}
                    </p>
                    <Badge
                      variant={coverageData.coveragePlan.isActive ? "secondary" : "outline"}
                      className={`mt-0.5 text-[10px] ${
                        coverageData.coveragePlan.isActive
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : ""
                      }`}
                    >
                      {coverageData.coveragePlan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="data-visualization">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Membership No.</p>
                    <p className="font-semibold text-sm text-foreground font-mono">
                      {coverageData.membershipNumber}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Covered services table ───────────────────────── */}
          {isLoading ? null : coverageData ? (
            <Card className="data-visualization">
              <CardHeader>
                <CardTitle className="text-base">Covered Services</CardTitle>
                <CardDescription>
                  {coverageData.coverageRules.length} services covered under your plan •
                  Services marked with &quot;Pre-Auth Required&quot; need prior approval
                  before receiving care
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search & category filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by service name or code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          categoryFilter === cat
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredRules.length === 0 ? (
                  <div className="text-center py-10">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No services found for this filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Service
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Category
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Coverage %
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Annual Limit
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Pre-Auth
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Waiting Period
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredRules.map((rule) => (
                          <tr
                            key={rule.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">
                                  {rule.service.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  {rule.service.code}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="text-xs">
                                {rule.service.category}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${rule.coveragePercentage}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-foreground text-sm">
                                  {rule.coveragePercentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-medium text-foreground">
                                {rule.annualLimit
                                  ? `₦${rule.annualLimit.toLocaleString()}`
                                  : "Unlimited"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {rule.requiresPreAuth ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                                  <XCircle className="h-3.5 w-3.5" />
                                  Required
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Not Required
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {rule.waitingPeriod > 0 ? (
                                <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                                  <Clock className="h-3.5 w-3.5" />
                                  {rule.waitingPeriod} day{rule.waitingPeriod !== 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-amber-500" />
                    Pre-Auth Required — you must get prior approval before this service
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Not Required — service can be received without prior approval
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
