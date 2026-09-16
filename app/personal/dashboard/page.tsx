"use client";

/**
 * Patient Dashboard — ClearMed Primary Health Hub.
 * Fulfills all Section 5.1 and Section 12 specifications:
 * - Personal Information: Name, Email, Phone number, Membership number
 * - Coverage: HMO, Plan, Start date, End date, Percentage, Annual limit, Amount used, Remaining coverage
 * - Authorization: Pending, Approved, Rejected, Completed requests & Recent activity
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PersonalSidebarWrapper } from "@/components/sidebars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Shield,
  PlusCircle,
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Heart,
  Pill,
} from "lucide-react";
import CoverageCard from "./coverage-card";
import AuthorizationList from "./authorization-list";
import { HealthTrendsAndActions } from "./health-trends";
import { UpcomingAppointments } from "./upcoming-appointments";
import { RecentActivity } from "./recent-activity";

interface PatientProfileData {
  id: string;
  membershipNumber: string;
  coverageStartDate: string;
  coverageEndDate: string;
  coveragePercentage: number;
  annualLimit: number;
  usedAmount: number;
  reservedAmount?: number;
  remainingCoverage: number;
  authorizationCounts: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    total: number;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    name?: string;
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
  recentAuthorizations?: Array<{
    id: string;
    authCode: string;
    status: string;
    requestDate: string;
    quantity: number;
    service: {
      name: string;
      standardPrice: number;
      category?: string;
    };
    hospital: {
      name: string;
    };
  }>;
}

export default function PersonalDashboard() {
  const { data: session } = useSession();
  const [patientData, setPatientData] = useState<PatientProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/patient/profile");
        if (res.ok) {
          const data = await res.json();
          setPatientData(data);
        }
      } catch (err) {
        console.error("Failed to load patient dashboard profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      loadData();
    }
  }, [session]);

  const displayName = patientData
    ? `${patientData.user.firstName} ${patientData.user.lastName}`.trim()
    : session?.user?.name || "Patient";

  return (
    <PersonalSidebarWrapper currentPath="/personal/dashboard">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-7xl mx-auto space-y-8 pb-12">
        {/* Top Welcome Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Here is your personal health coverage overview, active benefits, and authorization status
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
              <Link href="/personal/profile">
                <User className="h-4 w-4 text-primary" /> Edit Profile
              </Link>
            </Button>
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link href="/personal/request/new">
                <PlusCircle className="h-4 w-4" /> New Authorization
              </Link>
            </Button>
          </div>
        </div>

        {/* 1. Personal Information Summary Card */}
        <Card className="data-visualization border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {patientData?.user.firstName?.[0] || displayName?.[0] || "P"}
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground block">Patient Name</span>
                  <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground block">Email Address</span>
                  <p className="font-medium text-sm text-foreground truncate">
                    {patientData?.user.email || session?.user?.email || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground block">Phone Number</span>
                  <p className="font-medium text-sm text-foreground truncate">
                    {patientData?.user.phoneNumber || "+234 800 000 0000"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground block">Membership Number</span>
                  <p className="font-bold font-mono text-sm text-foreground truncate">
                    {patientData?.membershipNumber || "MEM-000000"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Coverage & Benefit Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Health Coverage & Benefits
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
              <Link href="/personal/coverage">
                Full Benefits Table <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <Card className="data-visualization">
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : patientData ? (
            <CoverageCard
              planName={patientData.coveragePlan?.name || "Comprehensive Health Plan"}
              hmoName={patientData.hmo?.name || "ClearMed Health HMO"}
              membershipNumber={patientData.membershipNumber || "MEM-000000"}
              coverageStartDate={new Date(patientData.coverageStartDate)}
              coverageEndDate={new Date(patientData.coverageEndDate)}
              coveragePercentage={patientData.coveragePercentage || 85}
              annualLimit={patientData.annualLimit || 500000}
              usedAmount={patientData.usedAmount || 0}
              reservedAmount={patientData.reservedAmount || 0}
            />
          ) : (
            <Card className="data-visualization">
              <CardContent className="p-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                Coverage details unavailable
              </CardContent>
            </Card>
          )}
        </div>

        {/* 3. Authorizations & Requests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Pre-Authorizations & Care Tracking
            </h2>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
              <Link href="/personal/request/new">
                <PlusCircle className="h-3.5 w-3.5" /> Submit Request
              </Link>
            </Button>
          </div>

          <AuthorizationList counts={patientData?.authorizationCounts} />
        </div>

        {/* 4. Appointments & Medical Care Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingAppointments />
          <RecentActivity />
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
