"use client";

/**
 * Hospital — Patient Records Page
 * Complies with Section 8.3: Scoped to patients with binding relationship at this hospital.
 */

import { useState, useEffect } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared";
import { FileText, Search, User, Loader2, Shield, Stethoscope, Lock, Eye, Calendar, Hash } from "lucide-react";

interface RecordItem {
  id: string;
  authCode: string;
  status: string;
  rawStatus: string;
  requestDate: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  hmoName: string;
  planName: string;
  serviceName: string;
  category: string;
  price: number;
  diagnosisCode: string;
  diagnosisNotes: string;
  quantity: number;
  requestedByName: string;
  reviewComments: string | null;
  reviewedAt: string | null;
  hasServiceDelivery: boolean;
}

export default function HospitalRecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);

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
      r.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      r.hmoName.toLowerCase().includes(search.toLowerCase()) ||
      r.authCode.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosisCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <HospitalSidebarWrapper currentPath="/hospital/records">
      <div className="min-h-screen bg-background overflow-auto p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Patient Records
            </h1>
            <p className="text-sm text-muted-foreground">
              Clinical and authorization records for patients treated at this hospital
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient, diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Section 8.3 Banner */}
        <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <strong>Binding Relationship Scoping:</strong> Displaying only patients with active or historical records at this healthcare facility.
          </span>
          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
            Compliant with Sec 8.3
          </Badge>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{filtered.length} Treated Patient Record(s)</CardTitle>
              <CardDescription>Click any record to inspect clinical notes, HMO decisions, and delivery status</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {filtered.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{r.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.serviceName} • {r.hmoName} ({r.planName})
                        </p>
                        {r.diagnosisCode && (
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            Dx: {r.diagnosisCode}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <StatusBadge status={r.status} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(r.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Record Detail Dialog */}
        <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Clinical & Authorization Record
              </DialogTitle>
              <DialogDescription>
                Details for {selectedRecord?.patientName}
              </DialogDescription>
            </DialogHeader>

            {selectedRecord && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground block">Patient Name</span>
                    <span className="font-semibold">{selectedRecord.patientName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">HMO Provider</span>
                    <span className="font-semibold">{selectedRecord.hmoName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Coverage Plan</span>
                    <span>{selectedRecord.planName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Status</span>
                    <StatusBadge status={selectedRecord.status} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Service Requested:</span>
                    <span className="font-semibold">{selectedRecord.serviceName} ({selectedRecord.category})</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Standard Price:</span>
                    <span className="font-semibold">₦{(selectedRecord.price * selectedRecord.quantity).toLocaleString()} (Qty: {selectedRecord.quantity})</span>
                  </div>
                  {selectedRecord.authCode && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Auth Code:</span>
                      <span className="font-mono font-bold text-primary">{selectedRecord.authCode}</span>
                    </div>
                  )}
                  {selectedRecord.diagnosisCode && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Diagnosis Code:</span>
                      <span className="font-mono font-medium">{selectedRecord.diagnosisCode}</span>
                    </div>
                  )}
                </div>

                {selectedRecord.diagnosisNotes && (
                  <div className="p-3 bg-secondary/40 rounded-md">
                    <span className="text-xs font-semibold block mb-1">Clinical Justification & Notes:</span>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedRecord.diagnosisNotes}</p>
                  </div>
                )}

                {selectedRecord.reviewComments && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <span className="text-xs font-semibold text-primary block mb-1">HMO Review Notes:</span>
                    <p className="text-xs text-muted-foreground">{selectedRecord.reviewComments}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </HospitalSidebarWrapper>
  );
}
