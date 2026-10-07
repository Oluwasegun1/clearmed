/**
 * GET /api/hospital/lab/authorizations
 *
 * Returns approved AuthorizationItems tagged as Laboratory / Lab Test
 * for the authenticated LAB user's hospital.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as string;
    if (role !== "LAB") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Resolve hospitalId
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
      if (membership) hospitalId = membership.orgId;
    }

    if (!hospitalId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? "APPROVED";

    // Lab-tagged categories (case-insensitive and catalog variants)
    const labCategories = [
      "Laboratory",
      "Lab Test",
      "LABORATORY",
      "Lab",
      "Diagnostic",
      "Test",
      "Pathology",
    ];

    const items = await prisma.authorizationItem.findMany({
      where: {
        status:
          statusFilter === "ALL"
            ? undefined
            : statusFilter === "APPROVED"
            ? { in: ["APPROVED", "AUTO_APPROVED"] }
            : (statusFilter as "COMPLETED"),
        category: { in: labCategories },
        authRequest: {
          hospitalId,
        },
      },
      include: {
        service: true,
        fulfilledBy: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        authRequest: {
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
                hmo: { select: { name: true } },
                coveragePlan: { select: { name: true } },
              },
            },
            dependent: true,
            requestedBy: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = items.map((item) => {
      const req = item.authRequest;
      const patient = req.patient;
      const patientName = patient?.user
        ? `${patient.user.firstName} ${patient.user.lastName}`.trim()
        : req.dependent
          ? `${req.dependent.firstName} ${req.dependent.lastName}`.trim()
          : "Unknown Patient";

      return {
        id: item.id,
        authRequestId: req.id,
        authCode: req.authCode ?? "",
        requestDate: req.requestDate.toISOString(),
        // Service / item details
        serviceName: item.description,
        serviceCode: item.service?.code ?? null,
        category: item.category,
        cost: item.cost,
        quantity: item.quantity,
        reason: item.reason ?? null,
        status: item.status,
        decisionReason: item.decisionReason ?? null,
        fulfillmentNotes: item.fulfillmentNotes ?? null,
        fulfilledAt: item.fulfilledAt?.toISOString() ?? null,
        fulfilledByName: item.fulfilledBy?.user
          ? `${item.fulfilledBy.user.firstName} ${item.fulfilledBy.user.lastName}`
          : null,
        // Bound patient info
        patientName,
        patientEmail: patient?.user?.email ?? "",
        patientPhone: patient?.user?.phoneNumber ?? "",
        membershipNumber: patient?.membershipNumber ?? "",
        hmoName: patient?.hmo?.name ?? "N/A",
        planName: patient?.coveragePlan?.name ?? "N/A",
        diagnosisCode: req.diagnosisCode ?? "",
        diagnosisNotes: req.diagnosisNotes ?? "",
        requestedByName: req.requestedBy?.user
          ? `${req.requestedBy.user.firstName} ${req.requestedBy.user.lastName}`
          : "N/A",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[lab/authorizations] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab authorizations" },
      { status: 500 }
    );
  }
}
