"use client";

/**
 * Test Results: view lab and diagnostic results. Placeholder following project design system.
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
import { FlaskConical, CheckCircle, Download } from "lucide-react";

const placeholderResults = [
  { id: "1", name: "Complete Blood Count", date: "Jan 10, 2024", status: "Normal" },
  { id: "2", name: "Lipid Panel", date: "Jan 10, 2024", status: "Normal" },
  { id: "3", name: "Fasting Glucose", date: "Dec 20, 2023", status: "Normal" },
];

export default function TestResultsPage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/test-results">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Test Results
            </h1>
            <p className="text-sm text-muted-foreground">
              Lab and diagnostic results
            </p>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Recent results
              </CardTitle>
              <CardDescription>
                View or download your lab results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {placeholderResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {result.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.date} • {result.status}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
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
