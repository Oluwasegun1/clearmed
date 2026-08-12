/**
 * GET /api/me/org
 * Returns the current user's orgId and orgType from their OrgMembership or HospitalStaff/HMOStaff.
 * Used by settings pages to know which org to manage.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Try OrgMembership first
    const membership = await prisma.orgMembership.findFirst({
      where: { userId: session.user.id, isActive: true },
    });
    if (membership) {
      return NextResponse.json({ orgId: membership.orgId, orgType: membership.orgType });
    }

    // Fallback: HospitalStaff
    const hosp = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
      select: { hospitalId: true },
    });
    if (hosp) return NextResponse.json({ orgId: hosp.hospitalId, orgType: "HOSPITAL" });

    // Fallback: HMOStaff
    const hmo = await prisma.hMOStaff.findFirst({
      where: { userId: session.user.id },
      select: { hmoId: true },
    });
    if (hmo) return NextResponse.json({ orgId: hmo.hmoId, orgType: "HMO" });

    return NextResponse.json({ error: "No org found" }, { status: 404 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
