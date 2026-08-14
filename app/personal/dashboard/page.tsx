"use client";

import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText } from "lucide-react";
import CoverageCard from "./coverage-card";
import AuthorizationList from "./authorization-list";
import { DashboardHeader } from "./dashboard-header";
import { StatCards } from "./stat-cards";
import { HealthTrendsAndActions } from "./health-trends";
import { UpcomingAppointments } from "./upcoming-appointments";
import { RecentActivity } from "./recent-activity";
import { PageShell, SectionHeader } from "@/components/shared";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PatientData {
  id: string;
  membershipNumber: string;
  coverageStartDate?: string | null;
  coverageEndDate?: string | null;
  coveragePercentage?: number | null;
  annualLimit?: number | null;
  usedAmount: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
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
  recentAuthorizations?: Array<Record<string, unknown>>;
}

function CoverageSection({
  isLoading,
  patientData,
}: {
  isLoading: boolean;
  patientData: PatientData | null;
}) {
  if (isLoading) {
    return (
      <Card className="data-visualization">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded-full w-1/4" />
            <div className="h-8 bg-muted rounded-full w-1/2" />
            <div className="h-4 bg-muted rounded-full w-3/4" />
            <div className="h-4 bg-muted rounded-full w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (patientData) {
    return (
      <CoverageCard
        planName={patientData.coveragePlan?.name || "Basic Plan"}
        hmoName={patientData.hmo?.name || "Default HMO"}
        membershipNumber={patientData.membershipNumber || "N/A"}
        coverageStartDate={new Date(patientData.coverageStartDate || Date.now())}
        coverageEndDate={
          new Date(
            patientData.coverageEndDate ||
              new Date().setFullYear(new Date().getFullYear() + 1)
          )
        }
        coveragePercentage={patientData.coveragePercentage || 80}
        annualLimit={patientData.annualLimit || 1000000}
        usedAmount={patientData.usedAmount || 250000}
      />
    );
  }

  return (
    <Card className="data-visualization">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Coverage Information Unavailable
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              We couldn&apos;t retrieve your coverage details at this time.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PersonalDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/patient/profile");
          if (response.ok) {
            const data = await response.json();
            setPatientData(data);
          }
        } catch (error) {
          console.error("Error fetching patient data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (session) {
      fetchPatientData();
    }
  }, [session]);

  return (
    <PersonalSidebarWrapper currentPath="/personal/dashboard">
      <PageShell>
        {/* Header */}
        <DashboardHeader
          userName={session?.user?.name}
          planName="Premium Plan"
        />

        {/* Page content */}
        <div className="p-6 space-y-8 pb-10">
          {/* Stat cards row */}
          <StatCards />

          {/* Vital signs + quick actions */}
          <HealthTrendsAndActions />

          {/* Appointments + activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingAppointments />
            <RecentActivity />
          </div>

          {/* Insurance Coverage */}
          <div className="space-y-4">
            <SectionHeader
              title="Insurance Coverage"
              action={
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View Details
                </Button>
              }
            />
            <CoverageSection isLoading={isLoading} patientData={patientData} />
          </div>

          {/* Authorization Requests */}
          <div className="space-y-4">
            <SectionHeader
              title="Authorization Requests"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/personal/request/new")}
                  className="h-8"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Make a Request
                </Button>
              }
            />
            <AuthorizationList />
          </div>
        </div>
      </PageShell>
    </PersonalSidebarWrapper>
  );
}
