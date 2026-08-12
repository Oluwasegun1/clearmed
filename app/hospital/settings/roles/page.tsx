"use client";

/**
 * Hospital Admin — Roles & Permissions matrix.
 * /hospital/settings/roles
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HOSPITAL_PERMISSIONS, type HospitalPermissionKey } from "@/lib/permissions";
import {
  Shield, Plus, Loader2, AlertCircle, Save, Trash2, Check,
} from "lucide-react";

interface OrgRole {
  id: string;
  name: string;
  permissions: HospitalPermissionKey[];
  isDefault: boolean;
}

const ALL_PERMISSIONS = Object.entries(HOSPITAL_PERMISSIONS) as [HospitalPermissionKey, { label: string }][];

export default function HospitalRolesPage() {
  const { data: session } = useSession();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // roleId being saved
  const [error, setError] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [addingRole, setAddingRole] = useState(false);
  const [dirtyRoles, setDirtyRoles] = useState<Record<string, HospitalPermissionKey[]>>({});

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/me/org").then((r) => r.json()).then((d) => { if (d.orgId) setOrgId(d.orgId); });
  }, [session?.user?.id]);

  const fetchRoles = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/org/${orgId}/roles`);
      const data = res.ok ? await res.json() : [];
      setRoles(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load roles"); }
    finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const getPerms = (role: OrgRole) => dirtyRoles[role.id] ?? role.permissions;

  const togglePerm = (roleId: string, perm: HospitalPermissionKey, current: HospitalPermissionKey[]) => {
    const next = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    setDirtyRoles((prev) => ({ ...prev, [roleId]: next }));
  };

  const saveRole = async (role: OrgRole) => {
    if (!orgId) return;
    setSaving(role.id);
    try {
      await fetch(`/api/org/${orgId}/roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: getPerms(role) }),
      });
      setDirtyRoles((prev) => { const next = { ...prev }; delete next[role.id]; return next; });
      await fetchRoles();
    } finally { setSaving(null); }
  };

  const deleteRole = async (roleId: string) => {
    if (!orgId || !confirm("Delete this role?")) return;
    await fetch(`/api/org/${orgId}/roles/${roleId}`, { method: "DELETE" });
    fetchRoles();
  };

  const createRole = async () => {
    if (!orgId || !newRoleName.trim()) return;
    setAddingRole(true);
    try {
      await fetch(`/api/org/${orgId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName.trim(), permissions: [] }),
      });
      setNewRoleName("");
      fetchRoles();
    } finally { setAddingRole(false); }
  };

  return (
    <HospitalSidebarWrapper currentPath="/hospital/settings/roles" role={UserRole.HOSPITAL_ADMIN}>
      <div className="min-h-screen bg-background overflow-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Define what each role can do. Changes apply immediately on save.
          </p>
        </div>

        <div className="relative p-6 max-w-6xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add role */}
          <Card className="data-visualization">
            <CardContent className="p-4 flex items-center gap-3">
              <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="New role name (e.g. Nurse)" className="max-w-xs" />
              <Button onClick={createRole} disabled={addingRole || !newRoleName.trim()} size="sm" className="gap-2">
                {addingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Role
              </Button>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => {
                const perms = getPerms(role);
                const isDirty = !!dirtyRoles[role.id];
                return (
                  <Card key={role.id} className="data-visualization">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{role.name}</CardTitle>
                          {role.isDefault && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              Default
                            </Badge>
                          )}
                          {isDirty && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              Unsaved changes
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm" variant={isDirty ? "default" : "outline"}
                            disabled={saving === role.id || !isDirty}
                            onClick={() => saveRole(role)}
                            className="gap-1.5"
                          >
                            {saving === role.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Save className="h-3.5 w-3.5" />}
                            Save
                          </Button>
                          {!role.isDefault && (
                            <Button size="sm" variant="ghost" onClick={() => deleteRole(role.id)}
                              className="text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        {perms.length} permission{perms.length !== 1 ? "s" : ""} granted
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {ALL_PERMISSIONS.map(([key, { label }]) => {
                          const active = perms.includes(key);
                          return (
                            <button
                              key={key}
                              onClick={() => togglePerm(role.id, key, perms)}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors
                                ${active
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-muted/50 text-muted-foreground border border-transparent hover:border-border"
                                }`}
                            >
                              <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border
                                ${active ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                                {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                              </div>
                              <span className="truncate">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
