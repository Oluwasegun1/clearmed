/**
 * GET /api/admin/stats
 *
 * Returns aggregate statistics for the System Admin dashboard.
 * Access restricted to SYSTEM_ADMIN.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user.role as string) !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsers,
      totalPatients,
      totalHospitals,
      totalHMOs,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.hospital.count(),
      prisma.hMO.count(),
      prisma.authorizationRequest.count(),
      prisma.authorizationRequest.count({ where: { status: "PENDING" } }),
      prisma.authorizationRequest.count({
        where: { status: { in: ["APPROVED", "AUTO_APPROVED"] } },
      }),
      prisma.authorizationRequest.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalPatients,
      totalHospitals,
      totalHMOs,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    });
  } catch (error) {
    console.error("[admin/stats] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
