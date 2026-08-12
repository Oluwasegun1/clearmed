"use client";

/**
 * Hospital — Settings Overview Page
 */

import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Users, ShieldCheck, Building2 } from "lucide-react";
import Link from "next/link";

export default function HospitalSettingsPage() {
  return (
    <HospitalSidebarWrapper currentPath="/hospital/settings">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-4xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Hospital Settings
          </h1>
          <p className="text-sm text-muted-foreground">Manage organization profile, staff members, and access roles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/hospital/settings/members">
            <Card className="data-visualization hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Staff Members
                </CardTitle>
                <CardDescription>Invite doctors, nurses, pharmacists, and assign roles</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/hospital/settings/roles">
            <Card className="data-visualization hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Roles & Permissions
                </CardTitle>
                <CardDescription>Configure access permissions for each staff role</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
