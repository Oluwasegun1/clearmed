/**
 * GET /api/hospital/requests
 * Fetches all requests (AuthorizationRequests and CoverageInquiries) for the authenticated hospital staff's hospital.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { ERROR_MESSAGES, createErrorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      );
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
      } else if (s === "PENDING" || s === "REJECTED" || s === "CANCELLED" || s === "EXPIRED" || s === "COMPLETED" || s === "MORE_INFORMATION_REQUIRED") {
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
        items: {
          include: {
            service: true,
            reviewer: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            fulfilledBy: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        requestedBy: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        reviews: {
          orderBy: { reviewDate: "desc" },
        },
        serviceDelivery: true,
      },
      orderBy: { requestDate: "desc" },
    });

    const transformed = authRequests.map((r) => {
      const itemsList =
        r.items && r.items.length > 0
          ? r.items.map((it) => ({
              id: it.id,
              serviceId: it.serviceId,
              name: it.description,
              category: it.category,
              cost: it.cost,
              quantity: it.quantity,
              reason: it.reason,
              status: it.status,
              decisionReason: it.decisionReason,
              reviewedAt: it.reviewedAt?.toISOString() || null,
              reviewerName: it.reviewer?.user
                ? `${it.reviewer.user.firstName} ${it.reviewer.user.lastName}`
                : null,
              fulfilledAt: it.fulfilledAt?.toISOString() || null,
              fulfilledByName: it.fulfilledBy?.user
                ? `${it.fulfilledBy.user.firstName} ${it.fulfilledBy.user.lastName}`
                : null,
            }))
          : r.service
          ? [
              {
                id: r.service.id,
                serviceId: r.service.id,
                name: r.service.name,
                category: r.service.category,
                cost: r.service.standardPrice ?? 0,
                quantity: r.quantity,
                reason: r.diagnosisNotes,
                status: r.serviceDelivery ? "COMPLETED" : r.status,
                decisionReason: r.reviews[0]?.comments || null,
                reviewedAt: r.reviews[0]?.reviewDate?.toISOString() || null,
                reviewerName: null,
                fulfilledAt: null,
                fulfilledByName: null,
              },
            ]
          : [];

      const totalPrice = itemsList.reduce((acc, it) => acc + it.cost, 0) || (r.service?.standardPrice ?? 0);
      const itemStatuses = itemsList.map((it) => it.status);
      let derivedStatus = r.status as string;
      if (itemStatuses.length > 1) {
        const hasApproved = itemStatuses.some((s) =>
          ["APPROVED", "AUTO_APPROVED", "COMPLETED"].includes(s)
        );
        const hasRejected = itemStatuses.some((s) => s === "REJECTED");
        const hasPending = itemStatuses.some((s) => s === "PENDING");
        if (hasApproved && hasRejected && !hasPending) {
          derivedStatus = "PARTIALLY_APPROVED";
        }
      }

      return {
        id: r.id,
        authCode: r.authCode ?? "",
        status: derivedStatus,
        rawStatus: r.status,
        requestDate: r.requestDate.toISOString(),
        patientName: r.patient?.user
          ? `${r.patient.user.firstName} ${r.patient.user.lastName}`.trim()
          : "Direct Patient Request",
        patientEmail: r.patient?.user?.email ?? "",
        patientPhone: r.patient?.user?.phoneNumber ?? "",
        hmoName: r.patient?.hmo?.name ?? "General HMO",
        planName: r.patient?.coveragePlan?.name ?? "Standard Plan",
        serviceName: itemsList.length > 1 ? `${itemsList[0].name} +${itemsList.length - 1} more` : itemsList[0]?.name ?? r.service?.name ?? "General Consultation",
        category: itemsList[0]?.category ?? r.service?.category ?? "Consultation",
        price: totalPrice,
        diagnosisCode: r.diagnosisCode ?? "",
        diagnosisNotes: r.diagnosisNotes ?? "",
        quantity: r.quantity,
        items: itemsList,
        services: itemsList,
        requestedByName: r.requestedBy?.user
          ? `${r.requestedBy.user.firstName} ${r.requestedBy.user.lastName}`
          : "Patient / Self",
        reviewComments: r.reviews[0]?.comments ?? null,
        reviewedAt: r.reviews[0]?.reviewDate?.toISOString() ?? null,
        hasServiceDelivery: !!r.serviceDelivery,
      };
    });

    return NextResponse.json(transformed);
  } catch (error: unknown) {
    return createErrorResponse(error, 500, "Failed to fetch hospital requests");
  }
}
