"use client";

/**
 * Patient Dashboard — Insurance & Coverage Card
 * Implements exact Section 12 Coverage Calculations:
 * • Service Cost — Submitted cost per service
 * • HMO Payable = Service Cost × Coverage Percentage (85%)
 * • Patient Responsibility = Service Cost − HMO Payable (15%)
 * • Used Amount increments by HMO Payable ONLY when individual service reaches COMPLETED status. Approval reserves amount; does not consume it.
 * • Remaining Coverage = Annual Limit − Used Amount (sum of completed services only).
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, Calendar, TrendingUp, ArrowUpRight, Wallet, Clock, UserCheck } from "lucide-react";

interface CoverageCardProps {
  planName: string;
  hmoName: string;
  membershipNumber: string;
  coverageStartDate: Date;
  coverageEndDate: Date;
  coveragePercentage: number;
  annualLimit: number;
  usedAmount: number;
  reservedAmount?: number;
}

export default function CoverageCard({
  planName,
  hmoName,
  membershipNumber,
  coverageStartDate,
  coverageEndDate,
  coveragePercentage,
  annualLimit,
  usedAmount,
  reservedAmount = 0,
}: CoverageCardProps) {
  // Section 12 Formula: Remaining coverage = Annual Limit − Used Amount (completed services only)
  const remainingCoverage = Math.max(0, annualLimit - usedAmount);
  const usagePercentage = annualLimit > 0 ? Math.min(100, Math.round((usedAmount / annualLimit) * 100)) : 0;
  const patientCopayPercentage = 100 - coveragePercentage;

  const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card className="data-visualization border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{hmoName}</h3>
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[11px]">
                  Active Policy
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Plan: <span className="font-semibold text-foreground">{planName}</span>
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0">
            <Link href="/personal/coverage">
              View Benefit Rules <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Coverage Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-muted/40 rounded-lg border border-border/80 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" /> Membership Number
            </span>
            <p className="text-base font-bold font-mono text-foreground">{membershipNumber}</p>
          </div>

          <div className="p-3.5 bg-muted/40 rounded-lg border border-border/80 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Policy Validity
            </span>
            <p className="text-xs font-semibold text-foreground">
              {formatDate(coverageStartDate)} – {formatDate(coverageEndDate)}
            </p>
          </div>

          <div className="p-3.5 bg-muted/40 rounded-lg border border-border/80 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Coverage Split
            </span>
            <p className="text-xs font-bold text-foreground">
              <span className="text-emerald-600">{coveragePercentage}% HMO</span> • <span className="text-muted-foreground">{patientCopayPercentage}% Patient</span>
            </p>
          </div>
        </div>

        {/* Annual Limit Progress & Section 12 Calculation Breakdown */}
        <div className="p-4 bg-muted/30 rounded-xl border border-border/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Annual Coverage Limit & Consumption</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Remaining Coverage:</span>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                {formatNaira(remainingCoverage)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Progress value={usagePercentage} className="h-2.5 bg-secondary" />
            <div className="flex justify-between text-xs text-muted-foreground flex-wrap gap-1">
              <span>Consumed (Completed): <strong className="text-foreground">{formatNaira(usedAmount)}</strong> ({usagePercentage}%)</span>
              {reservedAmount > 0 && (
                <span className="text-amber-600 font-medium">
                  Reserved (Approved): {formatNaira(reservedAmount)}
                </span>
              )}
              <span>Annual Limit: <strong className="text-foreground">{formatNaira(annualLimit)}</strong></span>
            </div>
          </div>

          {/* Formula calculation explanation */}
          <div className="p-2.5 rounded-lg bg-background/80 border text-[11px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>• HMO Payable per Service:</span>
              <span className="font-mono text-foreground font-medium">Service Cost × {coveragePercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>• Patient Responsibility:</span>
              <span className="font-mono text-foreground font-medium">Service Cost × {patientCopayPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>• Remaining Coverage (Formula):</span>
              <span className="font-mono text-emerald-600 font-semibold">{formatNaira(annualLimit)} − {formatNaira(usedAmount)} = {formatNaira(remainingCoverage)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
