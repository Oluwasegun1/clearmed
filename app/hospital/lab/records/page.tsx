"use client";

/**
 * Lab Staff — Test Records
 */

import { useState, useEffect } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Microscope, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LabRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hospital/requests")
      .then((r) => r.json())
      .then((d) => setRecords(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <HospitalSidebarWrapper currentPath="/hospital/lab/records" role={UserRole.LAB}>
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-5xl mx-auto space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Microscope className="h-6 w-6 text-primary" /> Laboratory Investigation Records
          </h1>
          <p className="text-sm text-muted-foreground">Historical lab tests conducted and authorized</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <Card className="data-visualization">
            <CardContent className="p-8 text-center">
              <Microscope className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No laboratory records found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <Card key={r.id} className="data-visualization">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{r.patientName}</p>
                    <p className="text-sm text-muted-foreground">{r.serviceName} • HMO: {r.hmoName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      Completed
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HospitalSidebarWrapper>
  );
}
