/**
 * Shared server-side helpers for org/RBAC operations.
 */
import { prisma } from "@/lib/prisma";

export interface OrgContext {
  orgId: string;
  orgType: "HOSPITAL" | "HMO";
  roleId: string | null;
  permissions: string[];
  isActive: boolean;
}

/** Returns the caller's OrgMembership context for a given org, or null if not a member. */
export async function getOrgContext(userId: string, orgId: string): Promise<OrgContext | null> {
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_orgId: { userId, orgId } },
  });
  if (!membership || !membership.isActive) return null;

  let permissions: string[] = [];
  if (membership.roleId) {
    const role = await prisma.orgRole.findUnique({ where: { id: membership.roleId } });
    permissions = JSON.parse(role?.permissions ?? "[]");
  }

  // Apply permission overrides
  const overrides = JSON.parse(membership.permissionOverrides || '{"granted":[],"revoked":[]}') as {
    granted: string[];
    revoked: string[];
  };
  permissions = [...permissions, ...overrides.granted].filter((p) => !overrides.revoked.includes(p));

  return {
    orgId: membership.orgId,
    orgType: membership.orgType as "HOSPITAL" | "HMO",
    roleId: membership.roleId,
    permissions,
    isActive: membership.isActive,
  };
}

export function can(ctx: OrgContext, permission: string): boolean {
  return ctx.permissions.includes(permission);
}

export function isAdmin(ctx: OrgContext): boolean {
  return can(ctx, "HOSP_MANAGE_STAFF") || can(ctx, "HMO_MANAGE_STAFF");
}
