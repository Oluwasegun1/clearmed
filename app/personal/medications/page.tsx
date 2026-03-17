"use client";

/**
 * Medications: view and manage prescriptions. Placeholder following project design system.
 */

import { PersonalSidebarWrapper } from "@/components/sidebars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock } from "lucide-react";

const placeholderMeds = [
  { id: "1", name: "Lisinopril 10mg", frequency: "Once daily", nextRefill: "In 15 days", status: "active" },
  { id: "2", name: "Metformin 500mg", frequency: "Twice daily", nextRefill: "In 7 days", status: "active" },
  { id: "3", name: "Vitamin D3", frequency: "Once daily", nextRefill: "In 30 days", status: "active" },
];

export default function MedicationsPage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/medications">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Medications
            </h1>
            <p className="text-sm text-muted-foreground">
              Your current prescriptions
            </p>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Active medications
              </CardTitle>
              <CardDescription>
                Refill and dosage information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {placeholderMeds.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Pill className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {med.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {med.frequency} • Refill {med.nextRefill}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{med.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
