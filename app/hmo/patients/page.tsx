"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  SearchFilterBar,
  DataTable,
  StatusBadge,
  Column,
  PageShell,
  PageHeader,
  MetricCard,
} from "@/components/shared";
import {
  UserRound,
  Users,
  Shield,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Calendar,
  Layers,
  Edit2,
  Check,
  Building2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

interface EnrolledPatient {
  id: string;
  membershipNumber: string;
  dateOfBirth: string;
  gender: string;
  address?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
    isActive: boolean;
    createdAt: string;
  };
  coveragePlan: {
    id: string;
    name: string;
    annualLimit?: number | null;
    coveragePercent?: number | null;
  };
  _count?: {
    authRequests: number;
    dependents: number;
  };
}

interface CoveragePlanOption {
  id: string;
  name: string;
  annualLimit?: number | null;
  coveragePercent?: number | null;
}

export default function HMOPatientsPage() {
  const [patients, setPatients] = useState<EnrolledPatient[]>([]);
  const [plans, setPlans] = useState<CoveragePlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Edit / Accept modal state
  const [selectedPatient, setSelectedPatient] = useState<EnrolledPatient | null>(null);
  const [editMembershipNumber, setEditMembershipNumber] = useState("");
  const [editPlanId, setEditPlanId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchPatients = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [patientsRes, plansRes] = await Promise.all([
        fetch("/api/hmo/patients"),
        fetch("/api/hmo/coverage-plans"),
      ]);

      if (!patientsRes.ok) throw new Error("Failed to load enrolled members");
      const patientsData = await patientsRes.json();
      setPatients(Array.isArray(patientsData) ? patientsData : []);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(Array.isArray(plansData) ? plansData : []);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading patients");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients(false);
    const interval = setInterval(() => fetchPatients(true), 25_000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  const openEditModal = (p: EnrolledPatient) => {
    setSelectedPatient(p);
    setEditMembershipNumber(p.membershipNumber);
    setEditPlanId(p.coveragePlan?.id || "");
  };

  const handleSavePatient = async () => {
    if (!selectedPatient) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/hmo/patients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          membershipNumber: editMembershipNumber.trim(),
          coveragePlanId: editPlanId,
          action: "VERIFY_AND_ACCEPT",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update member");
      }

      toast.success("Member details and policy enrollment verified!");
      setSelectedPatient(null);
      fetchPatients(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.user.firstName.toLowerCase().includes(q) ||
      p.user.lastName.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q) ||
      (p.user.phoneNumber && p.user.phoneNumber.toLowerCase().includes(q)) ||
      p.membershipNumber.toLowerCase().includes(q) ||
      p.coveragePlan.name.toLowerCase().includes(q)
    );
  });

  const columns: Column<EnrolledPatient>[] = [
    {
      header: "Patient Member",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
            {p.user.firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">
              {p.user.firstName} {p.user.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{p.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "HMO Member ID",
      cell: (p) => (
        <div className="space-y-0.5">
          <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            {p.membershipNumber}
          </code>
          <p className="text-[10px] text-muted-foreground">Self-registered ID</p>
        </div>
      ),
    },
    {
      header: "Coverage Plan",
      cell: (p) => (
        <div>
          <Badge variant="outline" className="text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25">
            {p.coveragePlan.name}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Limit: ₦{(p.coveragePlan.annualLimit || 500000).toLocaleString()} • {p.coveragePlan.coveragePercent || 85}%
          </p>
        </div>
      ),
    },
    {
      header: "Contact & Gender",
      cell: (p) => (
        <div className="text-xs space-y-0.5">
          <p className="text-foreground">{p.user.phoneNumber || "No phone"}</p>
          <p className="text-muted-foreground">{p.gender || "Not specified"}</p>
        </div>
      ),
    },
    {
      header: "Authorizations",
      cell: (p) => (
        <div className="text-xs">
          <span className="font-semibold text-foreground">
            {p._count?.authRequests || 0}
          </span>{" "}
          <span className="text-muted-foreground">request(s)</span>
        </div>
      ),
    },
    {
      header: "Registration Date",
      cell: (p) => (
        <span className="text-xs text-muted-foreground">
          {new Date(p.user.createdAt).toLocaleDateString("en-GB", {
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
      cell: (p) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditModal(p)}
          className="gap-1.5 text-xs h-7 px-2.5"
        >
          <Edit2 className="h-3 w-3 text-primary" /> Manage Member
        </Button>
      ),
    },
  ];

  return (
    <HMOSidebarWrapper currentPath="/hmo/patients">
      <PageShell>
        <PageHeader
          title="Patient & Member Management"
          subtitle={`Review self-registered members, verify policy IDs, and manage coverage plans${
            lastUpdated ? ` • Updated ${lastUpdated.toLocaleTimeString()}` : ""
          }`}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPatients(false)}
              disabled={loading}
              className="gap-2 shrink-0 h-9"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Members
            </Button>
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

          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Total Enrolled Members"
              value={patients.length.toLocaleString()}
              badge="Enrolled"
              icon={Users}
              iconColor="primary"
            />
            <MetricCard
              label="Active Coverage Plans"
              value={plans.length.toLocaleString()}
              badge="Plans"
              icon={Layers}
              iconColor="green"
            />
            <MetricCard
              label="Total Claims / Pre-Auths"
              value={patients.reduce((sum, p) => sum + (p._count?.authRequests || 0), 0).toLocaleString()}
              badge="Volume"
              icon={Shield}
              iconColor="blue"
            />
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1">
              <SearchFilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by member name, email, phone, or HMO Member ID..."
                onResetFilters={() => setSearch("")}
              />
            </div>
          </div>

          {/* Members Data Table */}
          <DataTable
            columns={columns}
            data={filteredPatients}
            isLoading={loading}
            emptyTitle="No enrolled members found"
            emptyDescription={
              search
                ? "No patients match your search query."
                : "Patients who register with your HMO will appear here automatically."
            }
          />
        </div>

        {/* Member Edit / Verification Dialog */}
        <Dialog open={Boolean(selectedPatient)} onOpenChange={(open) => !open && setSelectedPatient(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" /> Verify & Manage Member
              </DialogTitle>
              <DialogDescription>
                Review member information, verify policy ID, or assign a different coverage plan.
              </DialogDescription>
            </DialogHeader>

            {selectedPatient && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-semibold text-foreground">
                      {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{selectedPatient.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-foreground">{selectedPatient.user.phoneNumber || "None"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editMemberId" className="text-xs font-medium">
                    HMO Member ID / Policy Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="editMemberId"
                    value={editMembershipNumber}
                    onChange={(e) => setEditMembershipNumber(e.target.value)}
                    placeholder="e.g. HMO-09823471"
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Confirm or update the patient's official policy number.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editPlan" className="text-xs font-medium">
                    Assigned Coverage Plan
                  </Label>
                  <select
                    id="editPlan"
                    value={editPlanId}
                    onChange={(e) => setEditPlanId(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {plans.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} {pl.annualLimit ? `(₦${pl.annualLimit.toLocaleString()})` : ""} {pl.coveragePercent ? `— ${pl.coveragePercent}%` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPatient(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePatient}
                disabled={isSaving || !editMembershipNumber.trim()}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                {isSaving ? "Saving..." : "Accept & Update Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
    </HMOSidebarWrapper>
  );
}
