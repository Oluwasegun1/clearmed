"use client";

/**
 * Admin Hospital Detail page — /admin/hospitals/[id]
 * Features:
 *   1. Overview Tab — Editable hospital details, status card, quick stats, activate/deactivate
 *   2. Staff Tab — View all staff, add hospital administrators / doctors / pharmacy / lab staff, toggle active status
 *   3. Contracts & Departments Tab — Connected HMOs and hospital departments overview
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Save,
  PlusCircle,
  Users,
  MapPin,
  Phone,
  Mail,
  Hash,
  Calendar,
  Building,
  Activity,
  FileCheck,
  ShieldCheck,
  Stethoscope,
  Pill,
  FlaskConical,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Types ─────────────────────────────────────────────────── */

interface StaffMember {
  id: string;
  staffId: string;
  position: string;
  specialization: string | null;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
  };
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  _count: { staff: number; services: number };
}

interface HMOContract {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hmo: {
    id: string;
    name: string;
    logoUrl: string | null;
    licenseNumber: string;
  };
}

interface HospitalDetail {
  id: string;
  name: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staff: StaffMember[];
  departments: Department[];
  hmoContracts: HMOContract[];
  _count: {
    staff: number;
    departments: number;
    authRequests: number;
    hmoContracts: number;
  };
}

/* ── Helpers ─────────────────────────────────────────────── */

function fmtDate(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRoleBadge(role: string) {
  switch (role) {
    case "HOSPITAL_ADMIN":
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
          <ShieldCheck className="h-3 w-3 mr-1" /> Hospital Admin
        </Badge>
      );
    case "DOCTOR":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
          <Stethoscope className="h-3 w-3 mr-1" /> Doctor
        </Badge>
      );
    case "PHARMACY":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
          <Pill className="h-3 w-3 mr-1" /> Pharmacy
        </Badge>
      );
    case "LAB":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
          <FlaskConical className="h-3 w-3 mr-1" /> Laboratory
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {role}
        </Badge>
      );
  }
}

/* ── Overview / Edit Tab ────────────────────────────────── */

