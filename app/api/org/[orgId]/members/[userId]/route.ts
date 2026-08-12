/**
 * PATCH  /api/org/[orgId]/members/[userId] — change role / overrides / reactivate
 * DELETE /api/org/[orgId]/members/[userId] — deactivate
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/org-context";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const { orgId, userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getOrgContext(session.user.id, orgId);
    if (!ctx || !isAdmin(ctx)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { roleId, permissionOverrides, isActive } = await req.json();

    const membership = await prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!membership) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const updated = await prisma.orgMembership.update({
      where: { userId_orgId: { userId, orgId } },
      data: {
        ...(roleId !== undefined ? { roleId } : {}),
        ...(permissionOverrides !== undefined
          ? { permissionOverrides: JSON.stringify(permissionOverrides) }
          : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const { orgId, userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getOrgContext(session.user.id, orgId);
    if (!ctx || !isAdmin(ctx)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    await prisma.orgMembership.update({
      where: { userId_orgId: { userId, orgId } },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Member deactivated" });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
