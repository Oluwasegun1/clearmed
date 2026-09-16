"use client";

/**
 * Hospital Requests Page — View & manage all pre-auth requests sent to or created by this hospital (ClearMed v2.0).
 * Step 8: Provider sees decision and status per service line item and as a derived overall request status.
 */

import { useState, useEffect, useCallback } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  SearchFilterBar,
  DataTable,
  StatusBadge,
  Column,
} from "@/components/shared";
import {
  ClipboardList,
  RefreshCw,
  AlertCircle,
  Plus,
  Eye,
  Copy,
  Check,
  Building2,
  Stethoscope,
  DollarSign,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface ServiceItemDetail {
  id: string;
  name: string;
  category: string;
  cost: number;
  quantity: number;
  reason?: string;
  status: string;
  decisionReason?: string | null;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  fulfilledAt?: string | null;
  fulfilledByName?: string | null;
}

interface RequestItem {
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
  items?: ServiceItemDetail[];
  services?: ServiceItemDetail[];
  requestedByName: string;
  reviewComments: string | null;
  reviewedAt: string | null;
  hasServiceDelivery: boolean;
}

export default function HospitalRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hospital/requests${statusTab !== "ALL" ? `?status=${statusTab}` : ""}`);
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching requests");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.patientName.toLowerCase().includes(q) ||
      r.serviceName.toLowerCase().includes(q) ||
      r.hmoName.toLowerCase().includes(q) ||
      r.authCode.toLowerCase().includes(q) ||
      r.diagnosisNotes.toLowerCase().includes(q)
    );
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const columns: Column<RequestItem>[] = [
    {
      header: "Patient & Auth Code",
      cell: (req) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
            {req.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{req.patientName}</span>
              {req.authCode && (
                <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-semibold">
                  #{req.authCode}
                </code>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 inline" /> {req.hmoName} • {req.planName}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Services Requested",
      cell: (req) => {
        const items = req.items || req.services || [];
        const count = items.length;
        return (
          <div>
            <p className="font-medium text-foreground text-sm">{req.serviceName}</p>
            <p className="text-xs text-muted-foreground">{count > 1 ? `${count} itemized services` : req.category}</p>
          </div>
        );
      },
    },
    {
      header: "Total Cost",
      cell: (req) => (
        <span className="font-semibold text-foreground">
          ₦{req.price ? req.price.toLocaleString() : "0"}
        </span>
      ),
    },
    {
      header: "Overall Status",
      cell: (req) => <StatusBadge status={req.status} />,
    },
    {
      header: "Date",
      cell: (req) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(req.requestDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      cell: (req) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedReq(req)}
          className="gap-1.5 text-xs h-8"
        >
          <Eye className="h-3.5 w-3.5" /> Details
        </Button>
      ),
    },
  ];

  const statusOptions = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "More Info Required", value: "MORE_INFORMATION_REQUIRED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Completed", value: "COMPLETED" },
  ];

  return (
    <HospitalSidebarWrapper currentPath="/hospital/requests">
      <div className="min-h-screen bg-background overflow-auto">
        <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

        {/* Header */}
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                v2.0 Service-Level Tracking
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold flex items-center gap-2 mt-1">
              <ClipboardList className="h-6 w-6 text-primary" /> Hospital Authorization Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor pre-authorization requests, itemized service decisions, and fulfillment status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Link href="/hospital/request/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Create Request
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative p-6 max-w-7xl mx-auto space-y-6">
          {/* Search & Filter Bar */}
          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search patient, service, HMO, code..."
            statusFilter={statusTab}
            onStatusFilterChange={setStatusTab}
            statusOptions={statusOptions}
            onResetFilters={() => {
              setSearch("");
              setStatusTab("ALL");
            }}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reusable Data Table */}
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={loading}
            emptyTitle="No authorization requests found"
            emptyDescription={
              search
                ? "No requests matching your search query."
                : "No authorization requests have been submitted for this hospital yet."
            }
            emptyActionLabel="Create Request"
            onEmptyAction={() => {
              window.location.href = "/hospital/request/new";
            }}
          />

          {/* Details Dialog */}
          {selectedReq && (
            <Dialog open={Boolean(selectedReq)} onOpenChange={(open) => !open && setSelectedReq(null)}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between gap-2">
                    <DialogTitle className="text-lg">Authorization Request Details</DialogTitle>
                    <StatusBadge status={selectedReq.status} />
                  </div>
                  <DialogDescription>Request ID: {selectedReq.id}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Overall Request Status</p>
                      <div className="mt-1">
                        <StatusBadge status={selectedReq.status} />
                      </div>
                    </div>
                    {selectedReq.authCode && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Authorization Code</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-base font-mono font-bold text-primary">{selectedReq.authCode}</code>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyCode(selectedReq.authCode)}>
                            {copiedCode ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Patient & HMO Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" /> Patient & HMO Info
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-card p-3 rounded-lg border border-border">
                      <div>
                        <p className="text-muted-foreground text-xs">Patient Name</p>
                        <p className="font-medium">{selectedReq.patientName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">HMO Provider</p>
                        <p className="font-medium">{selectedReq.hmoName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Coverage Plan</p>
                        <p className="font-medium">{selectedReq.planName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Requested By</p>
                        <p className="font-medium">{selectedReq.requestedByName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Services (Step 8: Provider receives decision per service) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" /> Itemized Services & Decisions
                    </h4>

                    {(selectedReq.items && selectedReq.items.length > 0 ? selectedReq.items : [
                      {
                        id: selectedReq.id,
                        name: selectedReq.serviceName,
                        category: selectedReq.category,
                        cost: selectedReq.price,
                        quantity: selectedReq.quantity,
                        reason: selectedReq.diagnosisNotes,
                        status: selectedReq.status,
                        decisionReason: selectedReq.reviewComments,
                        reviewedAt: selectedReq.reviewedAt,
                      }
                    ]).map((it: ServiceItemDetail, idx: number) => (
                      <div key={it.id} className="p-3.5 rounded-xl border border-border bg-card space-y-2 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">#{idx + 1} {it.name}</span>
                              <Badge variant="outline" className="text-[10px]">{it.category}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">Qty: {it.quantity || 1}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-foreground">₦{(it.cost || 0).toLocaleString()}</span>
                            <StatusBadge status={it.status} />
                          </div>
                        </div>

                        {it.reason && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Reason:</strong> {it.reason}
                          </p>
                        )}

                        {it.decisionReason && (
                          <div className="p-2 bg-muted/50 rounded text-xs text-foreground">
                            <strong>HMO Decision Note:</strong> {it.decisionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedReq(null)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
