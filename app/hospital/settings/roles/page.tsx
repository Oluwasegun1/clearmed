"use client";

/**
 * Hospital Admin — Roles & Permissions Matrix.
 * Fully functional Role-Based Access Control management.
 * /hospital/settings/roles
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HOSPITAL_PERMISSIONS,
  type HospitalPermissionKey,
  DEFAULT_HOSPITAL_ROLES,
} from "@/lib/permissions";
import {
  Shield,
  Plus,
  Loader2,
  AlertCircle,
  Save,
  Trash2,
  Check,
  CheckCircle2,
  Users,
  Search,
  Sparkles,
  Edit2,
  CheckSquare,
  Square,
  Lock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface OrgRole {
  id: string;
  name: string;
  permissions: HospitalPermissionKey[];
  isDefault: boolean;
  memberCount?: number;
}

// Group permissions into clear functional domains
const PERMISSION_CATEGORIES: Array<{
  name: string;
  description: string;
  keys: HospitalPermissionKey[];
}> = [
  {
    name: "Authorizations & Patient Records",
    description: "Care requests, authorizations, and clinical patient records",
    keys: [
      "HOSP_VIEW_REQUESTS",
      "HOSP_CREATE_REQUESTS",
      "HOSP_APPROVE_REQUESTS",
      "HOSP_VIEW_PATIENTS",
    ],
  },
  {
    name: "Specialized Clinical Modules",
    description: "Pharmacy dispensary and laboratory investigation workflows",
    keys: ["HOSP_PHARMACY_ACCESS", "HOSP_LAB_ACCESS"],
  },
  {
    name: "Staff & Role Administration",
    description: "Member onboarding, role customization, and department management",
    keys: ["HOSP_MANAGE_STAFF", "HOSP_MANAGE_ROLES", "HOSP_MANAGE_DEPARTMENTS"],
  },
  {
    name: "Analytics & Profile",
    description: "Performance reports, analytics, and hospital profile settings",
    keys: ["HOSP_VIEW_REPORTS", "HOSP_EDIT_PROFILE"],
  },
];

export default function HospitalRolesPage() {
  const { data: session } = useSession();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Role creation dialog state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [creatingRole, setCreatingRole] = useState(false);

  // Role renaming dialog state
  const [editingRole, setEditingRole] = useState<OrgRole | null>(null);
  const [renamedTitle, setRenamedTitle] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Role deletion state
  const [roleToDelete, setRoleToDelete] = useState<OrgRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Track unsaved local edits: { [roleId]: HospitalPermissionKey[] }
  const [dirtyRoles, setDirtyRoles] = useState<Record<string, HospitalPermissionKey[]>>({});

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/me/org")
      .then((r) => r.json())
      .then((d) => {
        if (d.orgId) setOrgId(d.orgId);
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const fetchRoles = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/org/${orgId}/roles`);
      const data = res.ok ? await res.json() : [];
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load hospital roles and permissions");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const getPerms = (role: OrgRole) => dirtyRoles[role.id] ?? role.permissions;

  const togglePerm = (roleId: string, perm: HospitalPermissionKey, current: HospitalPermissionKey[]) => {
    const next = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    setDirtyRoles((prev) => ({ ...prev, [roleId]: next }));
  };

  const handleToggleCategory = (
    roleId: string,
    catKeys: HospitalPermissionKey[],
    current: HospitalPermissionKey[]
  ) => {
    const allActive = catKeys.every((k) => current.includes(k));
    let next: HospitalPermissionKey[];
    if (allActive) {
      next = current.filter((k) => !catKeys.includes(k));
    } else {
      next = Array.from(new Set([...current, ...catKeys]));
    }
    setDirtyRoles((prev) => ({ ...prev, [roleId]: next }));
  };

  const handleSelectAllForRole = (roleId: string) => {
    const allKeys = Object.keys(HOSPITAL_PERMISSIONS) as HospitalPermissionKey[];
    setDirtyRoles((prev) => ({ ...prev, [roleId]: allKeys }));
  };

  const handleClearAllForRole = (roleId: string) => {
    setDirtyRoles((prev) => ({ ...prev, [roleId]: [] }));
  };

  const handleResetRole = (role: OrgRole) => {
    setDirtyRoles((prev) => {
      const next = { ...prev };
      delete next[role.id];
      return next;
    });
  };

  const saveRole = async (role: OrgRole) => {
    if (!orgId) return;
    setSavingRoleId(role.id);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/org/${orgId}/roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: getPerms(role) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role permissions");

      setDirtyRoles((prev) => {
        const next = { ...prev };
        delete next[role.id];
        return next;
      });
      setSuccessMsg(`Permissions saved successfully for ${role.name}.`);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving role");
    } finally {
      setSavingRoleId(null);
    }
  };

  const saveAllDirtyRoles = async () => {
    if (!orgId) return;
    setSavingAll(true);
    setError("");
    setSuccessMsg("");

    const dirtyIds = Object.keys(dirtyRoles);
    try {
      await Promise.all(
        dirtyIds.map((id) =>
          fetch(`/api/org/${orgId}/roles/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permissions: dirtyRoles[id] }),
          })
        )
      );

      setDirtyRoles({});
      setSuccessMsg(`All ${dirtyIds.length} modified roles saved successfully.`);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save all changes");
    } finally {
      setSavingAll(false);
    }
  };

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newRoleName.trim()) return;
    setCreatingRole(true);
    setError("");

    let initialPerms: HospitalPermissionKey[] = [];
    if (selectedTemplate !== "custom") {
      const template = DEFAULT_HOSPITAL_ROLES.find((t) => t.name === selectedTemplate);
      if (template) initialPerms = template.permissions;
    }

    try {
      const res = await fetch(`/api/org/${orgId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName.trim(),
          permissions: initialPerms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create role");

      setNewRoleName("");
      setSelectedTemplate("custom");
      setShowCreateModal(false);
      setSuccessMsg(`Role "${data.name}" created successfully.`);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating role");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleRenameRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !editingRole || !renamedTitle.trim()) return;
    setRenaming(true);
    setError("");

    try {
      const res = await fetch(`/api/org/${orgId}/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renamedTitle.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename role");

      setEditingRole(null);
      setSuccessMsg(`Role renamed to "${data.name}".`);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error renaming role");
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!orgId || !roleToDelete) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/org/${orgId}/roles/${roleToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete role");

      setRoleToDelete(null);
      setSuccessMsg(`Role "${roleToDelete.name}" deleted.`);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting role");
    } finally {
      setDeleting(false);
    }
  };

  const dirtyCount = Object.keys(dirtyRoles).length;

  const filteredRoles = roles.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = r.name.toLowerCase().includes(term);
    const permMatch = r.permissions.some((p) =>
      HOSPITAL_PERMISSIONS[p]?.label.toLowerCase().includes(term)
    );
    return nameMatch || permMatch;
  });

  return (
    <HospitalSidebarWrapper currentPath="/hospital/settings/roles" role={UserRole.HOSPITAL_ADMIN}>
      <div className="min-h-screen bg-background overflow-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />

        {/* Top Header */}
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" /> Roles & Permissions Matrix
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure fine-grained access control, staff responsibilities, and clinical privileges
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dirtyCount > 0 && (
              <Button
                onClick={saveAllDirtyRoles}
                disabled={savingAll}
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                size="sm"
              >
                {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save All Changes ({dirtyCount})
              </Button>
            )}
            <Button
              onClick={() => {
                setShowCreateModal(true);
                setNewRoleName("");
                setSelectedTemplate("custom");
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Custom Role
            </Button>
          </div>
        </div>

        <div className="relative p-6 max-w-7xl mx-auto space-y-6">
          {/* Status Alerts */}
          {successMsg && (
            <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Notice</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Search & Summary Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles or permission keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-primary" /> {roles.length} Configured Roles
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <Link href="/hospital/settings/members" className="hover:underline text-primary">
                  Manage Staff Assignments
                </Link>
              </span>
            </div>
          </div>

          {/* Roles Matrix */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <Card className="data-visualization">
              <CardContent className="p-12 text-center">
                <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No roles match your search</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term or add a new role</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredRoles.map((role) => {
                const perms = getPerms(role);
                const isDirty = !!dirtyRoles[role.id];
                const totalPossible = Object.keys(HOSPITAL_PERMISSIONS).length;

                return (
                  <Card key={role.id} className={`data-visualization transition-all ${isDirty ? "border-amber-500/50 shadow-sm" : ""}`}>
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            {role.name}
                          </CardTitle>

                          {role.isDefault ? (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 gap-1">
                              <Lock className="h-3 w-3" /> System Default
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Custom Role
                            </Badge>
                          )}

                          {isDirty && (
                            <Badge className="text-xs bg-amber-500/15 text-amber-600 border-amber-500/30">
                              Unsaved Changes
                            </Badge>
                          )}

                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {role.memberCount ?? 0} staff member{(role.memberCount ?? 0) !== 1 ? "s" : ""}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {!role.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingRole(role);
                                setRenamedTitle(role.name);
                              }}
                              className="h-8 text-xs gap-1"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Rename
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant={isDirty ? "default" : "outline"}
                            disabled={savingRoleId === role.id || !isDirty}
                            onClick={() => saveRole(role)}
                            className="h-8 gap-1.5"
                          >
                            {savingRoleId === role.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Save Changes
                          </Button>

                          {isDirty && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResetRole(role)}
                              className="h-8 text-xs text-muted-foreground"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
                            </Button>
                          )}

                          {!role.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRoleToDelete(role)}
                              className="h-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>
                          {perms.length} of {totalPossible} privileges granted ({Math.round((perms.length / totalPossible) * 100)}%)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSelectAllForRole(role.id)}
                            className="hover:text-primary underline text-[11px]"
                          >
                            Grant All
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => handleClearAllForRole(role.id)}
                            className="hover:text-destructive underline text-[11px]"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6 space-y-6">
                      {PERMISSION_CATEGORIES.map((cat) => {
                        const catAllActive = cat.keys.every((k) => perms.includes(k));
                        const catSomeActive = cat.keys.some((k) => perms.includes(k));

                        return (
                          <div key={cat.name} className="space-y-2.5">
                            <div className="flex items-center justify-between border-b pb-1.5">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  {cat.name}
                                </h4>
                                <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                              </div>
                              <button
                                onClick={() => handleToggleCategory(role.id, cat.keys, perms)}
                                className="text-[11px] text-primary hover:underline font-medium"
                              >
                                {catAllActive ? "Deselect group" : "Select group"}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2.5">
                              {cat.keys.map((key) => {
                                const active = perms.includes(key);
                                const label = HOSPITAL_PERMISSIONS[key]?.label || key;

                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => togglePerm(role.id, key, perms)}
                                    className={`flex items-start gap-3 rounded-lg p-3 text-left transition-all border
                                      ${
                                        active
                                          ? "bg-primary/10 border-primary/30 text-foreground"
                                          : "bg-card hover:bg-muted/40 border-border text-muted-foreground"
                                      }`}
                                  >
                                    <div
                                      className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-colors
                                        ${
                                          active
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground/40 bg-background"
                                        }`}
                                    >
                                      {active && <Check className="h-3 w-3 stroke-[3]" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className={`text-sm font-medium leading-none ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                                        {label}
                                      </p>
                                      <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">
                                        {key}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Custom Role Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Create Custom Hospital Role
              </DialogTitle>
              <DialogDescription>
                Define a new role and choose an optional starter template
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createRole} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Title</Label>
                <Input
                  id="roleName"
                  placeholder="e.g. Senior Medical Officer or Triage Nurse"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Starting Template Preset</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate("custom")}
                    className={`p-2.5 text-xs text-left rounded-lg border ${
                      selectedTemplate === "custom"
                        ? "bg-primary/10 border-primary font-semibold text-primary"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    Blank Template
                  </button>
                  {DEFAULT_HOSPITAL_ROLES.filter((t) => !t.isDefault).map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setSelectedTemplate(t.name)}
                      className={`p-2.5 text-xs text-left rounded-lg border ${
                        selectedTemplate === t.name
                          ? "bg-primary/10 border-primary font-semibold text-primary"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      {t.name} ({t.permissions.length} perms)
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingRole || !newRoleName.trim()} className="gap-2">
                  {creatingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Role
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Rename Role Modal */}
        <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" /> Rename Role
              </DialogTitle>
              <DialogDescription>
                Update the display name for this custom role
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRenameRole} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="renamedName">New Role Title</Label>
                <Input
                  id="renamedName"
                  value={renamedTitle}
                  onChange={(e) => setRenamedTitle(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={renaming || !renamedTitle.trim()} className="gap-2">
                  {renaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Update Name
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Delete Role
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{roleToDelete?.name}</strong>?
              </DialogDescription>
            </DialogHeader>

            {roleToDelete && (roleToDelete.memberCount ?? 0) > 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Active Members Warning</AlertTitle>
                <AlertDescription>
                  This role currently has <strong>{roleToDelete.memberCount}</strong> active staff member(s) assigned. You must reassign them to another role before deleting.
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Staff members will no longer be assignable to this custom role.
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setRoleToDelete(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting || (roleToDelete?.memberCount ?? 0) > 0}
                onClick={handleDeleteRole}
                className="gap-2"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </HospitalSidebarWrapper>
  );
}
