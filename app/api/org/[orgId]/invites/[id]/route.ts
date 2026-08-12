/**
 * DELETE /api/org/[orgId]/invites/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/org-context";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  try {
    const { orgId, id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getOrgContext(session.user.id, orgId);
    if (!ctx || !isAdmin(ctx)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const invite = await prisma.orgInvite.findUnique({ where: { id } });
    if (!invite || invite.orgId !== orgId) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending invites can be revoked" }, { status: 409 });
    }

    await prisma.orgInvite.update({ where: { id }, data: { status: "REVOKED" } });
    return NextResponse.json({ message: "Invite revoked" });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
