/**
 * PATCH  /api/org/[orgId]/roles/[roleId] — edit role name/permissions
 * DELETE /api/org/[orgId]/roles/[roleId] — delete role (if no members assigned)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/org-context";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; roleId: string }> }
) {
  try {
    const { orgId, roleId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getOrgContext(session.user.id, orgId);
    if (!ctx || !isAdmin(ctx)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const role = await prisma.orgRole.findUnique({ where: { id: roleId } });
    if (!role || role.orgId !== orgId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const { name, permissions } = await req.json();

    const updated = await prisma.orgRole.update({
      where: { id: roleId },
      data: {
        ...(name ? { name } : {}),
        ...(permissions !== undefined ? { permissions: JSON.stringify(permissions) } : {}),
      },
    });

    return NextResponse.json({ ...updated, permissions: JSON.parse(updated.permissions || "[]") });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; roleId: string }> }
) {
  try {
    const { orgId, roleId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getOrgContext(session.user.id, orgId);
    if (!ctx || !isAdmin(ctx)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const role = await prisma.orgRole.findUnique({ where: { id: roleId } });
    if (!role || role.orgId !== orgId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    if (role.isDefault) {
      return NextResponse.json({ error: "Default roles cannot be deleted" }, { status: 400 });
    }

    const membersWithRole = await prisma.orgMembership.count({
      where: { orgId, roleId, isActive: true },
    });
    if (membersWithRole > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${membersWithRole} active member(s) have this role. Reassign them first.` },
        { status: 409 }
      );
    }

    await prisma.orgRole.delete({ where: { id: roleId } });
    return NextResponse.json({ message: "Role deleted" });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
