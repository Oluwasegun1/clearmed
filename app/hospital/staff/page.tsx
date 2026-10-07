"use client";

/**
 * Hospital Staff Management (ClearMed v2.0 - Section 20).
 *
 * Rules:
 * - Hospital administrators manage hospital staff.
 * - Staff information: Name, Email, Role, Status, Date created.
 * - Possible hospital roles: DOCTOR, HOSPITAL_ADMIN, PHARMACY, LAB.
 * - Hospital administrators must not be able to manage system administrators or users belonging to other organizations.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/shared";
import {
  Users,
  UserPlus,
  Stethoscope,
  ShieldCheck,
  Pill,
  Microscope,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Lock,
  UserCheck,
  UserX,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

interface Department {
  id: string;
  name: string;
}

export type HospitalRoleType = "DOCTOR" | "HOSPITAL_ADMIN" | "PHARMACY" | "LAB";

interface HospitalStaffMember {
  id: string; // HospitalStaff id
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  role: HospitalRoleType;
  status: "ACTIVE" | "INACTIVE";
  isActive: boolean;
  dateCreated: string;
  createdAt: string;
  lastLogin?: string | null;
  staffId: string;
  position: string;
  specialization?: string | null;
  department?: { id: string; name: string } | null;
  hospital?: { id: string; name: string; city: string; state: string } | null;
}

const ROLE_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "HOSPITAL_ADMIN", label: "Hospital Admin" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "LAB", label: "Laboratory" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export default function HospitalStaffPage() {
  const [staff, setStaff] = useState<HospitalStaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Staff Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "DOCTOR" as "DOCTOR" | "HOSPITAL_ADMIN" | "PHARMACY" | "LAB",
    departmentId: "",
    position: "",
    specialization: "",
    password: "",
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Staff Modal State
  const [editTarget, setEditTarget] = useState<HospitalStaffMember | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "DOCTOR" as "DOCTOR" | "HOSPITAL_ADMIN" | "PHARMACY" | "LAB",
    departmentId: "",
    position: "",
    specialization: "",
    isActive: true,
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Deactivate/Activate Confirmation
  const [toggleTarget, setToggleTarget] = useState<HospitalStaffMember | null>(null);
  const [submittingToggle, setSubmittingToggle] = useState(false);

  // Fetch staff and departments
  const fetchStaffData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [staffRes, deptRes] = await Promise.all([
        fetch("/api/hospital/staff"),
        fetch("/api/hospital/departments"),
      ]);

      if (!staffRes.ok) throw new Error("Failed to load hospital staff members");
      const staffData = await staffRes.json();
      setStaff(Array.isArray(staffData) ? staffData : []);

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(Array.isArray(deptData) ? deptData : []);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Could not fetch hospital staff records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Metric counts
  const metrics = useMemo(() => {
    const total = staff.length;
    const doctors = staff.filter((s) => s.role === "DOCTOR").length;
    const admins = staff.filter((s) => s.role === "HOSPITAL_ADMIN").length;
    const pharmacy = staff.filter((s) => s.role === "PHARMACY").length;
    const lab = staff.filter((s) => s.role === "LAB").length;
    const active = staff.filter((s) => s.isActive).length;
    const inactive = total - active;

    return { total, doctors, admins, pharmacy, lab, active, inactive };
  }, [staff]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.staffId.toLowerCase().includes(q) ||
        s.position.toLowerCase().includes(q) ||
        (s.specialization && s.specialization.toLowerCase().includes(q)) ||
        (s.department && s.department.name.toLowerCase().includes(q));

      const matchesRole = roleFilter === "ALL" || s.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? s.isActive : !s.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, search, roleFilter, statusFilter]);

  // Handle Add Staff
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.firstName.trim() || !addForm.lastName.trim() || !addForm.email.trim()) {
      toast.error("Please fill in all required fields (First name, Last name, Email)");
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await fetch("/api/hospital/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff member");
      }

      toast.success(`Staff member ${data.name} created successfully`);
      setIsAddOpen(false);
      setAddForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        role: "DOCTOR",
        departmentId: "",
        position: "",
        specialization: "",
        password: "",
      });
      fetchStaffData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating staff";
      toast.error(msg);
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (member: HospitalStaffMember) => {
    setEditTarget(member);
    setEditForm({
      firstName: member.firstName,
      lastName: member.lastName,
      phoneNumber: member.phoneNumber || "",
      role: member.role,
      departmentId: member.department?.id || "",
      position: member.position,
      specialization: member.specialization || "",
      isActive: member.isActive,
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/hospital/staff/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff record");
      }

      toast.success(`Staff member ${data.name} updated successfully`);
      setEditTarget(null);
      fetchStaffData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating staff";
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Quick Toggle Active/Inactive
  const handleToggleStatus = async () => {
    if (!toggleTarget) return;

    setSubmittingToggle(true);
    try {
      const newStatus = !toggleTarget.isActive;
      const res = await fetch(`/api/hospital/staff/${toggleTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change staff status");
      }

      toast.success(
        `Staff account ${newStatus ? "activated" : "deactivated"} successfully`
      );
      setToggleTarget(null);
      fetchStaffData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error toggling status";
      toast.error(msg);
    } finally {
      setSubmittingToggle(false);
    }
  };

  // Role Badge Helper
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "DOCTOR":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 font-medium">
            <Stethoscope className="w-3.5 h-3.5" />
            Doctor
          </Badge>
        );
      case "HOSPITAL_ADMIN":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hospital Admin
          </Badge>
        );
      case "PHARMACY":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5 font-medium">
            <Pill className="w-3.5 h-3.5" />
            Pharmacy
          </Badge>
        );
      case "LAB":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5 font-medium">
            <Microscope className="w-3.5 h-3.5" />
            Laboratory
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  // Columns definition for DataTable
  const columns: Column<HospitalStaffMember>[] = [
    {
      header: "Staff Member",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
            {row.firstName[0]}
            {row.lastName[0]}
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground flex items-center gap-2">
              {row.name}
              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {row.staffId}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{row.position}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Contact Details",
      accessorKey: "email",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="text-xs flex items-center gap-1.5 text-foreground">
            <Mail className="w-3 h-3 text-muted-foreground" />
            {row.email}
          </div>
          {row.phoneNumber && (
            <div className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
              <Phone className="w-3 h-3 text-muted-foreground" />
              {row.phoneNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Hospital Role",
      accessorKey: "role",
      cell: (row) => renderRoleBadge(row.role),
    },
    {
      header: "Department / Specialization",
      accessorKey: "department",
      cell: (row) => (
        <div className="text-xs">
          <div className="font-medium text-foreground">
            {row.department?.name || "General Facility"}
          </div>
          {row.specialization && (
            <div className="text-[11px] text-muted-foreground">
              {row.specialization}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <Badge
          variant={row.isActive ? "default" : "secondary"}
          className={
            row.isActive
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-muted text-muted-foreground border border-muted"
          }
        >
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Date Created",
      accessorKey: "dateCreated",
      cell: (row) => (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          {new Date(row.dateCreated).toLocaleDateString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-medium"
            onClick={() => openEditModal(row)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2.5 text-xs font-medium ${
              row.isActive
                ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
            onClick={() => setToggleTarget(row)}
          >
            {row.isActive ? (
              <>
                <UserX className="w-3.5 h-3.5 mr-1" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Activate
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <HospitalSidebarWrapper currentPath="/hospital/staff">
      <PageShell>
        <PageHeader
          title="Hospital Staff Management"
          subtitle="Section 20: Manage internal hospital staff, roles, departments, and active statuses"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStaffData(true)}
                disabled={loading || refreshing}
                className="gap-1.5 text-xs"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={() => setIsAddOpen(true)}
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Staff Member
              </Button>
            </div>
          }
        />

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Security Banner */}
          <Alert className="bg-primary/5 border-primary/20">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-semibold text-primary">
              Section 20 Isolation & Access Control Active
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-0.5">
              Hospital administrators manage staff members strictly within this hospital. Permitted roles are:{" "}
              <strong>DOCTOR</strong>, <strong>HOSPITAL_ADMIN</strong>, <strong>PHARMACY</strong>, and <strong>LAB</strong>. System administrators and external organization users cannot be managed here.
            </AlertDescription>
          </Alert>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="Total Hospital Staff"
              value={String(metrics.total)}
              badge="+Live"
              trend="stable"
              icon={Users}
              iconColor="primary"
            />
            <MetricCard
              label="Active Doctors"
              value={String(metrics.doctors)}
              badge="Clinical"
              trend="up"
              icon={Stethoscope}
              iconColor="blue"
            />
            <MetricCard
              label="Hospital Admins"
              value={String(metrics.admins)}
              badge="Operations"
              trend="stable"
              icon={ShieldCheck}
              iconColor="purple"
            />
            <MetricCard
              label="Pharmacy Staff"
              value={String(metrics.pharmacy)}
              badge="Dispensary"
              trend="stable"
              icon={Pill}
              iconColor="green"
            />
            <MetricCard
              label="Laboratory Staff"
              value={String(metrics.lab)}
              badge="Diagnostics"
              trend="stable"
              icon={Microscope}
              iconColor="amber"
            />
          </div>

          {/* Table Container Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Hospital Staff Directory
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Viewing {filteredStaff.length} of {staff.length} registered personnel
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search name, email, staff ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-9 text-xs"
                    />
                  </div>

                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-36 h-9 text-xs">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 h-9 text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={filteredStaff}
                isLoading={loading}
                emptyTitle="No hospital staff found"
                emptyDescription="No hospital staff members match your criteria."
              />
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* ADD NEW STAFF DIALOG                                                      */}
        {/* ========================================================================= */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="w-5 h-5 text-primary" />
                Add Hospital Staff Member
              </DialogTitle>
              <DialogDescription className="text-xs">
                Register a new healthcare professional or staff member to your hospital organization.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="e.g. Samuel"
                    value={addForm.firstName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, firstName: e.target.value })
                    }
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="e.g. Adeleke"
                    value={addForm.lastName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, lastName: e.target.value })
                    }
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.org"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber" className="text-xs font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+234 801 234 5678"
                    value={addForm.phoneNumber}
                    onChange={(e) =>
                      setAddForm({ ...addForm, phoneNumber: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-medium">
                    Hospital Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={addForm.role}
                    onValueChange={(val: string) =>
                      setAddForm({ ...addForm, role: val as HospitalRoleType })
                    }
                  >
                    <SelectTrigger id="role" className="h-9 text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR" className="text-xs">
                        DOCTOR (Clinical Provider)
                      </SelectItem>
                      <SelectItem value="HOSPITAL_ADMIN" className="text-xs">
                        HOSPITAL_ADMIN (Administrator)
                      </SelectItem>
                      <SelectItem value="PHARMACY" className="text-xs">
                        PHARMACY (Fulfillment)
                      </SelectItem>
                      <SelectItem value="LAB" className="text-xs">
                        LAB (Diagnostics)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-xs font-medium">
                    Department
                  </Label>
                  <Select
                    value={addForm.departmentId}
                    onValueChange={(val) =>
                      setAddForm({ ...addForm, departmentId: val })
                    }
                  >
                    <SelectTrigger id="department" className="h-9 text-xs">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-xs">
                        None / General
                      </SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="position" className="text-xs font-medium">
                    Position Title
                  </Label>
                  <Input
                    id="position"
                    placeholder="e.g. Senior Consultant"
                    value={addForm.position}
                    onChange={(e) =>
                      setAddForm({ ...addForm, position: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="specialization" className="text-xs font-medium">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    placeholder="e.g. Cardiology / Oncology"
                    value={addForm.specialization}
                    onChange={(e) =>
                      setAddForm({ ...addForm, specialization: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Initial Password (Optional)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave blank for default: ClearMedStaff@2026"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm({ ...addForm, password: e.target.value })
                  }
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  The staff member can change their password upon their first login.
                </p>
              </div>

              <DialogFooter className="pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                  disabled={submittingAdd}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingAdd}
                  className="text-xs bg-primary hover:bg-primary/90"
                >
                  {submittingAdd ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Creating Staff...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      Add Staff Member
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* EDIT STAFF DIALOG                                                         */}
        {/* ========================================================================= */}
        <Dialog
          open={Boolean(editTarget)}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Edit2 className="w-5 h-5 text-primary" />
                Edit Staff Member
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update role, department, specialization, or active status for{" "}
                <strong>{editTarget?.name}</strong> ({editTarget?.staffId}).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editFirstName" className="text-xs font-medium">
                    First Name
                  </Label>
                  <Input
                    id="editFirstName"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editLastName" className="text-xs font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="editLastName"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editPhone" className="text-xs font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="editPhone"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phoneNumber: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editRole" className="text-xs font-medium">
                    Hospital Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(val: string) =>
                      setEditForm({ ...editForm, role: val as HospitalRoleType })
                    }
                  >
                    <SelectTrigger id="editRole" className="h-9 text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR" className="text-xs">
                        DOCTOR (Clinical Provider)
                      </SelectItem>
                      <SelectItem value="HOSPITAL_ADMIN" className="text-xs">
                        HOSPITAL_ADMIN (Administrator)
                      </SelectItem>
                      <SelectItem value="PHARMACY" className="text-xs">
                        PHARMACY (Fulfillment)
                      </SelectItem>
                      <SelectItem value="LAB" className="text-xs">
                        LAB (Diagnostics)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editDept" className="text-xs font-medium">
                    Department
                  </Label>
                  <Select
                    value={editForm.departmentId}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, departmentId: val })
                    }
                  >
                    <SelectTrigger id="editDept" className="h-9 text-xs">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-xs">
                        None / General
                      </SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="editPosition" className="text-xs font-medium">
                    Position Title
                  </Label>
                  <Input
                    id="editPosition"
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm({ ...editForm, position: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editSpec" className="text-xs font-medium">
                  Specialization
                </Label>
                <Input
                  id="editSpec"
                  value={editForm.specialization}
                  onChange={(e) =>
                    setEditForm({ ...editForm, specialization: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Account Status
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Inactive staff will not be able to log in or create authorizations.
                  </div>
                </div>
                <Button
                  type="button"
                  variant={editForm.isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setEditForm({ ...editForm, isActive: !editForm.isActive })
                  }
                  className={`text-xs ${
                    editForm.isActive
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "text-muted-foreground"
                  }`}
                >
                  {editForm.isActive ? "Active Account" : "Inactive Account"}
                </Button>
              </div>

              <DialogFooter className="pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTarget(null)}
                  disabled={submittingEdit}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingEdit}
                  className="text-xs bg-primary hover:bg-primary/90"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* TOGGLE STATUS CONFIRMATION DIALOG                                         */}
        {/* ========================================================================= */}
        <Dialog
          open={Boolean(toggleTarget)}
          onOpenChange={(open) => {
            if (!open) setToggleTarget(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                {toggleTarget?.isActive ? (
                  <>
                    <UserX className="w-5 h-5 text-red-500" />
                    Deactivate Staff Member?
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                    Activate Staff Member?
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {toggleTarget?.isActive
                  ? `Are you sure you want to deactivate ${toggleTarget?.name}? They will immediately lose access to the hospital portal.`
                  : `Are you sure you want to activate ${toggleTarget?.name}? Their portal access will be immediately restored.`}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setToggleTarget(null)}
                disabled={submittingToggle}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant={toggleTarget?.isActive ? "destructive" : "default"}
                size="sm"
                onClick={handleToggleStatus}
                disabled={submittingToggle}
                className={`text-xs ${
                  !toggleTarget?.isActive
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : ""
                }`}
              >
                {submittingToggle ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : toggleTarget?.isActive ? (
                  "Deactivate Account"
                ) : (
                  "Activate Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
    </HospitalSidebarWrapper>
  );
}