function OverviewTab({
  hospital,
  onUpdated,
}: {
  hospital: HospitalDetail;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    name: hospital.name,
    address: hospital.address,
    city: hospital.city,
    state: hospital.state,
    phoneNumber: hospital.phoneNumber,
    email: hospital.email,
  });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${hospital.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save hospital");
      toast.success("Hospital details updated");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    setToggling(true);
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
      setConfirmToggle(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card className="data-visualization">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-foreground">Facility Status</CardTitle>
              <CardDescription>
                Control active access and authorization processing for this facility
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {hospital.isActive ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-rose-500/10 text-rose-600 border-rose-500/20"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Inactive
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmToggle(true)}
                disabled={toggling}
                className={
                  hospital.isActive
                    ? "hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 gap-1.5"
                    : "hover:bg-emerald-500/10 hover:text-emerald-600 gap-1.5"
                }
              >
                {toggling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hospital.isActive ? (
                  <>
                    <XCircle className="h-4 w-4" /> Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Staff Members</p>
              <p className="font-semibold text-foreground mt-0.5">{hospital._count.staff}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Departments</p>
              <p className="font-semibold text-foreground mt-0.5">{hospital._count.departments}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">HMO Contracts</p>
              <p className="font-semibold text-foreground mt-0.5">{hospital._count.hmoContracts}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Authorizations</p>
              <p className="font-semibold text-foreground mt-0.5">{hospital._count.authRequests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="data-visualization">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Hospital Details</CardTitle>
          <CardDescription>
            Update facility contact info and location. Licence number is permanently locked.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="hosp-name" className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Hospital Name
            </Label>
            <Input id="hosp-name" value={form.name} onChange={set("name")} />
          </div>

          {/* Licence (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-3.5 w-3.5" /> Licence Number (read-only)
            </Label>
            <Input
              value={hospital.licenseNumber}
              readOnly
              className="opacity-60 cursor-not-allowed font-mono"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="hosp-address" className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Street Address
            </Label>
            <Input id="hosp-address" value={form.address} onChange={set("address")} />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hosp-city">City</Label>
              <Input id="hosp-city" value={form.city} onChange={set("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosp-state">State</Label>
              <Input id="hosp-state" value={form.state} onChange={set("state")} />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="hosp-phone" className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
            </Label>
            <Input
              id="hosp-phone"
              type="tel"
              value={form.phoneNumber}
              onChange={set("phoneNumber")}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="hosp-email" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Official Email
            </Label>
            <Input
              id="hosp-email"
              type="email"
              value={form.email}
              onChange={set("email")}
            />
          </div>

          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Confirm toggle */}
      {confirmToggle && (
        <Dialog open onOpenChange={(open) => !open && setConfirmToggle(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {hospital.isActive ? "Deactivate Hospital" : "Activate Hospital"}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to{" "}
                {hospital.isActive ? "deactivate" : "activate"}{" "}
                <strong>{hospital.name}</strong>?
                {hospital.isActive && (
                  <span className="block mt-2 text-rose-600 text-sm">
                    This will restrict access for all hospital staff and block authorization
                    requests from this facility.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmToggle(false)}>
                Cancel
              </Button>
              <Button
                variant={hospital.isActive ? "destructive" : "default"}
                disabled={toggling}
                onClick={toggleActive}
              >
                {toggling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {hospital.isActive ? "Yes, Deactivate" : "Yes, Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ── Staff Tab ──────────────────────────────────────────── */

function StaffTab({
  hospitalId,
  staff,
  onRefresh,
}: {
  hospitalId: string;
  staff: StaffMember[];
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "HOSPITAL_ADMIN",
    position: "Hospital Administrator",
    specialization: "",
    password: "",
    staffId: "",
  });

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: "HOSPITAL_ADMIN",
      position: "Hospital Administrator",
      specialization: "",
      password: "",
      staffId: "",
    });
  };

  const handleRoleChange = (role: string) => {
    let defaultPosition = "Staff Member";
    if (role === "HOSPITAL_ADMIN") defaultPosition = "Hospital Administrator";
    if (role === "DOCTOR") defaultPosition = "Medical Doctor";
    if (role === "PHARMACY") defaultPosition = "Pharmacist";
    if (role === "LAB") defaultPosition = "Lab Technician";

    setForm((prev) => ({
      ...prev,
      role,
      position: defaultPosition,
    }));
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error("First name, last name, and email are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${hospitalId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add staff member");

      toast.success(
        `Staff member "${data.user.firstName} ${data.user.lastName}" added successfully`
      );
      resetForm();
      setShowAdd(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error adding staff");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStaffActive = async (member: StaffMember) => {
    setToggling(member.id);
    try {
      const res = await fetch(`/api/admin/hospitals/${hospitalId}/staff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffRecordId: member.id,
          isActive: !member.user.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update staff status");

      toast.success(
        `Staff member "${member.user.firstName}" ${
          !member.user.isActive ? "activated" : "deactivated"
        }`
      );
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Hospital Staff & Administrators</h3>
          <p className="text-xs text-muted-foreground">
            {staff.length} staff member{staff.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
          <PlusCircle className="h-4 w-4" /> Add Administrator / Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl p-8">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">No staff members yet</p>
          <p className="text-sm mt-1">
            Add hospital administrators, doctors, pharmacists, or lab technicians using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map((s) => (
            <Card key={s.id} className="data-visualization">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {s.user.firstName.charAt(0).toUpperCase()}
                      {s.user.lastName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">
                          {s.user.firstName} {s.user.lastName}
                        </p>
                        {getRoleBadge(s.user.role)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        ID: {s.staffId}
                      </p>
                      <p className="text-xs text-foreground font-medium mt-1">
                        {s.position}
                        {s.specialization ? ` • ${s.specialization}` : ""}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {s.user.email}
                        </p>
                        {s.user.phoneNumber && (
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {s.user.phoneNumber}
                          </p>
                        )}
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Joined {fmtDate(s.user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {s.user.isActive ? (
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
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={toggling === s.id}
                      onClick={() => toggleStaffActive(s)}
                      className={`gap-1 text-xs h-7 px-2 ${
                        s.user.isActive
                          ? "hover:bg-rose-500/10 hover:text-rose-600"
                          : "hover:bg-emerald-500/10 hover:text-emerald-600"
                      }`}
                    >
                      {toggling === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : s.user.isActive ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Staff Dialog */}
      {showAdd && (
        <Dialog open onOpenChange={(open) => !open && setShowAdd(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Hospital Administrator / Staff</DialogTitle>
              <DialogDescription>
                Create a new user account linked to this hospital with appropriate system permissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-fn">First name *</Label>
                  <Input
                    id="staff-fn"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    placeholder="e.g. Adebayo"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-ln">Last name *</Label>
                  <Input
                    id="staff-ln"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    placeholder="e.g. Ogunleye"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-email">Email *</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="staff@hospital.ng"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-phone">Phone number</Label>
                  <Input
                    id="staff-phone"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                    }
                    placeholder="+234..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-role">Role *</Label>
                  <Select value={form.role} onValueChange={handleRoleChange}>
                    <SelectTrigger id="staff-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOSPITAL_ADMIN">Hospital Administrator</SelectItem>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                      <SelectItem value="LAB">Laboratory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-position">Position Title</Label>
                  <Input
                    id="staff-position"
                    value={form.position}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, position: e.target.value }))
                    }
                    placeholder="e.g. Medical Director"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staff-specialization">Specialization (Optional)</Label>
                  <Input
                    id="staff-specialization"
                    value={form.specialization}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, specialization: e.target.value }))
                    }
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="staff-id-field">Staff ID (Optional)</Label>
                  <Input
                    id="staff-id-field"
                    value={form.staffId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, staffId: e.target.value }))
                    }
                    placeholder="Auto-generated if blank"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="staff-pass">Initial Password (Optional)</Label>
                <Input
                  id="staff-pass"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Defaults to ClearMed@2026! if left blank"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  Add Staff Member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ── Contracts & Departments Tab ────────────────────────── */

function ContractsTab({ hospital }: { hospital: HospitalDetail }) {
  return (
    <div className="space-y-6">
      {/* Connected HMOs */}
      <Card className="data-visualization">
        <CardHeader>
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Contracted HMOs
          </CardTitle>
          <CardDescription>
            HMOs that have active network agreements with this hospital
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hospital.hmoContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No active HMO contracts currently recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {hospital.hmoContracts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {c.hmo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.hmo.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.hmo.licenseNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {c.isActive ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                        Active Contract
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Valid: {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Departments */}
      <Card className="data-visualization">
        <CardHeader>
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" /> Hospital Departments
          </CardTitle>
          <CardDescription>
            Clinical and administrative units configured for this hospital
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hospital.departments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No specific departments registered.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hospital.departments.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-lg border border-border bg-card/50 space-y-1"
                >
                  <p className="font-semibold text-sm text-foreground">{d.name}</p>
                  {d.description && (
                    <p className="text-xs text-muted-foreground">{d.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                    <span>{d._count.staff} staff</span>
                    <span>{d._count.services} services</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export default function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [hospital, setHospital] = useState<HospitalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHospital = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/hospitals/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Hospital not found");
        throw new Error("Failed to load hospital details");
      }
      const data = await res.json();
      setHospital(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  return (
    <div className="min-h-screen bg-background overflow-auto">
      <div className="fixed inset-0 professional-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/hospitals">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Hospitals
              </Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
                {hospital ? hospital.name.charAt(0).toUpperCase() : <Building2 className="h-5 w-5" />}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  {hospital ? hospital.name : "Loading hospital..."}
                  {hospital &&
                    (hospital.isActive ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs"
                      >
                        Inactive
                      </Badge>
                    ))}
                </h1>
                {hospital && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Licence: {hospital.licenseNumber} • {hospital.city}, {hospital.state}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-6 max-w-6xl mx-auto space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hospital && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card/50 border border-border">
              <TabsTrigger value="overview" className="gap-2">
                <Building2 className="h-4 w-4" /> Overview & Details
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-2">
                <Users className="h-4 w-4" /> Staff & Admins ({hospital.staff.length})
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-2">
                <FileCheck className="h-4 w-4" /> Contracts & Units
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab hospital={hospital} onUpdated={fetchHospital} />
            </TabsContent>

            <TabsContent value="staff">
              <StaffTab
                hospitalId={hospital.id}
                staff={hospital.staff}
                onRefresh={fetchHospital}
              />
            </TabsContent>

            <TabsContent value="contracts">
              <ContractsTab hospital={hospital} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
