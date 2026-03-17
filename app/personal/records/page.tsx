"use client";

/**
 * Medical Records: view history and documents. Placeholder following project design system.
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
import { FileText, Download } from "lucide-react";

const placeholderRecords = [
  { id: "1", name: "Annual physical 2024", date: "Jan 15, 2024", type: "Visit summary" },
  { id: "2", name: "Lab results – CBC", date: "Jan 10, 2024", type: "Lab" },
  { id: "3", name: "Immunization record", date: "Dec 1, 2023", type: "Immunization" },
];

export default function MedicalRecordsPage() {
  return (
    <PersonalSidebarWrapper currentPath="/personal/records">
      <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Medical Records
            </h1>
            <p className="text-sm text-muted-foreground">
              Your health history and documents
            </p>
          </div>
        </div>
        <div className="relative p-6 space-y-6">
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent records
              </CardTitle>
              <CardDescription>
                View or download your records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {placeholderRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {record.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.type} • {record.date}
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
