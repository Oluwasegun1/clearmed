"use client";

/**
 * Admin User Management page.
 * Lists all users with role, status, last login, and account lock info.
 * Allows the SYSTEM_ADMIN to:
 *   - Search by name / email
 *   - Filter by role
 *   - Activate or deactivate accounts
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SearchFilterBar, DataTable, Column } from "@/components/shared";
import {
  Users,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  UserCheck,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  mfaEnabled: boolean;
}

const ROLE_OPTIONS = [
  { label: "All Roles", value: "" },
  { label: "Patient", value: "PATIENT" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Hospital Admin", value: "HOSPITAL_ADMIN" },
  { label: "Pharmacy", value: "PHARMACY" },
  { label: "Lab", value: "LAB" },
  { label: "HMO Staff", value: "HMO_STAFF" },
  { label: "HMO Admin", value: "HMO_ADMIN" },
  { label: "System Admin", value: "SYSTEM_ADMIN" },
];

const ROLE_COLORS: Record<string, string> = {
  PATIENT: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  DOCTOR: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  HOSPITAL_ADMIN: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  PHARMACY: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  LAB: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  HMO_STAFF: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  HMO_ADMIN: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  SYSTEM_ADMIN: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isLocked(user: UserRecord) {
  return user.lockedUntil && new Date(user.lockedUntil) > new Date();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserRecord | null>(null);

  const LIMIT = 50;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      const res = await fetch(`/api/admin/users?${qs}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const toggleActive = async (user: UserRecord) => {
    setToggling(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update user");
      }
      toast.success(
        `${user.firstName} ${user.lastName}'s account ${!user.isActive ? "activated" : "deactivated"}`
      );
      setConfirmUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setToggling(null);
    }
  };

  const columns: Column<UserRecord>[] = [
    {
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
            {u.firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                {u.firstName} {u.lastName}
              </span>
              {isLocked(u) && (
                <span title="Account locked">
                  <Lock className="h-3.5 w-3.5 text-rose-500" />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (u) => (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${ROLE_COLORS[u.role] ?? ""}`}
        >
          {formatRole(u.role)}
        </Badge>
      ),
    },
    {
      header: "Status",
      cell: (u) => (
        <div className="flex items-center gap-1.5">
          {u.isActive ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <XCircle className="h-3.5 w-3.5" /> Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      header: "MFA",
      cell: (u) => (
        u.mfaEnabled ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Enabled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
            <ShieldAlert className="h-3.5 w-3.5" /> Disabled
          </span>
        )
      ),
    },
    {
      header: "Last Login",
      cell: (u) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {u.lastLogin
            ? new Date(u.lastLogin).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Never"}
        </span>
      ),
    },
    {
      header: "Joined",
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {new Date(u.createdAt).toLocaleDateString("en-GB", {
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
      cell: (u) => (
        <Button
          variant={u.isActive ? "outline" : "secondary"}
          size="sm"
          className={`gap-1.5 text-xs h-8 ${
            u.isActive
              ? "hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30"
              : "hover:bg-emerald-500/10 hover:text-emerald-600"
          }`}
          onClick={() => setConfirmUser(u)}
          disabled={toggling === u.id}
        >
          {toggling === u.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : u.isActive ? (
            <>
              <XCircle className="h-3.5 w-3.5" /> Deactivate
            </>
          ) : (
            <>
              <UserCheck className="h-3.5 w-3.5" /> Activate
            </>
          )}
        </Button>
      ),
    },
  ];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-background overflow-auto">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${total} total user accounts`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="relative p-6 max-w-7xl mx-auto space-y-6">
        {/* Role summary chips */}
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.filter((r) => r.value).map((r) => {
            const count = users.filter((u) => u.role === r.value).length;
            return (
              <button
                key={r.value}
                onClick={() => setRoleFilter(roleFilter === r.value ? "" : r.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  roleFilter === r.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : `border-border ${ROLE_COLORS[r.value] ?? "bg-muted text-muted-foreground"}`
                }`}
              >
                {r.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or email..."
          statusFilter={roleFilter}
          onStatusFilterChange={setRoleFilter}
          statusOptions={ROLE_OPTIONS}
          onResetFilters={() => {
            setSearch("");
            setRoleFilter("");
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
          data={users}
          isLoading={loading}
          emptyTitle="No users found"
          emptyDescription={
            search || roleFilter
              ? "No users match your current filters."
              : "No user accounts have been registered yet."
          }
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm toggle dialog */}
      {confirmUser && (
        <Dialog open onOpenChange={(open) => !open && setConfirmUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {confirmUser.isActive ? "Deactivate Account" : "Activate Account"}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to{" "}
                {confirmUser.isActive ? "deactivate" : "activate"} the account for{" "}
                <strong>
                  {confirmUser.firstName} {confirmUser.lastName}
                </strong>{" "}
                ({confirmUser.email})?
                {confirmUser.isActive && (
                  <span className="block mt-2 text-rose-600 dark:text-rose-400 text-sm">
                    This will prevent the user from logging in immediately.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setConfirmUser(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmUser.isActive ? "destructive" : "default"}
                disabled={toggling === confirmUser.id}
                onClick={() => toggleActive(confirmUser)}
                id="btn-confirm-toggle-user"
              >
                {toggling === confirmUser.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {confirmUser.isActive ? "Yes, Deactivate" : "Yes, Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
