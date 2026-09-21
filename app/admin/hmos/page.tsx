"use client";

/**
 * Admin HMO Management — list page.
 * Shows all HMOs with search, quick activate/deactivate, and a link to each HMO's detail page.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Activity,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Users,
  FileText,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

interface HMORecord {
  id: string;
  name: string;
  licenseNumber: string;
  city: string;
  state: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    staff: number;
    coveragePlans: number;
    patients: number;
  };
}

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function AdminHmosPage() {
  const router = useRouter();
  const [hmos, setHmos] = useState<HMORecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmHmo, setConfirmHmo] = useState<HMORecord | null>(null);

  const fetchHmos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/hmos");
      if (!res.ok) throw new Error("Failed to load HMOs");
      const data: HMORecord[] = await res.json();
      setHmos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHmos(); }, [fetchHmos]);

  const filtered = hmos.filter((h) => {
    const q = search.toLowerCase();
    const matchSearch = !q || h.name.toLowerCase().includes(q) || h.licenseNumber.toLowerCase().includes(q) || h.city.toLowerCase().includes(q);
    const matchStatus = !statusFilter || (statusFilter === "active" ? h.isActive : !h.isActive);
    return matchSearch && matchStatus;
  });

  const totalActive = hmos.filter((h) => h.isActive).length;
  const totalInactive = hmos.length - totalActive;

  const toggleActive = async (hmo: HMORecord) => {
    setToggling(hmo.id);
    try {
      const res = await fetch(`/api/admin/hmos/${hmo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !hmo.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update HMO");
      toast.success(`"${hmo.name}" ${!hmo.isActive ? "activated" : "deactivated"}`);
      setConfirmHmo(null);
      fetchHmos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setToggling(null);
    }
  };

  const columns: Column<HMORecord>[] = [
    {
      header: "HMO",
      cell: (h) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {h.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{h.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{h.licenseNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      cell: (h) => (
        <span className="text-sm text-foreground">{h.city}, {h.state}</span>
      ),
    },
    {
      header: "Staff",
      cell: (h) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {h._count.staff}
        </span>
      ),
    },
    {
      header: "Plans",
      cell: (h) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          {h._count.coveragePlans}
        </span>
      ),
    },
    {
      header: "Patients",
      cell: (h) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          {h._count.patients}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (h) => h.isActive ? (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs">
          <XCircle className="h-3 w-3 mr-1" /> Inactive
        </Badge>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (h) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => router.push(`/admin/hmos/${h.id}`)}
          >
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={toggling === h.id}
            onClick={() => setConfirmHmo(h)}
            className={`gap-1.5 text-xs h-8 ${h.isActive
              ? "hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30"
              : "hover:bg-emerald-500/10 hover:text-emerald-600"}`}
          >
            {toggling === h.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : h.isActive ? (
              <><XCircle className="h-3.5 w-3.5" /> Deactivate</>
            ) : (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Activate</>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-auto">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> HMO Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${hmos.length} registered HMOs`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchHmos} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => router.push("/admin/hmos/new")}>
            <PlusCircle className="h-4 w-4" /> Register HMO
          </Button>
        </div>
      </div>

      <div className="relative p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats strip */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total HMOs", value: hmos.length, accent: "bg-primary/10 text-primary" },
              { label: "Active", value: totalActive, accent: "bg-emerald-500/10 text-emerald-600" },
              { label: "Inactive", value: totalInactive, accent: "bg-rose-500/10 text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="data-visualization rounded-xl border border-border p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold ${s.accent}`}>
                  {s.value}
                </div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, licence, or city..."
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusOptions={STATUS_OPTIONS}
          onResetFilters={() => { setSearch(""); setStatusFilter(""); }}
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
          emptyTitle="No HMOs found"
          emptyDescription={search || statusFilter ? "No HMOs match your filters." : "No HMOs have been registered yet."}
        />
      </div>

      {/* Confirm toggle dialog */}
      {confirmHmo && (
        <Dialog open onOpenChange={(open) => !open && setConfirmHmo(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{confirmHmo.isActive ? "Deactivate HMO" : "Activate HMO"}</DialogTitle>
              <DialogDescription>
                Are you sure you want to {confirmHmo.isActive ? "deactivate" : "activate"}{" "}
                <strong>{confirmHmo.name}</strong>?
                {confirmHmo.isActive && (
                  <span className="block mt-2 text-rose-600 text-sm">
                    Deactivating an HMO will restrict access for all its staff and prevent new
                    authorization requests from being processed.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmHmo(null)}>Cancel</Button>
              <Button
                variant={confirmHmo.isActive ? "destructive" : "default"}
                disabled={toggling === confirmHmo.id}
                onClick={() => toggleActive(confirmHmo)}
                id="btn-confirm-toggle-hmo"
              >
                {toggling === confirmHmo.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {confirmHmo.isActive ? "Yes, Deactivate" : "Yes, Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
