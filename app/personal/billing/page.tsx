"use client";

/**
 * Billing: statements and payment. Placeholder following project design system.
 */

import { PersonalSidebarWrapper } from "@/components/sidebars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText } from "lucide-react";

export default function BillingPage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/billing">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Billing
              </h1>
              <p className="text-sm text-muted-foreground">
                Statements and payment
              </p>
            </div>
            <Button size="sm" className="h-9">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay now
            </Button>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent statements
              </CardTitle>
              <CardDescription>
                View or download your billing statements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-card/50 p-6 text-center">
                <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recent statements. Your next statement will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
