"use client";

/**
 * Insurance: plan and policy details. Placeholder following project design system.
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
import { Shield } from "lucide-react";

export default function InsurancePage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/insurance">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Insurance
            </h1>
            <p className="text-sm text-muted-foreground">
              Your plan and policy information
            </p>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current plan
              </CardTitle>
              <CardDescription>
                Plan details and coverage summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <span className="text-sm font-medium text-foreground">
                  Premium Plan
                </span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                For full coverage details and benefits, see Coverage & Benefits.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
