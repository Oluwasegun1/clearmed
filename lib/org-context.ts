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

  if (membership && membership.isActive) {
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

  // Fallback: Check HospitalStaff or HMOStaff or System Admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { hospitalStaff: true, hmoStaff: true },
  });

  if (!user) return null;

  if (user.role === "SYSTEM_ADMIN") {
    const isHmo = await prisma.hMO.findUnique({ where: { id: orgId } });
    return {
      orgId,
      orgType: isHmo ? "HMO" : "HOSPITAL",
      roleId: null,
      permissions: ["HOSP_MANAGE_STAFF", "HOSP_MANAGE_ROLES", "HMO_MANAGE_STAFF", "HMO_MANAGE_ROLES"],
      isActive: true,
    };
  }

  if (user.hospitalStaff && (user.hospitalStaff.hospitalId === orgId || !orgId)) {
    const targetOrgId = orgId || user.hospitalStaff.hospitalId;
    const isHospitalAdmin = user.role === "HOSPITAL_ADMIN";
    return {
      orgId: targetOrgId,
      orgType: "HOSPITAL",
      roleId: null,
      permissions: isHospitalAdmin
        ? ["HOSP_VIEW_REQUESTS", "HOSP_CREATE_REQUESTS", "HOSP_APPROVE_REQUESTS", "HOSP_VIEW_PATIENTS", "HOSP_MANAGE_STAFF", "HOSP_MANAGE_ROLES", "HOSP_VIEW_REPORTS", "HOSP_EDIT_PROFILE", "HOSP_MANAGE_DEPARTMENTS"]
        : ["HOSP_VIEW_REQUESTS", "HOSP_CREATE_REQUESTS", "HOSP_VIEW_PATIENTS"],
      isActive: true,
    };
  }

  if (user.hmoStaff && (user.hmoStaff.hmoId === orgId || !orgId)) {
    const targetOrgId = orgId || user.hmoStaff.hmoId;
    const isHmoAdmin = user.role === "HMO_ADMIN";
    return {
      orgId: targetOrgId,
      orgType: "HMO",
      roleId: null,
      permissions: isHmoAdmin
        ? ["HMO_VIEW_CLAIMS", "HMO_APPROVE_CLAIMS", "HMO_REJECT_CLAIMS", "HMO_VIEW_MEMBERS", "HMO_MANAGE_STAFF", "HMO_MANAGE_ROLES", "HMO_VIEW_REPORTS", "HMO_EDIT_PROFILE", "HMO_MANAGE_PLANS", "HMO_MANAGE_CONTRACTS"]
        : ["HMO_VIEW_CLAIMS", "HMO_VIEW_MEMBERS"],
      isActive: true,
    };
  }

  return null;
}

export function can(ctx: OrgContext, permission: string): boolean {
  return ctx.permissions.includes(permission);
}

export function isAdmin(ctx: OrgContext): boolean {
  return (
    can(ctx, "HOSP_MANAGE_STAFF") ||
    can(ctx, "HOSP_MANAGE_ROLES") ||
    can(ctx, "HMO_MANAGE_STAFF") ||
    can(ctx, "HMO_MANAGE_ROLES")
  );
}
