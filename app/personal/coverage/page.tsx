"use client";

/**
 * Coverage & Benefits: view plan benefits and coverage details. Uses project design system.
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
import { AlertCircle, Loader2 } from "lucide-react";
import CoverageCard from "../dashboard/coverage-card";

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
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/patient/profile");
        if (response.ok) {
          const data = await response.json();
          setPatientData(data);
        }
      } catch {
        setPatientData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <PersonalSidebarWrapper currentPath="/personal/coverage">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Coverage & Benefits
            </h1>
            <p className="text-sm text-muted-foreground">
              Your plan details and what is covered
            </p>
          </div>
        </div>
        <div className="relative p-6">
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
              annualLimit={patientData.annualLimit ?? 1_000_000}
              usedAmount={patientData.usedAmount ?? 0}
            />
          ) : (
            <Card className="data-visualization">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">
                  Coverage unavailable
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We could not load your coverage details. Try again later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
