/**
 * GET /api/hospital/requests
 * Fetches all requests (AuthorizationRequests and CoverageInquiries) for the authenticated hospital staff's hospital.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve hospitalId for the current user
    let hospitalId: string | null = null;

    const staff = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
    });
    if (staff) {
      hospitalId = staff.hospitalId;
    } else {
      const membership = await prisma.orgMembership.findFirst({
        where: { userId: session.user.id, orgType: "HOSPITAL", isActive: true },
      });
      if (membership) {
        hospitalId = membership.orgId;
      }
    }

    if (!hospitalId) {
      // Fallback: pick first hospital if dev/testing
      const fallbackHosp = await prisma.hospital.findFirst();
      hospitalId = fallbackHosp?.id ?? null;
    }

    if (!hospitalId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: Record<string, unknown> = { hospitalId };

    if (statusFilter && statusFilter.toUpperCase() !== "ALL") {
      const s = statusFilter.toUpperCase();
      if (s === "APPROVED") {
        where.status = { in: ["APPROVED", "AUTO_APPROVED"] };
      } else if (s === "PENDING" || s === "REJECTED" || s === "CANCELLED" || s === "EXPIRED") {
        where.status = s;
      }
    }

    const authRequests = await prisma.authorizationRequest.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
            hmo: {
              select: {
                name: true,
              },
            },
            coveragePlan: {
              select: {
                name: true,
              },
            },
          },
        },
        hospital: {
          select: { name: true },
        },
        service: true,
        requestedBy: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        reviews: {
          orderBy: { reviewDate: "desc" },
          take: 1,
        },
        serviceDelivery: true,
      },
      orderBy: { requestDate: "desc" },
    });

    const transformed = authRequests.map((r) => ({
      id: r.id,
      authCode: r.authCode ?? "",
      status: r.serviceDelivery ? "COMPLETED" : r.status,
      rawStatus: r.status,
      requestDate: r.requestDate.toISOString(),
      patientName: r.patient?.user
        ? `${r.patient.user.firstName} ${r.patient.user.lastName}`.trim()
        : "Direct Patient Request",
      patientEmail: r.patient?.user?.email ?? "",
      patientPhone: r.patient?.user?.phoneNumber ?? "",
      hmoName: r.patient?.hmo?.name ?? "General HMO",
      planName: r.patient?.coveragePlan?.name ?? "Standard Plan",
      serviceName: r.service?.name ?? "General Consultation",
      category: r.service?.category ?? "Consultation",
      price: r.service?.standardPrice ?? 0,
      diagnosisCode: r.diagnosisCode ?? "",
      diagnosisNotes: r.diagnosisNotes ?? "",
      quantity: r.quantity,
      requestedByName: r.requestedBy?.user
        ? `${r.requestedBy.user.firstName} ${r.requestedBy.user.lastName}`
        : "Patient / Self",
      reviewComments: r.reviews[0]?.comments ?? null,
      reviewedAt: r.reviews[0]?.reviewDate?.toISOString() ?? null,
      hasServiceDelivery: !!r.serviceDelivery,
    }));

    return NextResponse.json(transformed);
  } catch (error: unknown) {
    console.error("Error fetching hospital requests:", error);
    return NextResponse.json({ error: "Failed to fetch hospital requests" }, { status: 500 });
  }
}
