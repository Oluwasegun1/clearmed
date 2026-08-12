/**
 * GET  /api/org/[orgId]/invites  — list invites (Admin only)
 * POST /api/org/[orgId]/invites  — send invite (Admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/org-context";
import crypto from "crypto";

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

    const invites = await prisma.orgInvite.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
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

    const { email, roleId } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.orgMembership.findFirst({
        where: { userId: existingUser.id, orgId },
      });
      if (existingMember) {
        return NextResponse.json({ error: "This user is already a member of the organisation" }, { status: 409 });
      }
    }

    await prisma.orgInvite.updateMany({
      where: { email, orgId, status: "PENDING" },
      data: { status: "REVOKED" },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.orgInvite.create({
      data: {
        token,
        email,
        orgType: ctx.orgType,
        orgId,
        roleId: roleId || null,
        invitedById: session.user.id,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/invite/${token}`;
    console.log(`📨 Invite link for ${email}: ${inviteUrl}`);

    return NextResponse.json({ id: invite.id, token, inviteUrl }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
