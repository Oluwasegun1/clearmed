"use client";

/**
 * Hospital — Patient Records Page
 */

import { useState, useEffect } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, User, Loader2 } from "lucide-react";

interface RecordItem {
  id: string;
  patientName: string;
  hmoName: string;
  serviceName: string;
  requestDate: string;
  status: string;
}

export default function HospitalRecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/hospital/requests")
      .then((r) => r.json())
      .then((d) => setRecords(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(
    (r) =>
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.serviceName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <HospitalSidebarWrapper currentPath="/hospital/records">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Patient Records
            </h1>
            <p className="text-sm text-muted-foreground">Clinical and authorization history for treated patients</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="data-visualization">
            <CardContent className="p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No patient records found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="data-visualization">
            <CardHeader>
              <CardTitle className="text-base">{filtered.length} Patient Record(s)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {filtered.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{r.patientName}</p>
                        <p className="text-xs text-muted-foreground">{r.serviceName} • {r.hmoName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{r.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </HospitalSidebarWrapper>
  );
}
