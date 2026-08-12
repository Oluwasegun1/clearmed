"use client";

/**
 * Hospital Admin — Department Management
 */

import { useState } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stethoscope, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEPARTMENTS = [
  { name: "Emergency & Trauma", staffCount: 18, head: "Dr. Adebayo Ogundele" },
  { name: "Cardiology", staffCount: 12, head: "Dr. Fatima Bello" },
  { name: "General Surgery", staffCount: 15, head: "Dr. Chukwuma Eze" },
  { name: "Pediatrics", staffCount: 10, head: "Dr. Grace Okon" },
  { name: "Obstetrics & Gynecology", staffCount: 14, head: "Dr. Samuel Alabi" },
  { name: "Pharmacy", staffCount: 8, head: "Pharm. Blessing Nwachukwu" },
  { name: "Laboratory & Radiology", staffCount: 9, head: "Dr. Ibrahim Musa" },
];

export default function HospitalDepartmentsPage() {
  return (
    <HospitalSidebarWrapper currentPath="/hospital/departments" role={UserRole.HOSPITAL_ADMIN}>
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" /> Hospital Departments
            </h1>
            <p className="text-sm text-muted-foreground">Manage hospital clinical & operational departments</p>
          </div>
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Department</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEPARTMENTS.map((dept) => (
            <Card key={dept.name} className="data-visualization">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{dept.name}</span>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Head: {dept.head}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-medium">{dept.staffCount} Staff Members Assigned</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
