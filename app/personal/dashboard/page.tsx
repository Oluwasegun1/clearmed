"use client";

import { PersonalSidebarWrapper } from "@/components/sidebars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Heart,
  Pill,
  FileText,
  AlertCircle,
  TrendingDown,
  Clock,
  Phone,
  Shield,
  Stethoscope,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import CoverageCard from "./coverage-card";
import AuthorizationList from "./authorization-list";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PersonalDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [patientData, setPatientData] = useState(null);
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
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 professional-grid opacity-40" />

        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />

        <div className="relative">
          <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-semibold text-foreground">
                      Health Overview
                    </h1>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      Premium Plan
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {session?.user?.name || "Patient"} • Last
                    updated 2 minutes ago
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-transparent"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-primary hover:bg-primary/90"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Emergency
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="metric-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Health Score
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-foreground">85</p>
                        <div className="flex items-center text-xs text-green-400">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +5
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        vs last month
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={85} className="h-1.5 bg-muted" />
                  </div>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Active Medications
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-foreground">3</p>
                        <div className="flex items-center text-xs text-amber-400">
                          <Clock className="h-3 w-3 mr-1" />2 due
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        next in 30min
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Pill className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Appointments
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-foreground">2</p>
                        <div className="flex items-center text-xs text-purple-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          upcoming
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        next tomorrow
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Coverage Used
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-foreground">
                          25%
                        </p>
                        <div className="flex items-center text-xs text-green-400">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          -3%
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        of annual limit
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={25} className="h-1.5 bg-muted" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Health Trends Chart */}
              <Card className="lg:col-span-2 data-visualization">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium text-foreground">
                        Health Trends
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Your vital signs over the past 30 days
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        7D
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs bg-primary/10 text-primary"
                      >
                        30D
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        90D
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Blood Pressure Trend */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Blood Pressure
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Systolic/Diastolic
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          120/80
                        </p>
                        <div className="flex items-center text-xs text-green-400">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          -2% avg
                        </div>
                      </div>
                    </div>

                    {/* Heart Rate Trend */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Heart Rate
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Resting BPM
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          72
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Minus className="h-3 w-3 mr-1" />
                          stable
                        </div>
                      </div>
                    </div>

                    {/* Blood Sugar Trend */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Blood Sugar
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Fasting glucose
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          95 mg/dL
                        </p>
                        <div className="flex items-center text-xs text-green-400">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          -5% avg
                        </div>
                      </div>
                    </div>

                    {/* Weight Trend */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Weight
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Body weight
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          70 kg
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Minus className="h-3 w-3 mr-1" />
                          stable
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="data-visualization">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-foreground">
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Frequently used features
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 bg-card/50 hover:bg-card/80 border border-border/50"
                      onClick={() => router.push("/personal/medications")}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Pill className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            Medications
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Manage prescriptions
                          </p>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 bg-card/50 hover:bg-card/80 border border-border/50"
                      onClick={() => router.push("/personal/appointments")}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            Appointments
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Schedule & manage
                          </p>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 bg-card/50 hover:bg-card/80 border border-border/50"
                      onClick={() => router.push("/personal/records")}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            Medical Records
                          </p>
                          <p className="text-xs text-muted-foreground">
                            View history
                          </p>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 bg-card/50 hover:bg-card/80 border border-border/50"
                      onClick={() =>
                        router.push("/personal/authorizations/new")
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            Authorization
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Request approval
                          </p>
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="data-visualization">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium text-foreground">
                        Upcoming Appointments
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Your scheduled healthcare visits
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Dr. Sarah Johnson
                        </p>
                        <p className="text-xs text-muted-foreground">
                          General Checkup
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Tomorrow, 2:00 PM
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Downtown Clinic
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Reschedule
                      </Button>
                    </div>

                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-card/50 border border-border/50">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Dr. Michael Chen
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cardiology Follow-up
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Next Friday, 10:30 AM
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Heart Center
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="data-visualization">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium text-foreground">
                        Recent Activity
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Latest updates to your health record
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          Lab results received
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Complete Blood Count - Normal ranges
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          2 hours ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          Medication refilled
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Lisinopril 10mg - 30 day supply
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          1 day ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          Appointment confirmed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dr. Sarah Johnson - General Checkup
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          2 days ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          Authorization approved
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MRI scan - Lower back imaging
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          3 days ago
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-foreground">
                  Insurance Coverage
                </h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View Details
                </Button>
              </div>

              {isLoading ? (
                <Card className="data-visualization">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : patientData ? (
                <CoverageCard
                  planName={patientData.coveragePlan?.name || "Basic Plan"}
                  hmoName={patientData.hmo?.name || "Default HMO"}
                  membershipNumber={patientData.membershipNumber || "N/A"}
                  coverageStartDate={
                    new Date(patientData.coverageStartDate || Date.now())
                  }
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
              ) : (
                <Card className="data-visualization">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-foreground">
                        Coverage Information Unavailable
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        We couldn&apos;t retrieve your coverage details at this
                        time.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-foreground">
                  Authorization Requests
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/personal/authorizations/new")}
                  className="h-8"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
              <AuthorizationList />
            </div>
          </div>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
