"use client";

/**
 * HMO Dashboard (ClearMed).
 *
 * Overview:
 * • Total enrolled patients
 * • Pending authorizations (service-level count)
 * • Approved authorizations
 * • Rejected authorizations
 * • Completed authorizations
 * • Coverage utilization
 *
 * Authorization Queue:
 * HMO staff see, per service line: Request ID, Patient, Hospital, Service, Estimated amount, Date submitted, Status.
 * Sortable/filterable by status, date, hospital, and patient.
 *
 * Section 18 HMO Authorization Review:
 * Full modal inspecting patient info, coverage plan, hospital info, requested services, estimated costs, supporting information,
 * previous relevant authorizations, and per-service decisions (Approve, Reject, Request More Information).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { HMOSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DateRangeFilter,
  DateRangeValue,
} from "@/components/shared";
import {
  ClipboardCheck,
  ClipboardList,
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
  Users,
  Clock,
  CheckCheck,
  FileQuestion,
  History,
  Shield,
  ArrowUpDown,
  Activity,
  Layers,
  Plus,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { HMOPlanSetupModal } from "@/components/hmo";

interface ServiceQueueItem {
  id: string; // item id
  requestId: string;
  authCode: string;
  patientId: string;
  patientName: string;
  membershipNumber: string;
  planName: string;
  hospitalId: string;
  hospitalName: string;
  serviceName: string;
  category: string;
  cost: number;
  hmoPayable: number;
  patientCoPay: number;
  quantity: number;
  reason: string;
  requestDate: string;
  status: string;
  decisionReason: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
}

interface CoverageUtilization {
  totalPoolLimit: number;
  usedAmount: number;
  reservedAmount: number;
  remainingPool: number;
  utilizationPercentage: number;
}

interface HMODashboardData {
  hmoName: string;
  totalEnrolledPatients: number;
  pendingAuthorizations: number;
  approvedAuthorizations: number;
  rejectedAuthorizations: number;
  completedAuthorizations: number;
  moreInfoAuthorizations: number;
  coverageUtilization: CoverageUtilization;
  topHospitals: Array<{ name: string; count: number; totalAmount: number }>;
  queue: ServiceQueueItem[];
}

interface DetailedAuthRequest {
  id: string;
  authCode: string | null;
  status: string;
  requestDate: string;
  diagnosisCode: string | null;
  diagnosisNotes: string | null;
  quantity: number;
  patient: {
    user: { firstName: string; lastName: string; email: string; phoneNumber?: string };
    membershipNumber: string;
    coveragePlan: {
      name: string;
      description?: string;
      coverageRules?: Array<{
        coveragePercentage: number;
        requiresPreAuth: boolean;
        annualLimit?: number | null;
        service?: { name: string; code: string };
      }>;
    };
  } | null;
  hospital: { id: string; name: string; city: string; state: string; address?: string };
  service?: { id: string; name: string; category: string; standardPrice: number };
  items?: Array<{
    id: string;
    description?: string;
    name?: string;
    category: string;
    cost: number;
    quantity: number;
    reason?: string;
    supportingDocs?: string;
    status: string;
    decisionReason?: string | null;
    reviewerName?: string | null;
    reviewedAt?: string | null;
  }>;
  previousAuthorizations?: Array<{
    id: string;
    authCode: string | null;
    status: string;
    requestDate: string;
    hospitalName: string;
    serviceSummary: string;
    totalCost: number;
  }>;
  reviews?: Array<{
    id: string;
    decision: string;
    comments: string | null;
    reviewDate: string;
  }>;
}

const STATUS_FILTER_OPTIONS = [
  { label: "All Statuses", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "More Info Required", value: "MORE_INFORMATION_REQUIRED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Completed", value: "COMPLETED" },
];

export default function HMODashboardPage() {
  const [data, setData] = useState<HMODashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: "all",
    startDate: "",
    endDate: "",
  });

  // Queue filter & sort state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [hospitalFilter, setHospitalFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  // Section 18 Review Dialog state
  const [selectedRequest, setSelectedRequest] = useState<DetailedAuthRequest | null>(null);
  const [itemDecisionNotes, setItemDecisionNotes] = useState<Record<string, string>>({});
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);

  // Coverage Plan Setup state
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [plansCount, setPlansCount] = useState<number | null>(null);

  const checkPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/hmo/coverage-plans");
      if (res.ok) {
        const plans = await res.json();
        const count = Array.isArray(plans) ? plans.length : 0;
        setPlansCount(count);
        // If url has setup=true or user has 0 plans, open setup modal
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("setup") === "true" || count === 0) {
            setSetupModalOpen(true);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkPlans();
  }, [checkPlans]);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hmo/dashboard");
      if (!res.ok) throw new Error("Failed to load HMO dashboard data");
      const result = await res.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading dashboard");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);
    // Silent auto-refresh polling every 25 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 25_000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Open Section 18 Review Modal
  const openReviewModal = async (requestId: string) => {
    try {
      const res = await fetch(`/api/authorizations/${requestId}`);
      if (!res.ok) throw new Error("Failed to fetch authorization details");
      const detailed = await res.json();
      setSelectedRequest(detailed);
      setItemDecisionNotes({});
    } catch {
      toast.error("Could not load request details");
    }
  };

  // Section 18: Decision per service
  const handleItemDecision = async (
    itemId: string,
    decision: "APPROVED" | "REJECTED" | "MORE_INFORMATION_REQUIRED"
  ) => {
    if (!selectedRequest) return;
    const note = itemDecisionNotes[itemId] || "";

    if (decision === "REJECTED" && !note.trim()) {
      toast.error("A rejection reason/comment is required");
      return;
    }

    if (decision === "MORE_INFORMATION_REQUIRED" && !note.trim()) {
      toast.error("Please state what additional information is required");
      return;
    }

    setSubmittingItemId(itemId);
    try {
      const res = await fetch(`/api/authorizations/${selectedRequest.id}/items/${itemId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comments: note }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit decision");
      }

      toast.success(
        decision === "APPROVED"
          ? "Service approved"
          : decision === "REJECTED"
          ? "Service rejected"
          : "Clarification requested from provider"
      );

      // Refresh modal detail
      const refreshed = await fetch(`/api/authorizations/${selectedRequest.id}`);
      if (refreshed.ok) {
        const refData = await refreshed.json();
        setSelectedRequest(refData);
      }

      // Refresh dashboard queue & metrics
      fetchDashboardData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving review decision");
    } finally {
      setSubmittingItemId(null);
    }
  };

  // Unique hospitals for filtering
  const hospitalOptions = useMemo(() => {
    if (!data?.queue) return [];
    const map = new Map<string, string>();
    data.queue.forEach((item) => {
      if (item.hospitalId && item.hospitalName) {
        map.set(item.hospitalId, item.hospitalName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data?.queue]);

  // Date-filtered source items for metrics calculation
  const dateFilteredItems = useMemo(() => {
    if (!data?.queue) return [];
    if (!dateRange.startDate && !dateRange.endDate) return data.queue;

    return data.queue.filter((item) => {
      const itemDate = new Date(item.requestDate).toISOString().split("T")[0];
      if (dateRange.startDate && itemDate < dateRange.startDate) return false;
      if (dateRange.endDate && itemDate > dateRange.endDate) return false;
      return true;
    });
  }, [data?.queue, dateRange]);

  // Comprehensive Total Metrics calculation
  const metrics = useMemo(() => {
    const isDateFiltered = Boolean(dateRange.startDate || dateRange.endDate);
    const sourceItems = isDateFiltered ? dateFilteredItems : (data?.queue || []);

    const distinctRequests = new Set(sourceItems.map((i) => i.requestId)).size;
    const totalServices = sourceItems.length;

    if (!isDateFiltered && data) {
      return {
        totalRequests: distinctRequests,
        totalServices:
          data.pendingAuthorizations +
          data.approvedAuthorizations +
          data.moreInfoAuthorizations +
          data.rejectedAuthorizations +
          data.completedAuthorizations,
        pending: data.pendingAuthorizations,
        approved: data.approvedAuthorizations,
        moreInfo: data.moreInfoAuthorizations,
        rejected: data.rejectedAuthorizations,
        completed: data.completedAuthorizations,
        isDateFiltered: false,
      };
    }

    let pending = 0;
    let approved = 0;
    let moreInfo = 0;
    let rejected = 0;
    let completed = 0;

    sourceItems.forEach((item) => {
      if (item.status === "PENDING") pending++;
      else if (item.status === "APPROVED" || item.status === "AUTO_APPROVED") approved++;
      else if (item.status === "MORE_INFORMATION_REQUIRED") moreInfo++;
      else if (item.status === "REJECTED") rejected++;
      else if (item.status === "COMPLETED") completed++;
    });

    return {
      totalRequests: distinctRequests,
      totalServices,
      pending,
      approved,
      moreInfo,
      rejected,
      completed,
      isDateFiltered,
    };
  }, [data, dateRange, dateFilteredItems]);

  // Filter & sort service queue
  const filteredQueue = useMemo(() => {
    if (!data?.queue) return [];

    return data.queue
      .filter((item) => {
        // Date range filter
        if (dateRange.startDate || dateRange.endDate) {
          const itemDate = new Date(item.requestDate).toISOString().split("T")[0];
          if (dateRange.startDate && itemDate < dateRange.startDate) return false;
          if (dateRange.endDate && itemDate > dateRange.endDate) return false;
        }

        // Search filter
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          item.patientName.toLowerCase().includes(q) ||
          item.membershipNumber.toLowerCase().includes(q) ||
          item.hospitalName.toLowerCase().includes(q) ||
          item.serviceName.toLowerCase().includes(q) ||
          item.authCode.toLowerCase().includes(q) ||
          item.requestId.toLowerCase().includes(q);

        // Status filter
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "APPROVED"
            ? ["APPROVED", "AUTO_APPROVED"].includes(item.status)
            : item.status === statusFilter);

        // Hospital filter
        const matchesHospital =
          hospitalFilter === "ALL" || item.hospitalId === hospitalFilter;

        return matchesSearch && matchesStatus && matchesHospital;
      })
      .sort((a, b) => {
        if (sortBy === "date_desc") {
          return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        }
        if (sortBy === "date_asc") {
          return new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
        }
        if (sortBy === "amount_desc") {
          return b.cost - a.cost;
        }
        if (sortBy === "amount_asc") {
          return a.cost - b.cost;
        }
        return 0;
      });
  }, [data?.queue, search, statusFilter, hospitalFilter, sortBy, dateRange]);

  // Queue table columns
  const queueColumns: Column<ServiceQueueItem>[] = [
    {
      header: "Request ID & Code",
      cell: (item) => (
        <div>
          <div className="flex items-center gap-1.5">
            <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              #{item.authCode || item.requestId.substring(0, 8)}
            </code>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            ID: {item.requestId.substring(0, 8)}…
          </p>
        </div>
      ),
    },
    {
      header: "Patient",
      cell: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {item.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs">{item.patientName}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{item.membershipNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Hospital Provider",
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground text-xs">{item.hospitalName}</p>
          <p className="text-[11px] text-muted-foreground">{item.planName}</p>
        </div>
      ),
    },
    {
      header: "Service Description",
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground text-xs">{item.serviceName}</p>
          <Badge variant="outline" className="text-[10px] mt-0.5">
            {item.category}
          </Badge>
        </div>
      ),
    },
    {
      header: "Estimated Amount",
      cell: (item) => (
        <div>
          <span className="font-bold text-foreground text-xs">
            ₦{item.cost.toLocaleString()}
          </span>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
            HMO 85%: ₦{item.hmoPayable.toLocaleString()}
          </p>
        </div>
      ),
    },
    {
      header: "Date Submitted",
      cell: (item) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(item.requestDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      header: "Action",
      className: "text-right",
      cell: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openReviewModal(item.requestId)}
          className="gap-1.5 text-xs h-7 px-2.5"
        >
          <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> Review
        </Button>
      ),
    },
  ];

  return (
    <HMOSidebarWrapper currentPath="/hmo/dashboard">
      <PageShell>
        <PageHeader
          title="HMO Management Dashboard"
          subtitle={`Health Coverage Overview & Authorization Queue • ${data?.hmoName || "ClearMed HMO"}${
            lastUpdated ? ` • Updated ${lastUpdated.toLocaleTimeString()}` : ""
          }`}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSetupModalOpen(true)}
                className="gap-1.5 shrink-0 h-9 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Coverage Plans {plansCount !== null ? `(${plansCount})` : ""}
              </Button>
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
                compact
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDashboardData(false)}
                disabled={loading}
                className="gap-2 shrink-0 h-9"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
            </div>
          }
        />

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Setup Banner if no plans exist */}
          {plansCount === 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Welcome to ClearMed HMO! Set up your Coverage Plans</h3>
                  <p className="text-xs text-muted-foreground">
                    You have not configured any health coverage plans yet. Set up your plans so patients can select your HMO and enroll with their Member ID.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setSetupModalOpen(true)}
                size="sm"
                className="gap-2 shrink-0 bg-primary text-primary-foreground shadow-sm"
              >
                <Plus className="h-4 w-4" /> Set Up Plans
              </Button>
            </div>
          )}

          {/* Total Metrics Board */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-primary" /> Metrics & Performance Summary
                </h2>
                {metrics.isDateFiltered && (
                  <Badge variant="outline" className="text-[11px] font-semibold bg-primary/10 text-primary border-primary/20">
                    Filtered: {dateRange.startDate || "Beginning"} → {dateRange.endDate || "Present"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <DateRangeFilter
                  value={dateRange}
                  onChange={setDateRange}
                  compact
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Requests"
                value={data ? metrics.totalRequests.toLocaleString() : "—"}
                badge="Requests"
                icon={ClipboardList}
                iconColor="primary"
              />
              <MetricCard
                label="Total Services"
                value={data ? metrics.totalServices.toLocaleString() : "—"}
                badge="All Volume"
                icon={Layers}
                iconColor="blue"
              />
              <MetricCard
                label="Enrolled Patients"
                value={data ? data.totalEnrolledPatients.toLocaleString() : "—"}
                badge="Enrolled"
                icon={Users}
                iconColor="primary"
              />
              <MetricCard
                label="Pending Services"
                value={data ? metrics.pending.toLocaleString() : "—"}
                badge="Queue"
                icon={Clock}
                iconColor="amber"
              />
              <MetricCard
                label="Approved Services"
                value={data ? metrics.approved.toLocaleString() : "—"}
                badge="Approved"
                icon={CheckCircle2}
                iconColor="green"
              />
              <MetricCard
                label="Clarification Needed"
                value={data ? metrics.moreInfo.toLocaleString() : "—"}
                badge="Action"
                icon={FileQuestion}
                iconColor="purple"
              />
              <MetricCard
                label="Rejected Services"
                value={data ? metrics.rejected.toLocaleString() : "—"}
                badge="Declined"
                icon={XCircle}
                iconColor="red"
              />
              <MetricCard
                label="Completed (Claimed)"
                value={data ? metrics.completed.toLocaleString() : "—"}
                badge="Fulfilled"
                icon={CheckCheck}
                iconColor="blue"
              />
            </div>
          </div>

          {/* Coverage Utilization Card */}
          {data && (
            <Card className="data-visualization border-border/80">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" /> Coverage Utilization & Financial Exposure
                    </CardTitle>
                    <CardDescription>
                      Annual limit pool allocated across {data.totalEnrolledPatients} enrolled members (₦500k standard limit)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/25 self-start sm:self-auto">
                    Utilization: {data.coverageUtilization.utilizationPercentage}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-muted/40 rounded-xl border">
                    <span className="text-muted-foreground block mb-1">Total Pool Limit</span>
                    <span className="text-sm font-bold text-foreground">
                      ₦{data.coverageUtilization.totalPoolLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <span className="text-blue-700 dark:text-blue-300 block mb-1">Used Amount (Claimed)</span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      ₦{data.coverageUtilization.usedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-300 block mb-1">Reserved Liability (Approved)</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      ₦{data.coverageUtilization.reservedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <span className="text-purple-700 dark:text-purple-300 block mb-1">Remaining Pool Headroom</span>
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                      ₦{data.coverageUtilization.remainingPool.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Utilization Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pool Consumption</span>
                    <span>{data.coverageUtilization.utilizationPercentage}% used</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 transition-all"
                      style={{
                        width: `${Math.min(100, data.coverageUtilization.utilizationPercentage)}%`,
                      }}
                      title="Used (Claimed)"
                    />
                    <div
                      className="bg-emerald-500 opacity-60 transition-all"
                      style={{
                        width: `${Math.min(
                          100 - data.coverageUtilization.utilizationPercentage,
                          data.coverageUtilization.totalPoolLimit > 0
                            ? (data.coverageUtilization.reservedAmount / data.coverageUtilization.totalPoolLimit) * 100
                            : 0
                        )}%`,
                      }}
                      title="Reserved (Approved)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Authorization Queue Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" /> Authorization Queue (Service-Level)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Individual service line items awaiting or undergoing HMO authorization review
                </p>
              </div>
              <Badge variant="outline" className="text-xs self-start sm:self-auto">
                Showing {filteredQueue.length} of {data?.queue?.length || 0} service lines
              </Badge>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex-1">
                <SearchFilterBar
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search by Patient, Member ID, Hospital, Service, Code..."
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  statusOptions={STATUS_FILTER_OPTIONS}
                  onResetFilters={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setHospitalFilter("ALL");
                    setDateRange({ preset: "all", startDate: "", endDate: "" });
                  }}
                />
              </div>

              {/* Secondary Hospital & Sort Selectors */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Date Filter */}
                <DateRangeFilter
                  value={dateRange}
                  onChange={setDateRange}
                  compact
                />

                {/* Hospital Filter */}
                {hospitalOptions.length > 0 && (
                  <select
                    value={hospitalFilter}
                    onChange={(e) => setHospitalFilter(e.target.value)}
                    className="h-10 px-3 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ALL">All Hospitals</option>
                    {hospitalOptions.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-10 px-3 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="date_desc">Newest Date First</option>
                  <option value="date_asc">Oldest Date First</option>
                  <option value="amount_desc">Highest Cost First</option>
                  <option value="amount_asc">Lowest Cost First</option>
                </select>
              </div>
            </div>

            {/* Service Queue Data Table */}
            <DataTable
              columns={queueColumns}
              data={filteredQueue}
              isLoading={loading}
              emptyTitle="No service lines in queue"
              emptyDescription={
                search || statusFilter !== "ALL" || hospitalFilter !== "ALL"
                  ? "No authorization services matching your current filters."
                  : "All service line items have been reviewed."
              }
            />
          </div>
        </div>

        {/* Section 18: HMO Authorization Review Modal */}
        {selectedRequest && (
          <Dialog open onOpenChange={(open) => !open && setSelectedRequest(null)}>
            <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Section 18 — HMO Authorization Review
                  </DialogTitle>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <DialogDescription>
                  Pre-Auth Code: <code className="font-mono font-bold text-primary">#{selectedRequest.authCode}</code> | Request ID: <code className="text-xs font-mono">{selectedRequest.id}</code>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* 1. Patient & Coverage Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="data-visualization">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" /> Patient & Membership
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {selectedRequest.patient?.user
                          ? `${selectedRequest.patient.user.firstName} ${selectedRequest.patient.user.lastName}`
                          : "Unknown"}
                      </p>
                      <p className="text-muted-foreground">
                        Member ID: <strong className="font-mono text-foreground">{selectedRequest.patient?.membershipNumber}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        Email: <span className="text-foreground">{selectedRequest.patient?.user?.email || "—"}</span>
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="data-visualization">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-primary" /> Plan & Coverage Policy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {selectedRequest.patient?.coveragePlan?.name || "Standard Plan"}
                      </p>
                      <p className="text-muted-foreground">
                        Coverage Rate: <strong className="text-emerald-600 font-semibold">85% HMO / 15% Patient Co-Pay</strong>
                      </p>
                      <p className="text-muted-foreground">
                        Provider: <strong className="text-foreground">{selectedRequest.hospital?.name}</strong> ({selectedRequest.hospital?.city})
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 2. Clinical Context & Supporting Notes */}
                {selectedRequest.diagnosisNotes && (
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" /> Encounter Clinical Summary / ICD: {selectedRequest.diagnosisCode || "GENERAL"}
                    </span>
                    <p className="text-muted-foreground">{selectedRequest.diagnosisNotes}</p>
                  </div>
                )}

                {/* 3. Section 18 Itemized Services & Per-Service Decision */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" /> Requested Services ({selectedRequest.items?.length || 1})
                  </h4>

                  {(selectedRequest.items && selectedRequest.items.length > 0
                    ? selectedRequest.items
                    : [
                        {
                          id: selectedRequest.id,
                          description: selectedRequest.service?.name || "Medical Service",
                          category: selectedRequest.service?.category || "Consultation",
                          cost: selectedRequest.service?.standardPrice || 5000,
                          quantity: selectedRequest.quantity || 1,
                          reason: selectedRequest.diagnosisNotes || "",
                          status: selectedRequest.status,
                        },
                      ]
                  ).map((item, index) => {
                    const isPending = item.status === "PENDING" || item.status === "MORE_INFORMATION_REQUIRED";
                    const isSubmitting = submittingItemId === item.id;
                    const hmoPayable = Math.round((item.cost || 0) * 0.85);

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-border/80 bg-card space-y-3 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                            <span className="font-semibold text-foreground text-sm">
                              {item.description || item.name}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {item.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground text-sm">
                              ₦{(item.cost || 0).toLocaleString()}
                            </span>
                            <StatusBadge status={item.status} size="sm" />
                          </div>
                        </div>

                        <div className="space-y-1 text-muted-foreground">
                          <p><strong>Clinical Reason:</strong> {item.reason || "None provided"}</p>
                          {item.supportingDocs && (
                            <p><strong>Supporting Docs:</strong> <span className="text-primary font-mono">{item.supportingDocs}</span></p>
                          )}
                          <p>
                            <strong>HMO Payable (85%):</strong> ₦{hmoPayable.toLocaleString()} | <strong>Patient Co-pay (15%):</strong> ₦{((item.cost || 0) - hmoPayable).toLocaleString()}
                          </p>
                        </div>

                        {/* Existing decision info if decided */}
                        {item.reviewedAt && (
                          <div className="p-2 bg-muted/40 rounded border text-xs">
                            <span className="text-muted-foreground">Reviewed by: <strong>{item.reviewerName || "HMO Staff"}</strong> on {new Date(item.reviewedAt).toLocaleString("en-GB")}</span>
                            {item.decisionReason && (
                              <p className="mt-1 text-foreground"><strong>Rationale:</strong> {item.decisionReason}</p>
                            )}
                          </div>
                        )}

                        {/* Per-Service Decision Actions */}
                        {isPending && (
                          <div className="pt-2 border-t space-y-2">
                            <label htmlFor={`decision-note-${item.id}`} className="font-medium text-foreground block">
                              Reviewer Reason / Question for Provider
                            </label>
                            <input
                              id={`decision-note-${item.id}`}
                              type="text"
                              value={itemDecisionNotes[item.id] || ""}
                              onChange={(e) =>
                                setItemDecisionNotes((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="Provide clinical rationale or state missing details..."
                              className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                                disabled={isSubmitting}
                                onClick={() => handleItemDecision(item.id, "APPROVED")}
                              >
                                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                Approve Service
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 text-xs h-8 gap-1.5"
                                disabled={isSubmitting}
                                onClick={() => handleItemDecision(item.id, "MORE_INFORMATION_REQUIRED")}
                              >
                                <FileQuestion className="h-3.5 w-3.5 text-purple-600" />
                                Request More Info
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs h-8 gap-1.5"
                                disabled={isSubmitting}
                                onClick={() => handleItemDecision(item.id, "REJECTED")}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject Service
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 4. Previous Relevant Authorizations (Section 18 requirement) */}
                {selectedRequest.previousAuthorizations && selectedRequest.previousAuthorizations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-primary" /> Previous Relevant Authorizations for this Patient
                    </h4>
                    <div className="space-y-2">
                      {selectedRequest.previousAuthorizations.map((prev) => (
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
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close Review Dialog
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Coverage Plan Setup Modal */}
        <HMOPlanSetupModal
          open={setupModalOpen}
          onOpenChange={setSetupModalOpen}
          onPlansUpdated={() => {
            checkPlans();
            fetchDashboardData(true);
          }}
        />
      </PageShell>
    </HMOSidebarWrapper>
  );
}
