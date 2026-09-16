"use client";

/**
 * Admin Audit Log Viewer.
 * Browseable, searchable, filterable paginated view of all system AuditLog records.
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
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
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
  { label: "Account Locked", value: "ACCOUNT_LOCKED" },
  { label: "MFA Verified", value: "MFA_VERIFIED" },
  { label: "MFA Failed", value: "MFA_FAILED" },
  { label: "Auth Request", value: "AUTH_REQUEST" },
  { label: "Auth Review", value: "AUTH_REVIEW" },
  { label: "Service Delivery", value: "SERVICE_DELIVERY" },
  { label: "Create", value: "CREATE" },
  { label: "Read", value: "READ" },
  { label: "Update", value: "UPDATE" },
  { label: "Delete", value: "DELETE" },
];

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  LOGOUT: "bg-muted text-muted-foreground border-border",
  LOGIN_FAILED: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  ACCOUNT_LOCKED: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  MFA_VERIFIED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  MFA_FAILED: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  AUTH_REQUEST: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  AUTH_REVIEW: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  SERVICE_DELIVERY: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  CREATE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  READ: "bg-muted text-muted-foreground border-border",
  UPDATE: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  DELETE: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

function ActionIcon({ action }: { action: string }) {
  const cls = "h-4 w-4";
  switch (action) {
    case "LOGIN": return <LogIn className={cls} />;
    case "LOGOUT": return <LogOut className={cls} />;
    case "LOGIN_FAILED": return <AlertCircle className={cls} />;
    case "ACCOUNT_LOCKED": return <Lock className={cls} />;
    case "MFA_VERIFIED": return <Shield className={cls} />;
    case "MFA_FAILED": return <AlertCircle className={cls} />;
    case "AUTH_REQUEST": return <ClipboardList className={cls} />;
    case "AUTH_REVIEW": return <ClipboardCheck className={cls} />;
    case "SERVICE_DELIVERY": return <UserCheck className={cls} />;
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
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading..."
              : `${data?.total ?? 0} total system events recorded`}
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
                <Filter className="h-3.5 w-3.5" /> Filters
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
                            <span className="font-mono text-foreground">
                              {entry.entityType}
                            </span>
                          </span>
                          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground truncate max-w-[140px]">
                            {entry.entityId}
                          </code>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {new Date(entry.timestamp).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {entry.details && (
                        <p className="text-sm text-foreground mt-1.5">
                          {entry.details}
                        </p>
                      )}

                      {/* Actor */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[10px] shrink-0">
                          {entry.user.firstName.charAt(0)}
                        </div>
                        <span>
                          <span className="font-medium text-foreground">
                            {entry.user.firstName} {entry.user.lastName}
                          </span>{" "}
                          · {entry.user.email} ·{" "}
                          <Badge variant="secondary" className="text-[10px] py-0">
                            {formatAction(entry.user.role)}
                          </Badge>
                        </span>
                        {entry.ipAddress && (
                          <span className="hidden sm:inline text-muted-foreground/60">
                            · IP: {entry.ipAddress}
                          </span>
                        )}
                      </div>
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
