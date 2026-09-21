"use client";

/**
 * Admin Audit Log Viewer (v2.0).
 * Browseable, searchable, filterable paginated view of all system AuditLog records.
 * Compliant with NDPA 12-month minimum retention mandate and immutable record-keeping.
 * Restricted to SYSTEM_ADMIN.
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogIn,
  LogOut,
  Lock,
  UserCheck,
  ClipboardList,
  ClipboardCheck,
  Settings,
  Eye,
  Trash2,
  PlusCircle,
  Edit3,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserCog,
  Building2,
  Activity,
  HeartHandshake,
  FileQuestion,
  Ban,
  ShieldCheck,
} from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
}

interface PageData {
  logs: AuditEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ACTION_OPTIONS = [
  { label: "All Actions", value: "" },
  { label: "Login", value: "LOGIN" },
  { label: "Logout", value: "LOGOUT" },
  { label: "Login Failed", value: "LOGIN_FAILED" },
  { label: "Unauthorized Access Attempt", value: "UNAUTHORIZED_ACCESS_ATTEMPT" },
  { label: "User Created", value: "USER_CREATED" },
  { label: "User Updated", value: "USER_UPDATED" },
  { label: "Authorization Created", value: "AUTHORIZATION_CREATED" },
  { label: "Service Approved", value: "SERVICE_APPROVED" },
  { label: "Service Rejected", value: "SERVICE_REJECTED" },
  { label: "Service Info Requested", value: "SERVICE_MORE_INFO_REQUESTED" },
  { label: "Service Completed", value: "SERVICE_COMPLETED" },
  { label: "Service Cancelled", value: "SERVICE_CANCELLED" },
  { label: "Patient Updated", value: "PATIENT_UPDATED" },
  { label: "HMO Updated", value: "HMO_UPDATED" },
  { label: "Hospital Updated", value: "HOSPITAL_UPDATED" },
  { label: "Account Locked", value: "ACCOUNT_LOCKED" },
  { label: "MFA Verified", value: "MFA_VERIFIED" },
  { label: "MFA Failed", value: "MFA_FAILED" },
];

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  LOGOUT: "bg-muted text-muted-foreground border-border",
  LOGIN_FAILED: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  UNAUTHORIZED_ACCESS_ATTEMPT: "bg-red-600/15 text-red-700 dark:text-red-400 border-red-600/30 font-bold",
  USER_CREATED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  USER_UPDATED: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  AUTHORIZATION_CREATED: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  SERVICE_APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  SERVICE_REJECTED: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  SERVICE_MORE_INFO_REQUESTED: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  SERVICE_COMPLETED: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  SERVICE_CANCELLED: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20",
  PATIENT_UPDATED: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  HMO_UPDATED: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  HOSPITAL_UPDATED: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  ACCOUNT_LOCKED: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  MFA_VERIFIED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  MFA_FAILED: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  CREATE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  READ: "bg-muted text-muted-foreground border-border",
  UPDATE: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  DELETE: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  AUTH_REQUEST: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  AUTH_REVIEW: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  SERVICE_DELIVERY: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
};

function ActionIcon({ action }: { action: string }) {
  const cls = "h-4 w-4";
  switch (action) {
    case "LOGIN": return <LogIn className={cls} />;
    case "LOGOUT": return <LogOut className={cls} />;
    case "LOGIN_FAILED": return <AlertCircle className={cls} />;
    case "UNAUTHORIZED_ACCESS_ATTEMPT": return <ShieldAlert className={cls} />;
    case "USER_CREATED": return <UserPlus className={cls} />;
    case "USER_UPDATED": return <UserCog className={cls} />;
    case "AUTHORIZATION_CREATED": return <ClipboardList className={cls} />;
    case "SERVICE_APPROVED": return <CheckCircle2 className={cls} />;
    case "SERVICE_REJECTED": return <XCircle className={cls} />;
    case "SERVICE_MORE_INFO_REQUESTED": return <FileQuestion className={cls} />;
    case "SERVICE_COMPLETED": return <UserCheck className={cls} />;
    case "SERVICE_CANCELLED": return <Ban className={cls} />;
    case "PATIENT_UPDATED": return <HeartHandshake className={cls} />;
    case "HMO_UPDATED": return <Activity className={cls} />;
    case "HOSPITAL_UPDATED": return <Building2 className={cls} />;
    case "ACCOUNT_LOCKED": return <Lock className={cls} />;
    case "MFA_VERIFIED": return <ShieldCheck className={cls} />;
    case "MFA_FAILED": return <AlertCircle className={cls} />;
    case "CREATE": return <PlusCircle className={cls} />;
    case "READ": return <Eye className={cls} />;
    case "UPDATE": return <Edit3 className={cls} />;
    case "DELETE": return <Trash2 className={cls} />;
    default: return <Settings className={cls} />;
  }
}

function formatAction(action: string) {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const LIMIT = 50;

export default function AuditLogPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search ? { search } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      });
      const res = await fetch(`/api/admin/audit-log?${qs}`);
      if (!res.ok) throw new Error("Failed to load audit log");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, fromDate, toDate]);

  const logs = data?.logs ?? [];

  return (
    <div className="min-h-screen bg-background overflow-auto">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Audit Log & Compliance Trail
            </h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" /> Immutable (NDPA 12-Mo Retention)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading..."
              : `${data?.total ?? 0} total system events recorded · Audit records cannot be modified by users`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="relative p-6 max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <Card className="data-visualization">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Filter className="h-3.5 w-3.5" /> Filters & Search
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search details, entity..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Action filter */}
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* From date */}
                <div>
                  <label className="sr-only">From date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* To date */}
                <div>
                  <label className="sr-only">To date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {(search || actionFilter || fromDate || toDate) && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setSearch("");
                      setActionFilter("");
                      setFromDate("");
                      setToDate("");
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Log entries */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <Card className="data-visualization">
            <CardContent className="p-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-medium text-foreground mb-1">No log entries found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or refreshing the page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((entry) => (
              <Card
                key={entry.id}
                className="data-visualization hover:border-border transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Action icon */}
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        ACTION_COLORS[entry.action] ?? "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      <ActionIcon action={entry.action} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold ${
                              ACTION_COLORS[entry.action] ?? ""
                            }`}
                          >
                            {formatAction(entry.action)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            on{" "}
                            <span className="font-mono text-foreground font-medium">
                              {entry.entityType}
                            </span>
                          </span>
                          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground truncate max-w-[160px]">
                            {entry.entityId}
                          </code>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 font-mono">
                          {new Date(entry.timestamp).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>

                      {entry.details && (
                        <p className="text-sm text-foreground mt-1.5 font-medium">
                          {entry.details}
                        </p>
                      )}

                      {/* Actor */}
                      {entry.user ? (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[10px] shrink-0">
                            {entry.user.firstName ? entry.user.firstName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <span>
                            <span className="font-semibold text-foreground">
                              {entry.user.firstName} {entry.user.lastName}
                            </span>{" "}
                            · {entry.user.email} ·{" "}
                            <Badge variant="secondary" className="text-[10px] py-0 font-normal">
                              {formatAction(entry.user.role)}
                            </Badge>
                          </span>
                          {entry.ipAddress && (
                            <span className="text-muted-foreground/70 font-mono text-[11px]">
                              · IP: {entry.ipAddress}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-[10px] shrink-0">
                            <Shield className="h-3 w-3" />
                          </div>
                          <span className="font-medium text-muted-foreground italic">
                            Unauthenticated / System Event
                          </span>
                          {entry.ipAddress && (
                            <span className="text-muted-foreground/70 font-mono text-[11px]">
                              · IP: {entry.ipAddress}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>
              Page {data?.page} of {data?.totalPages} ({data?.total} entries)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (data?.totalPages ?? 1) || loading}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1.5"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
