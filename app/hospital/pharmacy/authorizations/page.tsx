"use client";

/**
 * Pharmacy Authorization Queue
 *
 * PHARMACY users see only approved pharmacy-tagged authorization items for their
 * hospital. They can view bound patient info and mark items as COMPLETED, which
 * triggers the ServiceDelivery / utilization tracking defined in Section 12.1.
 */

import { useState, useEffect, useCallback } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  SearchFilterBar,
  DataTable,
  StatusBadge,
  Column,
} from "@/components/shared";
import {
  Pill,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
  User,
  Building2,
  Stethoscope,
  ClipboardCheck,
  Hash,
  Phone,
  Mail,
} from "lucide-react";

interface PharmacyAuthItem {
  id: string;
  authRequestId: string;
  authCode: string;
  requestDate: string;
  serviceName: string;
  serviceCode: string | null;
  category: string;
  cost: number;
  quantity: number;
  reason: string | null;
  status: string;
  decisionReason: string | null;
  fulfillmentNotes: string | null;
  fulfilledAt: string | null;
  fulfilledByName: string | null;
  // Patient info
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  membershipNumber: string;
  hmoName: string;
  planName: string;
  diagnosisCode: string;
  diagnosisNotes: string;
  requestedByName: string;
}

export default function PharmacyAuthorizationsPage() {
  const [items, setItems] = useState<PharmacyAuthItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("APPROVED");

  const [selectedItem, setSelectedItem] = useState<PharmacyAuthItem | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [fulfillmentNotes, setFulfillmentNotes] = useState("");
  const [completeDialogItem, setCompleteDialogItem] = useState<PharmacyAuthItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = statusTab !== "ALL" ? `?status=${statusTab}` : "";
      const res = await fetch(`/api/hospital/pharmacy/authorizations${qs}`);
      if (!res.ok) throw new Error("Failed to load pharmacy authorizations");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching items");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.patientName.toLowerCase().includes(q) ||
      item.serviceName.toLowerCase().includes(q) ||
      item.authCode.toLowerCase().includes(q) ||
      item.hmoName.toLowerCase().includes(q) ||
      item.membershipNumber.toLowerCase().includes(q)
    );
  });

  const handleComplete = async () => {
    if (!completeDialogItem) return;
    setCompleting(completeDialogItem.id);
    try {
      const res = await fetch(
        `/api/hospital/pharmacy/authorizations/${completeDialogItem.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fulfillmentNotes: fulfillmentNotes || undefined }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to complete item");
      }
      setCompleteDialogItem(null);
      setFulfillmentNotes("");
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error completing item");
    } finally {
      setCompleting(null);
    }
  };

  const statusOptions = [
    { label: "Approved (Queue)", value: "APPROVED" },
    { label: "Completed", value: "COMPLETED" },
    { label: "All", value: "ALL" },
  ];

  const columns: Column<PharmacyAuthItem>[] = [
    {
      header: "Patient",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold text-sm shrink-0">
            {item.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{item.patientName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Hash className="h-2.5 w-2.5" /> {item.membershipNumber || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Auth Code",
      cell: (item) =>
        item.authCode ? (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-semibold">
            #{item.authCode}
          </code>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      header: "Medication / Service",
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground text-sm">{item.serviceName}</p>
          <p className="text-xs text-muted-foreground">
            Qty: {item.quantity}
            {item.serviceCode ? ` · ${item.serviceCode}` : ""}
          </p>
        </div>
      ),
    },
    {
      header: "HMO / Plan",
      cell: (item) => (
        <div>
          <p className="text-sm text-foreground">{item.hmoName}</p>
          <p className="text-xs text-muted-foreground">{item.planName}</p>
        </div>
      ),
    },
    {
      header: "Cost",
      cell: (item) => (
        <span className="font-semibold text-foreground">
          ₦{item.cost.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedItem(item)}
            className="gap-1.5 text-xs h-8"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          {["APPROVED", "AUTO_APPROVED"].includes(item.status) && (
            <Button
              size="sm"
              onClick={() => {
                setFulfillmentNotes("");
                setCompleteDialogItem(item);
              }}
              className="gap-1.5 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <HospitalSidebarWrapper currentPath="/hospital/pharmacy/authorizations" role={UserRole.PHARMACY}>
      <div className="min-h-screen bg-background overflow-auto">
        <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

        {/* Header */}
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                Pharmacy Portal
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold flex items-center gap-2 mt-1">
              <Pill className="h-6 w-6 text-purple-600" /> Pharmacy Authorization Queue
            </h1>
            <p className="text-sm text-muted-foreground">
              Approved pharmacy items awaiting dispensing. Mark as completed after fulfillment.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="relative p-6 max-w-7xl mx-auto space-y-6">

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="data-visualization">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Awaiting Dispensing</p>
                  <p className="text-xl font-bold text-foreground">
                    {items.filter((i) => ["APPROVED", "AUTO_APPROVED"].includes(i.status)).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="data-visualization">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed Today</p>
                  <p className="text-xl font-bold text-foreground">
                    {items.filter((i) => {
                      if (i.status !== "COMPLETED" || !i.fulfilledAt) return false;
                      return new Date(i.fulfilledAt).toDateString() === new Date().toDateString();
                    }).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="data-visualization sm:col-span-1 col-span-2">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total in Queue</p>
                  <p className="text-xl font-bold text-foreground">{items.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search patient, auth code, HMO, membership #..."
            statusFilter={statusTab}
            onStatusFilterChange={setStatusTab}
            statusOptions={statusOptions}
            onResetFilters={() => { setSearch(""); setStatusTab("APPROVED"); }}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DataTable
            columns={columns}
            data={filtered}
            isLoading={loading}
            emptyTitle="No pharmacy authorizations"
            emptyDescription={
              search
                ? "No items matching your search."
                : statusTab === "APPROVED"
                  ? "No approved pharmacy items awaiting dispensing."
                  : "No items found."
            }
          />
        </div>
      </div>

      {/* ── View Details Dialog ── */}
      {selectedItem && (
        <Dialog open onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5 text-purple-600" /> Pharmacy Item Details
                </DialogTitle>
                <StatusBadge status={selectedItem.status} />
              </div>
              <DialogDescription>
                Auth Code:{" "}
                {selectedItem.authCode ? (
                  <code className="font-mono text-primary font-semibold">#{selectedItem.authCode}</code>
                ) : "—"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Patient Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Patient Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm bg-card p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-muted-foreground text-xs">Full Name</p>
                    <p className="font-medium">{selectedItem.patientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Membership #</p>
                    <p className="font-medium font-mono text-primary">{selectedItem.membershipNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">HMO Provider</p>
                    <p className="font-medium">{selectedItem.hmoName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Coverage Plan</p>
                    <p className="font-medium">{selectedItem.planName}</p>
                  </div>
                  {selectedItem.patientEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{selectedItem.patientEmail}</p>
                    </div>
                  )}
                  {selectedItem.patientPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{selectedItem.patientPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" /> Service / Medication
                </h4>
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground">{selectedItem.serviceName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{selectedItem.category}</Badge>
                        {selectedItem.serviceCode && (
                          <code className="text-[10px] text-muted-foreground">{selectedItem.serviceCode}</code>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₦{selectedItem.cost.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Qty: {selectedItem.quantity}</p>
                    </div>
                  </div>
                  {selectedItem.reason && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Reason:</strong> {selectedItem.reason}
                    </p>
                  )}
                  {selectedItem.diagnosisCode && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Diagnosis Code:</strong> {selectedItem.diagnosisCode}
                    </p>
                  )}
                  {selectedItem.diagnosisNotes && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Diagnosis Notes:</strong> {selectedItem.diagnosisNotes}
                    </p>
                  )}
                  {selectedItem.decisionReason && (
                    <div className="p-2 bg-muted/50 rounded text-xs">
                      <strong>HMO Approval Note:</strong> {selectedItem.decisionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Requester */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>Requested by <strong>{selectedItem.requestedByName}</strong> on{" "}
                  {new Date(selectedItem.requestDate).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </span>
              </div>

              {/* Fulfilled info */}
              {selectedItem.status === "COMPLETED" && selectedItem.fulfilledAt && (
                <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 text-sm">
                  <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Dispensed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {selectedItem.fulfilledByName ?? "Pharmacy"} on{" "}
                    {new Date(selectedItem.fulfilledAt).toLocaleString("en-GB")}
                  </p>
                  {selectedItem.fulfillmentNotes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Notes: {selectedItem.fulfillmentNotes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
              {["APPROVED", "AUTO_APPROVED"].includes(selectedItem.status) && (
                <Button
                  onClick={() => {
                    setFulfillmentNotes("");
                    setCompleteDialogItem(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark as Completed
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Mark Complete Confirmation Dialog ── */}
      {completeDialogItem && (
        <Dialog open onOpenChange={(open) => !open && setCompleteDialogItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" /> Confirm Dispensing
              </DialogTitle>
              <DialogDescription>
                Marking <strong>{completeDialogItem.serviceName}</strong> as dispensed for{" "}
                <strong>{completeDialogItem.patientName}</strong>. This will trigger a utilization record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="fulfillmentNotes" className="text-xs text-muted-foreground">
                  Fulfillment Notes (optional)
                </Label>
                <Textarea
                  id="fulfillmentNotes"
                  value={fulfillmentNotes}
                  onChange={(e) => setFulfillmentNotes(e.target.value)}
                  placeholder="e.g., Dispensed full quantity, patient counselled..."
                  className="mt-1.5 text-sm"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCompleteDialogItem(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completing === completeDialogItem.id}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {completing === completeDialogItem.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirm & Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </HospitalSidebarWrapper>
  );
}
