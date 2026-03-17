"use client";

/**
 * Claims: view and track insurance claims. Placeholder following project design system.
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
import { FileText, Plus } from "lucide-react";

export default function ClaimsPage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/claims">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Claims
              </h1>
              <p className="text-sm text-muted-foreground">
                Track and submit insurance claims
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9">
              <Plus className="h-4 w-4 mr-2" />
              New claim
            </Button>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your claims
              </CardTitle>
              <CardDescription>
                Status and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-card/50 p-6 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No claims yet. Claims from your visits and authorizations will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PersonalSidebarWrapper>
  );
}
