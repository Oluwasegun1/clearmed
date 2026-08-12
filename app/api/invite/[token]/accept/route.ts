/**
 * POST /api/invite/[token]/accept
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
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

    const { firstName, lastName, password, phoneNumber } = await req.json();
    if (!firstName || !lastName || !password) {
      return NextResponse.json({ error: "firstName, lastName, and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const userRole = invite.orgType === "HOSPITAL" ? "DOCTOR" : "HMO_STAFF";
    const user = await registerUser({
      email: invite.email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role: userRole as "DOCTOR" | "HMO_STAFF",
    });

    const roleName = invite.roleId
      ? (await prisma.orgRole.findUnique({ where: { id: invite.roleId } }))?.name ?? "Staff"
      : "Staff";

    if (invite.orgType === "HOSPITAL") {
      await prisma.hospitalStaff.create({
        data: {
          userId: user.id,
          hospitalId: invite.orgId,
          staffId: `STAFF-${user.id.slice(-8).toUpperCase()}`,
          position: roleName,
        },
      });
    } else {
      await prisma.hMOStaff.create({
        data: {
          userId: user.id,
          hmoId: invite.orgId,
          staffId: `HSTAFF-${user.id.slice(-8).toUpperCase()}`,
          position: roleName,
        },
      });
    }

    await prisma.orgMembership.create({
      data: {
        userId: user.id,
        orgType: invite.orgType,
        orgId: invite.orgId,
        roleId: invite.roleId ?? null,
        isActive: true,
      },
    });

    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "OrgMembership",
        entityId: user.id,
        details: `Joined ${invite.orgType} ${invite.orgId} via invite`,
      },
    });

    return NextResponse.json(
      { message: "Account created and joined organisation successfully", orgType: invite.orgType },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Invite accept error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
