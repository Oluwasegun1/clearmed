/**
 * GET  /api/invite/[token]  — validate token, return org + role info (public)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await prisma.orgInvite.findUnique({ where: { token } });
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "This invite has already been used or revoked" }, { status: 410 });
    }
    if (invite.expiresAt < new Date()) {
      await prisma.orgInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
      return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
    }

    let orgName = "";
    if (invite.orgType === "HOSPITAL") {
      const hosp = await prisma.hospital.findUnique({ where: { id: invite.orgId } });
      orgName = hosp?.name ?? "Unknown Hospital";
    } else {
      const hmo = await prisma.hMO.findUnique({ where: { id: invite.orgId } });
      orgName = hmo?.name ?? "Unknown HMO";
    }

    let roleName = "Staff";
    if (invite.roleId) {
      const role = await prisma.orgRole.findUnique({ where: { id: invite.roleId } });
      roleName = role?.name ?? "Staff";
    }

    const inviter = await prisma.user.findUnique({
      where: { id: invite.invitedById },
      select: { firstName: true, lastName: true },
    });

    return NextResponse.json({
      email: invite.email,
      orgType: invite.orgType,
      orgId: invite.orgId,
      orgName,
      roleName,
      inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}` : "Admin",
      expiresAt: invite.expiresAt,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
