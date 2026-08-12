/**
 * GET /api/org/[orgId]/members — list all members with user + role info
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/org-context";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getOrgContext(session.user.id, orgId);
    if (!ctx || !isAdmin(ctx)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const memberships = await prisma.orgMembership.findMany({ where: { orgId } });

    const enriched = await Promise.all(
      memberships.map(async (m) => {
        const user = await prisma.user.findUnique({
          where: { id: m.userId },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        const role = m.roleId
          ? await prisma.orgRole.findUnique({
              where: { id: m.roleId },
              select: { id: true, name: true },
            })
          : null;
        return { ...m, user, role };
      })
    );

    return NextResponse.json(enriched);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
