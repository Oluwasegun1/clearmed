/**
 * GET  /api/org/[orgId]/roles  — list org roles
 * POST /api/org/[orgId]/roles  — create custom role
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/org-context";
import { DEFAULT_HOSPITAL_ROLES, DEFAULT_HMO_ROLES } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getOrgContext(session.user.id, orgId);
    if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let roles = await prisma.orgRole.findMany({
      where: { orgId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    if (roles.length === 0) {
      const defaults = ctx.orgType === "HMO" ? DEFAULT_HMO_ROLES : DEFAULT_HOSPITAL_ROLES;
      for (const d of defaults) {
        await prisma.orgRole.create({
          data: {
            orgType: ctx.orgType,
            orgId,
            name: d.name,
            permissions: JSON.stringify(d.permissions),
            isDefault: d.isDefault,
          },
        });
      }
      roles = await prisma.orgRole.findMany({
        where: { orgId },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      });
    }

    const memberCounts = await prisma.orgMembership.groupBy({
      by: ["roleId"],
      where: { orgId, isActive: true },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(
      memberCounts.filter((c) => c.roleId).map((c) => [c.roleId!, c._count.id])
    );

    return NextResponse.json(
      roles.map((r) => ({
        ...r,
        permissions: JSON.parse(r.permissions || "[]"),
        memberCount: countMap[r.id] ?? 0,
      }))
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getOrgContext(session.user.id, orgId);
    if (!ctx || !isAdmin(ctx)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, permissions = [] } = await req.json();
    if (!name) return NextResponse.json({ error: "Role name is required" }, { status: 400 });

    const role = await prisma.orgRole.create({
      data: {
        orgType: ctx.orgType,
        orgId,
        name,
        permissions: JSON.stringify(permissions),
      },
    });

    return NextResponse.json({ ...role, permissions }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
