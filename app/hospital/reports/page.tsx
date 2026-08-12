"use client";

/**
 * Hospital Admin — Reports & Analytics
 */

import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartBar, TrendingUp, Users, CheckCircle2, Clock } from "lucide-react";

export default function HospitalReportsPage() {
  return (
    <HospitalSidebarWrapper currentPath="/hospital/reports" role={UserRole.HOSPITAL_ADMIN}>
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-6xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ChartBar className="h-6 w-6 text-primary" /> Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Authorization turnaround times, approval rates, and volume statistics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="data-visualization">
            <CardContent className="p-5 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">HMO Approval Rate</p>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="data-visualization">
            <CardContent className="p-5 flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Pre-Auth Time</p>
                <p className="text-2xl font-bold">18 Mins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="data-visualization">
            <CardContent className="p-5 flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Monthly Patients Treated</p>
                <p className="text-2xl font-bold">1,248</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="data-visualization">
          <CardHeader>
            <CardTitle className="text-base">HMO Pre-Authorization Summary</CardTitle>
            <CardDescription>Performance metrics across major HMO providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { hmo: "ClearMed Primary Health", requests: 142, approved: 138, avgTime: "12m" },
                { hmo: "Hygeia HMO", requests: 98, approved: 91, avgTime: "24m" },
                { hmo: "Reliance HMO", requests: 64, approved: 60, avgTime: "15m" },
                { hmo: "Total Health Trust", requests: 45, approved: 42, avgTime: "30m" },
              ].map((row) => (
                <div key={row.hmo} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{row.hmo}</p>
                    <p className="text-xs text-muted-foreground">{row.requests} Total Requests</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="font-medium text-green-600">{row.approved} Approved</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Avg Response: {row.avgTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalSidebarWrapper>
  );
}
