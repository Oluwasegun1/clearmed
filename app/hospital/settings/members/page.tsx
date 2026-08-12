"use client";

/**
 * Hospital Admin — Staff Members management.
 * /hospital/settings/members
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { HospitalSidebarWrapper } from "@/components/sidebars";
import { UserRole } from "@/lib/enums/UserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users, UserPlus, Loader2, AlertCircle, CheckCircle2,
  MailIcon, ShieldOff, RefreshCcw, X,
} from "lucide-react";

interface OrgRole { id: string; name: string; permissions: string[] }
interface Member {
  id: string; userId: string; roleId: string | null; isActive: boolean; joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  role: { id: string; name: string } | null;
}

export default function HospitalMembersPage() {
  const { data: session } = useSession();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite panel
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ url?: string; error?: string } | null>(null);

  // Resolve orgId from HospitalStaff
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/me/org")
      .then((r) => r.json())
      .then((d) => { if (d.orgId) setOrgId(d.orgId); })
      .catch(() => {});
  }, [session?.user?.id]);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError("");
    try {
      const [mRes, rRes] = await Promise.all([
        fetch(`/api/org/${orgId}/members`),
        fetch(`/api/org/${orgId}/roles`),
      ]);
      const mData = mRes.ok ? await mRes.json() : [];
      const rData = rRes.ok ? await rRes.json() : [];
      setMembers(Array.isArray(mData) ? mData : []);
      setRoles(Array.isArray(rData) ? rData : []);
    } catch { setError("Failed to load members"); }
    finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendInvite = async () => {
    if (!orgId || !inviteEmail) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch(`/api/org/${orgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, roleId: inviteRoleId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setInviteResult({ error: data.error || "Failed" }); return; }
      setInviteResult({ url: data.inviteUrl });
      setInviteEmail("");
      setInviteRoleId("");
    } catch { setInviteResult({ error: "Network error" }); }
    finally { setInviting(false); }
  };

  const toggleActive = async (member: Member) => {
    if (!orgId) return;
    await fetch(`/api/org/${orgId}/members/${member.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    fetchData();
  };

  const changeRole = async (userId: string, roleId: string) => {
    if (!orgId) return;
    await fetch(`/api/org/${orgId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
    fetchData();
  };

  return (
    <HospitalSidebarWrapper currentPath="/hospital/settings/members" role={UserRole.HOSPITAL_ADMIN}>
      <div className="min-h-screen bg-background overflow-auto">
        <div className="fixed inset-0 professional-grid opacity-40 pointer-events-none" />
        <div className="relative border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> Staff Members
            </h1>
            <p className="text-sm text-muted-foreground">Manage who has access to your hospital</p>
          </div>
          <Button onClick={() => { setShowInvite(true); setInviteResult(null); }} className="gap-2">
            <UserPlus className="h-4 w-4" /> Invite Staff
          </Button>
        </div>

        <div className="relative p-6 space-y-6 max-w-4xl mx-auto">
          {/* Invite panel */}
          {showInvite && (
            <Card className="data-visualization border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MailIcon className="h-4 w-4" /> Invite a staff member
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowInvite(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email address</Label>
                    <Input id="inviteEmail" type="email" value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="doctor@hospital.ng" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role (optional)</Label>
                    <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                      <SelectTrigger><SelectValue placeholder="Select a role…" /></SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={sendInvite} disabled={inviting || !inviteEmail} className="gap-2">
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailIcon className="h-4 w-4" />}
                  Send invite
                </Button>
                {inviteResult?.error && (
                  <Alert variant="destructive"><AlertCircle className="h-4 w-4" />
                    <AlertDescription>{inviteResult.error}</AlertDescription>
                  </Alert>
                )}
                {inviteResult?.url && (
                  <Alert className="bg-green-500/10 border-green-500/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Invite link generated</AlertTitle>
                    <AlertDescription>
                      <p className="text-xs mb-1 text-muted-foreground">
                        (Email sending not configured — share this link manually)
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded break-all block">
                        {inviteResult.url}
                      </code>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Members table */}
          {error && (
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <Card className="data-visualization">
              <CardContent className="p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No members yet. Invite your first staff member above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="data-visualization">
              <CardHeader>
                <CardTitle className="text-base">
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/60">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {(m.user?.firstName?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {m.user ? `${m.user.firstName} ${m.user.lastName}` : "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{m.user?.email}</p>
                      </div>
                      {/* Role selector */}
                      <Select
                        value={m.roleId ?? ""}
                        onValueChange={(v) => changeRole(m.userId, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue placeholder="No role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Status badge */}
                      <Badge
                        variant="outline"
                        className={m.isActive
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"}
                      >
                        {m.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {/* Toggle */}
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => toggleActive(m)}
                        title={m.isActive ? "Deactivate" : "Reactivate"}
                      >
                        {m.isActive
                          ? <ShieldOff className="h-4 w-4 text-destructive" />
                          : <RefreshCcw className="h-4 w-4 text-green-600" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
