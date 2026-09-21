"use client";

/**
 * Admin Hospital Management — List Page.
 * Displays all registered hospitals with search, filtering, status badges, quick activate/deactivate, and links to details.
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
  Building2,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Eye,
  MapPin,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";

interface HospitalRecord {
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
    departments: number;
  };
}

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function AdminHospitalsPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmHospital, setConfirmHospital] = useState<HospitalRecord | null>(null);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/hospitals");
      if (!res.ok) throw new Error("Failed to load hospitals");
      const data: HospitalRecord[] = await res.json();
      setHospitals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const filtered = hospitals.filter((h) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.licenseNumber.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.state.toLowerCase().includes(q);
    const matchStatus =
      !statusFilter || (statusFilter === "active" ? h.isActive : !h.isActive);
    return matchSearch && matchStatus;
  });

  const totalActive = hospitals.filter((h) => h.isActive).length;
  const totalInactive = hospitals.length - totalActive;
  const totalStaff = hospitals.reduce((acc, h) => acc + (h._count?.staff || 0), 0);

  const toggleActive = async (hospital: HospitalRecord) => {
    setToggling(hospital.id);
    try {
      const res = await fetch(`/api/admin/hospitals/${hospital.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !hospital.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update hospital");
      toast.success(
        `"${hospital.name}" ${!hospital.isActive ? "activated" : "deactivated"}`
      );
      setConfirmHospital(null);
      fetchHospitals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setToggling(null);
    }
  };

  const columns: Column<HospitalRecord>[] = [
    {
      header: "Hospital",
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
        <span className="text-sm text-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {h.city}, {h.state}
        </span>
      ),
    },
    {
      header: "Staff",
      cell: (h) => (
        <span className="inline-flex items-center gap-1 text-sm font-medium">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {h._count.staff}
        </span>
      ),
    },
    {
      header: "Departments",
      cell: (h) => (
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Building className="h-3.5 w-3.5 text-muted-foreground" />
          {h._count.departments}
        </span>
      ),
    },
    {
      header: "Contact",
      cell: (h) => (
        <div className="text-xs space-y-0.5">
          <p className="text-foreground">{h.email}</p>
          <p className="text-muted-foreground">{h.phoneNumber}</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (h) =>
        h.isActive ? (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs"
          >
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
            onClick={() => router.push(`/admin/hospitals/${h.id}`)}
          >
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={toggling === h.id}
            onClick={() => setConfirmHospital(h)}
            className={`gap-1.5 text-xs h-8 ${
              h.isActive
                ? "hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30"
                : "hover:bg-emerald-500/10 hover:text-emerald-600"
            }`}
          >
            {toggling === h.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : h.isActive ? (
              <>
                <XCircle className="h-3.5 w-3.5" /> Deactivate
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Activate
              </>
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
            <Building2 className="h-6 w-6 text-primary" /> Hospital Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${hospitals.length} registered hospitals`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHospitals}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => router.push("/admin/hospitals/new")}
          >
            <PlusCircle className="h-4 w-4" /> Register Hospital
          </Button>
        </div>
      </div>

      <div className="relative p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats strip */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Hospitals",
                value: hospitals.length,
                accent: "bg-primary/10 text-primary",
              },
              {
                label: "Active Hospitals",
                value: totalActive,
                accent: "bg-emerald-500/10 text-emerald-600",
              },
              {
                label: "Inactive Hospitals",
                value: totalInactive,
                accent: "bg-rose-500/10 text-rose-600",
              },
              {
                label: "Total Staff",
                value: totalStaff,
                accent: "bg-blue-500/10 text-blue-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="data-visualization rounded-xl border border-border p-4 flex items-center gap-3"
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold ${s.accent}`}
                >
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
          searchPlaceholder="Search by name, licence, city, or state..."
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusOptions={STATUS_OPTIONS}
          onResetFilters={() => {
            setSearch("");
            setStatusFilter("");
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
          emptyTitle="No hospitals found"
          emptyDescription={
            search || statusFilter
              ? "No hospitals match your filters."
              : "No hospitals have been registered yet."
          }
        />
      </div>

      {/* Confirm toggle dialog */}
      {confirmHospital && (
        <Dialog open onOpenChange={(open) => !open && setConfirmHospital(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {confirmHospital.isActive ? "Deactivate Hospital" : "Activate Hospital"}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to{" "}
                {confirmHospital.isActive ? "deactivate" : "activate"}{" "}
                <strong>{confirmHospital.name}</strong>?
                {confirmHospital.isActive && (
                  <span className="block mt-2 text-rose-600 text-sm">
                    Deactivating a hospital will restrict access for all its staff and prevent
                    new authorization requests from being submitted or fulfilled.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmHospital(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmHospital.isActive ? "destructive" : "default"}
                disabled={toggling === confirmHospital.id}
                onClick={() => toggleActive(confirmHospital)}
                id="btn-confirm-toggle-hospital"
              >
                {toggling === confirmHospital.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {confirmHospital.isActive ? "Yes, Deactivate" : "Yes, Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
