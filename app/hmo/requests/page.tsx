"use client";

/**
 * HMO Authorization Requests page (ClearMed v2.0).
 * Step 4: HMO reviews request and each individual service line item in its queue.
 * Step 5: HMO decides per service independently (Approve, Reject, Request More Information).
 * Step 6: Decision recorded per service with reviewer, timestamp, decision, and comments.
 */

import { useState, useEffect, useCallback } from "react";
import { HMOSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SearchFilterBar, DataTable, StatusBadge, Column, DateRangeFilter, DateRangeValue } from "@/components/shared";
import {
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  CalendarDays,
  Loader2,
  MessageSquare,
  Stethoscope,
  DollarSign,
  HelpCircle,
  CheckCheck,
  FileQuestion,
} from "lucide-react";
import toast from "react-hot-toast";

interface ServiceItemDetail {
  id: string;
  serviceId?: string;
  name: string;
  description?: string;
  category: string;
  cost: number;
  quantity: number;
  reason?: string;
  supportingDocs?: string;
  status: string;
  decisionReason?: string | null;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  fulfilledAt?: string | null;
  fulfilledByName?: string | null;
}

interface ReviewRequestDetail {
  id: string;
  authCode: string | null;
  status: string;
  rawStatus?: string;
  requestDate: string;
  createdAt?: string;
  diagnosisCode: string | null;
  diagnosisNotes: string | null;
  quantity: number;
  patient: {
    user: { firstName: string; lastName: string; email: string; phoneNumber?: string; name?: string };
    membershipNumber: string;
    coveragePlan: { name: string };
  } | null;
  hospital: { id: string; name: string; city: string; state: string };
  service?: { id: string; name: string; category: string; standardPrice: number };
  items?: ServiceItemDetail[];
  services?: ServiceItemDetail[];
  requestedBy: { position: string; user: { firstName: string; lastName: string } };
  reviews: {
    id: string;
    decision: string;
    comments: string | null;
    reviewDate: string;
    reviewedBy?: { user: { firstName: string; lastName: string }; position?: string };
  }[];
  previousAuthorizations?: any[];
}

const STATUS_OPTIONS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "More Info Required", value: "MORE_INFORMATION_REQUIRED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Completed", value: "COMPLETED" },
];

