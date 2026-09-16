"use client";

/**
 * Hospital Dashboard (ClearMed v2.0).
 *
 * Overview:
 * • Total authorization requests
 * • Pending requests
 * • Approved requests
 * • Rejected requests
 * • Completed requests
 *
 * Provider Capabilities:
 * - Create requests
 * - View requests
 * - Search patients (within Section 8.3 binding rule)
 * - View request details
 * - Track HMO decisions
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  SearchFilterBar,
  DataTable,
  StatusBadge,
  Column,
  PageShell,
  PageHeader,
  MetricCard,
  ProgressBar,
} from "@/components/shared";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  CheckCheck,
  PlusCircle,
  Search,
  UserCheck,
  Users,
  Eye,
  RefreshCw,
  Building2,
  ShieldCheck,
  Stethoscope,
  Pill,
  Microscope,
  CalendarDays,
  Copy,
  Check,
  ArrowUpRight,
  HelpCircle,
  Activity,
  AlertTriangle,
  Loader2,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  quantity: number;
  reason?: string;
  status: string;
  decisionReason?: string | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  fulfilledByName?: string | null;
  fulfilledAt?: string | null;
}

interface HospitalRequest {
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
  items: ServiceItem[];
  services: ServiceItem[];
  requestedByName: string;
  reviewComments?: string | null;
  reviewedAt?: string | null;
  hasServiceDelivery: boolean;
}

interface PatientLookupResult {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  membershipNumber: string;
  hmoName: string;
  planName: string;
  bindingType: string;
}

export default function HospitalDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<HospitalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Patient Search (Section 8.3 Binding rule) state
  const [isSearchPatientOpen, setIsSearchPatientOpen] = useState(false);
  const [membershipQuery, setMembershipQuery] = useState("");
  const [patientLookupResults, setPatientLookupResults] = useState<PatientLookupResult[]>([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState("");

  // Request Details & HMO Decision Inspection state
  const [selectedRequest, setSelectedRequest] = useState<HospitalRequest | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchHospitalRequests = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch("/api/hospital/requests");
      if (!res.ok) throw new Error("Failed to load hospital requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Could not fetch hospital requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitalRequests();
  }, [fetchHospitalRequests]);

  // Handle Section 8.3 Patient Search
  const handleSearchPatient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchingPatient(true);
    setPatientSearchError("");
    setPatientLookupResults([]);

    try {
      const qs = membershipQuery.trim()
        ? `?membershipNumber=${encodeURIComponent(membershipQuery.trim())}`
        : "";
      const res = await fetch(`/api/hospital/patients${qs}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No patient found");
      }

      setPatientLookupResults(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        setPatientSearchError("No patient matching the criteria found under hospital binding.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setPatientSearchError(msg);
    } finally {
      setSearchingPatient(false);
    }
  };

  // Open Patient Verification modal
  const openPatientSearchModal = () => {
    setIsSearchPatientOpen(true);
    setMembershipQuery("");
    setPatientSearchError("");
    setPatientLookupResults([]);
    // Preload hospital-bound patients
    handleSearchPatient();
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const approved = requests.filter((r) =>
      ["APPROVED", "AUTO_APPROVED", "PARTIALLY_APPROVED"].includes(r.status)
    ).length;
    const rejected = requests.filter((r) => r.status === "REJECTED").length;
    const completed = requests.filter((r) => r.status === "COMPLETED").length;
    const moreInfo = requests.filter((r) => r.status === "MORE_INFORMATION_REQUIRED").length;

    const approvalRate =
      total > 0 ? Math.round(((approved + completed) / total) * 100) : 0;

    return { total, pending, approved, rejected, completed, moreInfo, approvalRate };
  }, [requests]);

  // Filtered requests for the table
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.patientName.toLowerCase().includes(q) ||
        r.serviceName.toLowerCase().includes(q) ||
        r.hmoName.toLowerCase().includes(q) ||
        r.authCode.toLowerCase().includes(q) ||
        r.diagnosisNotes.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "APPROVED"
          ? ["APPROVED", "AUTO_APPROVED", "PARTIALLY_APPROVED"].includes(r.status)
          : r.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  // Copy Auth Code helper
  const handleCopyAuthCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Authorization code copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Columns definition for DataTable
  const columns: Column<HospitalRequest>[] = [
    {
      header: "Auth Code / ID",
      accessorKey: "authCode",
      cell: (row) => (
        <div>
          {row.authCode ? (
            <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {row.authCode}
            </span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              {row.id.substring(0, 10)}...
            </span>
          )}
          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
            <CalendarDays className="w-3 h-3" />
            {new Date(row.requestDate).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      header: "Patient & Coverage",
      accessorKey: "patientName",
      cell: (row) => (
        <div>
          <div className="font-semibold text-sm text-foreground">
            {row.patientName}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            {row.hmoName} • {row.planName}
          </div>
        </div>
      ),
    },
    {
      header: "Requested Services",
      accessorKey: "serviceName",
      cell: (row) => (
        <div className="max-w-[240px]">
          <div className="font-medium text-xs text-foreground truncate">
            {row.serviceName}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {row.category}
            </Badge>
            <span>{row.items?.length || 1} line item(s)</span>
          </div>
        </div>
      ),
    },
    {
      header: "Estimated Total",
      accessorKey: "price",
      cell: (row) => (
        <div className="font-semibold text-xs text-foreground">
          ₦{row.price.toLocaleString()}
        </div>
      ),
    },
    {
      header: "HMO Decision Status",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedRequest(row)}
          className="h-8 px-2.5 text-xs font-medium gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </Button>
      ),
    },
  ];

  return (
    <HospitalSidebarWrapper currentPath="/hospital/dashboard">
      <PageShell>
        <PageHeader
          title="Hospital Provider Dashboard"
          subtitle="Real-time authorization requests, patient coverage lookup, and HMO decision tracking"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHospitalRequests(true)}
                disabled={loading || refreshing}
                className="gap-1.5 text-xs"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={openPatientSearchModal}
                className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <Search className="h-3.5 w-3.5" />
                Search Patient (Section 8.3)
              </Button>

              <Link href="/hospital/request/new">
                <Button size="sm" className="gap-1.5 text-xs bg-primary hover:bg-primary/90">
                  <PlusCircle className="h-3.5 w-3.5" />
                  + Create Request
                </Button>
              </Link>
            </div>
          }
        />

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Quick Action & Greeting Banner */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Healthcare Provider Operations Hub
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl">
                Create multi-service authorizations, verify patient HMO coverage limits under Section 8.3 binding rules, and track independent HMO line-item decisions in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link href="/hospital/request/new">
                <Button size="sm" className="text-xs bg-primary hover:bg-primary/90 gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" />
                  New Authorization
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={openPatientSearchModal}
                className="text-xs gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Verify Patient
              </Button>
              <Link href="/hospital/staff">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                  <Users className="w-3.5 h-3.5" />
                  Staff (Section 20)
                </Button>
              </Link>
            </div>
          </div>

          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="Total Requests"
              value={String(metrics.total)}
              badge="+Live"
              trend="stable"
              icon={FileText}
              iconColor="primary"
            />
            <MetricCard
              label="Pending Requests"
              value={String(metrics.pending)}
              badge="Under Review"
              trend="stable"
              icon={Clock}
              iconColor="orange"
            />
            <MetricCard
              label="Approved Requests"
              value={String(metrics.approved)}
              badge={`${metrics.approvalRate}% rate`}
              trend="up"
              icon={CheckCircle2}
              iconColor="green"
            />
            <MetricCard
              label="Rejected Requests"
              value={String(metrics.rejected)}
              badge="Declined"
              trend="down"
              icon={XCircle}
              iconColor="red"
            />
            <MetricCard
              label="Completed Requests"
              value={String(metrics.completed)}
              badge="Fulfilled"
              trend="up"
              icon={CheckCheck}
              iconColor="purple"
            />
          </div>

          {/* Main Grid: Authorization Queue & HMO Decisions Tracker */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Hospital Authorization Queue & HMO Tracker
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Monitor pre-authorization submissions, service-level decisions, and clinical reasons
                    </CardDescription>
                  </div>

                  {/* Filter tabs & Search */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search patient, code, service..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-9 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                      {[
                        { label: "All", value: "ALL" },
                        { label: "Pending", value: "PENDING" },
                        { label: "Approved", value: "APPROVED" },
                        { label: "More Info", value: "MORE_INFORMATION_REQUIRED" },
                        { label: "Rejected", value: "REJECTED" },
                        { label: "Completed", value: "COMPLETED" },
                      ].map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => setStatusFilter(tab.value)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                            statusFilter === tab.value
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <DataTable
                  columns={columns}
                  data={filteredRequests}
                  isLoading={loading}
                  emptyTitle="No authorization requests found"
                  emptyDescription="No authorization requests found matching your filter."
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PATIENT SEARCH & VERIFICATION MODAL (SECTION 8.3 BINDING RULE)             */}
        {/* ========================================================================= */}
        <Dialog open={isSearchPatientOpen} onOpenChange={setIsSearchPatientOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-primary" />
                Patient Coverage Lookup (Section 8.3 Binding Rule)
              </DialogTitle>
              <DialogDescription className="text-xs">
                To protect patient confidentiality, providers can only access patients with historical binding at this hospital or by verifying an exact HMO Membership Number.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <form onSubmit={handleSearchPatient} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter exact HMO Membership No. (e.g. HMO-748392)"
                    value={membershipQuery}
                    onChange={(e) => setMembershipQuery(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={searchingPatient}
                  className="text-xs bg-primary hover:bg-primary/90 gap-1.5"
                >
                  {searchingPatient ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  Lookup
                </Button>
              </form>

              {patientSearchError && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription>{patientSearchError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {membershipQuery.trim()
                    ? "Verified Search Results"
                    : "Patients with Hospital History Binding"}
                </div>

                {patientLookupResults.length === 0 && !searchingPatient ? (
                  <div className="text-center py-6 text-xs text-muted-foreground border rounded-lg bg-muted/20">
                    No patient records found. Enter an exact HMO Membership Number to look up an unregistered walk-in patient.
                  </div>
                ) : (
                  patientLookupResults.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                          {p.name}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0 bg-primary/5 text-primary border-primary/20"
                          >
                            {p.membershipNumber}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.hmoName} • {p.planName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.email} {p.phoneNumber ? `• ${p.phoneNumber}` : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/hospital/request/new?patientId=${p.id}&membership=${p.membershipNumber}`}>
                          <Button
                            size="sm"
                            className="text-xs bg-primary hover:bg-primary/90 gap-1"
                          >
                            <PlusCircle className="w-3 h-3" />
                            Create Request
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchPatientOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* REQUEST DETAILS & HMO DECISION MODAL                                      */}
        {/* ========================================================================= */}
        <Dialog
          open={Boolean(selectedRequest)}
          onOpenChange={(open) => {
            if (!open) setSelectedRequest(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  Authorization Request Details
                </DialogTitle>
                {selectedRequest?.authCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAuthCode(selectedRequest.authCode)}
                    className="h-8 gap-1.5 text-xs font-mono font-bold bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {selectedRequest.authCode}
                  </Button>
                )}
              </div>
              <DialogDescription className="text-xs">
                Request ID: {selectedRequest?.id} • Submitted on{" "}
                {selectedRequest &&
                  new Date(selectedRequest.requestDate).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4 pt-2">
                {/* Header overview cards */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase font-medium">
                      Patient Details
                    </div>
                    <div className="font-semibold text-sm text-foreground mt-0.5">
                      {selectedRequest.patientName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedRequest.hmoName} ({selectedRequest.planName})
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase font-medium">
                      Overall Request Status
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Estimated Total:{" "}
                      <span className="font-semibold text-foreground">
                        ₦{selectedRequest.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                {(selectedRequest.diagnosisCode || selectedRequest.diagnosisNotes) && (
                  <div className="p-3 rounded-lg border bg-card space-y-1">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-primary" />
                      Clinical Context & Diagnosis
                    </div>
                    {selectedRequest.diagnosisCode && (
                      <div className="text-xs font-mono text-muted-foreground">
                        ICD Code: {selectedRequest.diagnosisCode}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {selectedRequest.diagnosisNotes || "No specific notes provided."}
                    </div>
                  </div>
                )}

                {/* Itemized Services & HMO Decisions */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Requested Services & HMO Decision Breakdown</span>
                    <span className="text-muted-foreground font-normal">
                      {selectedRequest.items?.length || 1} item(s)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(selectedRequest.items && selectedRequest.items.length > 0
                      ? selectedRequest.items
                      : [
                          {
                            id: selectedRequest.id,
                            name: selectedRequest.serviceName,
                            category: selectedRequest.category,
                            cost: selectedRequest.price,
                            quantity: selectedRequest.quantity || 1,
                            reason: selectedRequest.diagnosisNotes,
                            status: selectedRequest.status,
                            decisionReason: selectedRequest.reviewComments,
                            reviewedAt: selectedRequest.reviewedAt,
                          },
                        ]
                    ).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-lg border bg-card space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                              {item.name}
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {item.category}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Qty: {item.quantity} • Unit: ₦{(item.cost / item.quantity).toLocaleString()} • Total:{" "}
                              <span className="font-semibold text-foreground">
                                ₦{item.cost.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <StatusBadge status={item.status} />
                        </div>

                        {/* HMO Feedback on line item */}
                        {item.decisionReason && (
                          <div className="text-xs p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300">
                            <strong>HMO Reviewer Feedback:</strong> {item.decisionReason}
                            {item.reviewedAt && (
                              <span className="block text-[10px] text-muted-foreground mt-0.5">
                                Reviewed on {new Date(item.reviewedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resubmission alert if MORE_INFORMATION_REQUIRED */}
                {selectedRequest.status === "MORE_INFORMATION_REQUIRED" && (
                  <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300">
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-xs font-semibold">
                      Action Required: HMO Requested Clarification
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-0.5">
                      The HMO reviewer has requested additional clinical notes or documentation before approving. Please review the feedback above or contact the HMO team.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
                className="text-xs"
              >
                Close
              </Button>
              {selectedRequest?.authCode && (
                <Button
                  size="sm"
                  onClick={() => handleCopyAuthCode(selectedRequest.authCode)}
                  className="text-xs bg-primary hover:bg-primary/90 gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Auth Code
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
    </HospitalSidebarWrapper>
  );
}