export default function HMORequestsPage() {
  const [requests, setRequests] = useState<ReviewRequestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [selected, setSelected] = useState<ReviewRequestDetail | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: "all",
    startDate: "",
    endDate: "",
  });

  // Per-item review notes state
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const qs = statusTab !== "ALL" ? `?status=${statusTab}` : "";
      const res = await fetch(`/api/authorizations${qs}`);
      if (!res.ok) throw new Error("Failed to load authorization requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchRequests(false);
    // Silent auto-refresh every 25s
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 25_000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Fetch full detail when a row is selected
  const openDetail = async (row: ReviewRequestDetail) => {
    try {
      const res = await fetch(`/api/authorizations/${row.id}`);
      if (!res.ok) throw new Error("Failed to load request details");
      const detail = await res.json();
      setSelected(detail);
      setItemNotes({});
    } catch {
      toast.error("Could not load request details");
    }
  };

  // Step 5 & 6: Submit per-service review decision
  const submitItemReview = async (
    itemId: string,
    decision: "APPROVED" | "REJECTED" | "MORE_INFORMATION_REQUIRED"
  ) => {
    if (!selected) return;
    const note = itemNotes[itemId] || "";

    if (decision === "REJECTED" && !note.trim()) {
      toast.error("Please provide a rejection reason/comment");
      return;
    }

    if (decision === "MORE_INFORMATION_REQUIRED" && !note.trim()) {
      toast.error("Please specify what additional information is required");
      return;
    }

    setSubmittingItemId(itemId);
    try {
      const res = await fetch(`/api/authorizations/${selected.id}/items/${itemId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comments: note }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Review failed");
      }

      toast.success(
        decision === "APPROVED"
          ? "Service approved"
          : decision === "REJECTED"
          ? "Service rejected"
          : "Clarification requested from provider"
      );

      // Refresh detail view & list
      const refreshedRes = await fetch(`/api/authorizations/${selected.id}`);
      if (refreshedRes.ok) {
        const refreshedData = await refreshedRes.json();
        setSelected(refreshedData);
      }
      fetchRequests(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit service review");
    } finally {
      setSubmittingItemId(null);
    }
  };

  const filtered = requests.filter((r) => {
    // Date range filter
    if (dateRange.startDate || dateRange.endDate) {
      const itemDateStr = r.requestDate || r.createdAt;
      if (itemDateStr) {
        const itemDate = new Date(itemDateStr).toISOString().split("T")[0];
        if (dateRange.startDate && itemDate < dateRange.startDate) return false;
        if (dateRange.endDate && itemDate > dateRange.endDate) return false;
      }
    }

    const q = search.toLowerCase();
    const anyField = JSON.stringify(r).toLowerCase();
    return anyField.includes(q);
  });

  const columns: Column<ReviewRequestDetail>[] = [
    {
      header: "Patient",
      cell: (r) => {
        const name =
          r.patient?.user
            ? `${r.patient.user.firstName || ""} ${r.patient.user.lastName || ""}`.trim() ||
              r.patient.user.name ||
              "Unknown"
            : "Unknown";
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm">{name}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {r.patient?.membershipNumber ?? "—"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Hospital",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground text-sm">{r.hospital?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.hospital?.city || ""}</p>
        </div>
      ),
    },
    {
      header: "Services & Cost",
      cell: (r) => {
        const items = r.items || r.services || [];
        const serviceCount = items.length;
        const totalCost = items.reduce((sum, it) => sum + (it.cost || 0), 0);
        const firstServiceName = items[0]?.name || r.service?.name || "Medical Service";

        return (
          <div>
            <p className="font-medium text-foreground text-sm">
              {serviceCount > 1 ? `${firstServiceName} (+${serviceCount - 1} more)` : firstServiceName}
            </p>
            <p className="text-xs font-semibold text-primary">
              ₦{totalCost.toLocaleString()} ({serviceCount} item{serviceCount === 1 ? "" : "s"})
            </p>
          </div>
        );
      },
    },
    {
      header: "Request Status",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: "Date",
      cell: (r) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(r.requestDate ?? r.createdAt ?? "").toLocaleDateString("en-GB", {
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
      cell: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDetail(r)}
          className="gap-1.5 text-xs h-8"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          Review ({r.items?.length || r.services?.length || 1})
        </Button>
      ),
    },
  ];

  return (
    <HMOSidebarWrapper currentPath="/hmo/requests">
      <div className="min-h-screen bg-background overflow-auto">
        <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

        {/* Header */}
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                v2.0 Service-Level Review Queue
              </Badge>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold flex items-center gap-2 mt-1">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Authorization Requests & Reviews
            </h1>
            <p className="text-sm text-muted-foreground">
              Review pre-authorization requests and make independent decisions per service line item
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              compact
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRequests(false)}
              disabled={loading}
              className="gap-2 shrink-0 h-9"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="relative p-6 max-w-7xl mx-auto space-y-6">
          {/* Summary chips */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Total", value: requests.length, color: "bg-muted text-muted-foreground" },
              {
                label: "Pending",
                value: requests.filter((r) => r.status === "PENDING").length,
                color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
              },
              {
                label: "Approved",
                value: requests.filter(
                  (r) => r.status === "APPROVED" || r.status === "AUTO_APPROVED"
                ).length,
                color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              },
              {
                label: "Clarification Needed",
                value: requests.filter((r) => r.status === "MORE_INFORMATION_REQUIRED").length,
                color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
              },
              {
                label: "Rejected",
                value: requests.filter((r) => r.status === "REJECTED").length,
                color: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
              },
            ].map((chip) => (
              <span
                key={chip.label}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border/50 ${chip.color}`}
              >
                {chip.label}: {chip.value}
              </span>
            ))}
          </div>

          {/* Search & Filter */}
          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search patient, hospital, service, code..."
            statusFilter={statusTab}
            onStatusFilterChange={setStatusTab}
            statusOptions={STATUS_OPTIONS}
            extraFilters={
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
                compact
              />
            }
            onResetFilters={() => {
              setSearch("");
              setStatusTab("ALL");
              setDateRange({ preset: "all", startDate: "", endDate: "" });
            }}
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
            emptyTitle="No authorization requests"
            emptyDescription={
              search
                ? "No requests matching your search."
                : statusTab === "PENDING"
                ? "There are no pending requests in the review queue."
                : "No requests found for the selected filter."
            }
          />
        </div>

        {/* Step 4, 5, 6: Itemized HMO Review Modal */}
        {selected && (
          <Dialog open onOpenChange={(open) => !open && setSelected(null)}>
            <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Review Authorization Request
                  </DialogTitle>
                  <StatusBadge status={selected.status} />
                </div>
                <DialogDescription>
                  Auth Code: <code className="font-mono font-bold text-primary">{selected.authCode}</code> | Request ID: <code className="text-xs font-mono">{selected.id}</code>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Patient & Hospital Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient card */}
                  <div className="bg-card p-3.5 rounded-xl border border-border text-xs space-y-2">
                    <h4 className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" /> Patient Details
                    </h4>
                    <p className="font-semibold text-sm text-foreground">
                      {selected.patient?.user
                        ? `${selected.patient.user.firstName || ""} ${selected.patient.user.lastName || ""}`.trim() || selected.patient.user.name
                        : "—"}
                    </p>
                    <div className="text-muted-foreground space-y-1">
                      <p>Member No: <strong className="font-mono text-foreground">{selected.patient?.membershipNumber ?? "—"}</strong></p>
                      <p>Coverage Plan: <strong className="text-foreground">{selected.patient?.coveragePlan?.name ?? "Standard Plan"}</strong></p>
                      <p>Email: <span className="text-foreground">{selected.patient?.user?.email ?? "—"}</span></p>
                    </div>
                  </div>

                  {/* Provider card */}
                  <div className="bg-card p-3.5 rounded-xl border border-border text-xs space-y-2">
                    <h4 className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> Provider & Clinical Summary
                    </h4>
                    <p className="font-semibold text-sm text-foreground">{selected.hospital?.name ?? "—"}</p>
                    <div className="text-muted-foreground space-y-1">
                      <p>Location: <span className="text-foreground">{selected.hospital?.city}, {selected.hospital?.state}</span></p>
                      <p>ICD-10 / Code: <strong className="font-mono text-foreground">{selected.diagnosisCode || "None specified"}</strong></p>
                      {selected.diagnosisNotes && (
                        <p className="line-clamp-2">Encounter: <span className="text-foreground">{selected.diagnosisNotes}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 4 & 5: Itemized Service Line Items Review */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" /> Step 5 — Independent Service Decisions ({selected.items?.length || 1} item{selected.items?.length === 1 ? "" : "s"})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Each service can be independently Approved, Rejected, or Clarified
                      </p>
                    </div>
                  </div>

                  {/* Render each service line item */}
                  {(selected.items && selected.items.length > 0 ? selected.items : [
                    {
                      id: selected.id,
                      name: selected.service?.name || "Medical Service",
                      category: selected.service?.category || "Consultation",
                      cost: selected.service?.standardPrice || 5000,
                      quantity: selected.quantity || 1,
                      reason: selected.diagnosisNotes || "",
                      status: selected.status,
                      decisionReason: selected.reviews?.[0]?.comments,
                      reviewedAt: selected.reviews?.[0]?.reviewDate,
                      reviewerName: selected.reviews?.[0]?.reviewedBy?.user
                        ? `${selected.reviews[0].reviewedBy.user.firstName} ${selected.reviews[0].reviewedBy.user.lastName}`
                        : null,
                    },
                  ]).map((item: ServiceItemDetail, index: number) => {
                    const isItemPending = item.status === "PENDING" || item.status === "MORE_INFORMATION_REQUIRED";
                    const isItemSubmitting = submittingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3"
                      >
                        {/* Service Item Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">
                                #{index + 1}
                              </span>
                              <span className="font-semibold text-foreground text-sm">
                                {item.name || item.description}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-foreground">
                              ₦{(item.cost || 0).toLocaleString()}{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                (Qty: {item.quantity || 1})
                              </span>
                            </span>
                            <StatusBadge status={item.status} />
                          </div>
                        </div>

                        {/* Clinical Reason & Supporting Docs */}
                        <div className="text-xs space-y-1 bg-card p-2.5 rounded-lg border border-border/60">
                          <p className="text-muted-foreground">
                            <strong>Clinical Justification:</strong> {item.reason || "None specified"}
                          </p>
                          {item.supportingDocs && (
                            <p className="text-muted-foreground">
                              <strong>Supporting Docs:</strong> <span className="text-primary font-mono">{item.supportingDocs}</span>
                            </p>
                          )}
                        </div>

                        {/* Existing Review Record (Step 6) */}
                        {item.reviewedAt && (
                          <div className="p-2.5 bg-background rounded-lg border border-border/60 text-xs space-y-1">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>
                                Decided by: <strong className="text-foreground">{item.reviewerName || "HMO Staff"}</strong>
                              </span>
                              <span>{new Date(item.reviewedAt).toLocaleString("en-GB")}</span>
                            </div>
                            {item.decisionReason && (
                              <p className="text-foreground mt-1">
                                <strong>Rationale:</strong> {item.decisionReason}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Decision Controls (if pending or clarification needed) */}
                        {isItemPending && (
                          <div className="pt-2 space-y-2">
                            <label
                              htmlFor={`notes-${item.id}`}
                              className="text-xs font-medium text-foreground block"
                            >
                              Decision Notes / Question for Provider
                            </label>
                            <input
                              id={`notes-${item.id}`}
                              type="text"
                              value={itemNotes[item.id] || ""}
                              onChange={(e) =>
                                setItemNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              placeholder="Clinical rationale, dosage questions, or rejection reason..."
                              className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex flex-wrap gap-2 pt-1">
                              {/* Approve */}
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                                disabled={isItemSubmitting}
                                onClick={() => submitItemReview(item.id, "APPROVED")}
                              >
                                {isItemSubmitting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Approve Service
                              </Button>

                              {/* Request More Information */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 text-xs h-8 gap-1.5"
                                disabled={isItemSubmitting}
                                onClick={() => submitItemReview(item.id, "MORE_INFORMATION_REQUIRED")}
                              >
                                {isItemSubmitting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <FileQuestion className="h-3.5 w-3.5 text-purple-600" />
                                )}
                                Request More Info
                              </Button>

                              {/* Reject */}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs h-8 gap-1.5"
                                disabled={isItemSubmitting}
                                onClick={() => submitItemReview(item.id, "REJECTED")}
                              >
                                {isItemSubmitting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                Reject Service
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Previous Relevant Authorizations (Section 18 requirement) */}
                {selected.previousAuthorizations && selected.previousAuthorizations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" /> Previous Relevant Authorizations for this Patient
                    </h4>
                    <div className="space-y-2">
                      {selected.previousAuthorizations.map((prev: any) => (
                        <div
                          key={prev.id}
                          className="p-3 bg-muted/30 rounded-lg border border-border text-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary">#{prev.authCode || prev.id.substring(0, 8)}</span>
                              <span className="font-medium text-foreground">{prev.serviceSummary}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {prev.hospitalName} • {new Date(prev.requestDate).toLocaleDateString("en-GB")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-foreground">₦{prev.totalCost.toLocaleString()}</span>
                            <StatusBadge status={prev.status} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close Review Panel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </HMOSidebarWrapper>
  );
}
