import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "Only patients can access this endpoint" },
        { status: 403 },
      );
    }

    const userId = session.user.id;

    const patient = await prisma.patient.findFirst({
      where: { userId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        hmo: { select: { id: true, name: true } },
        coveragePlan: { select: { id: true, name: true, description: true } },
        authRequests: {
          select: {
            id: true,
            status: true,
            requestDate: true,
            quantity: true,
            service: { select: { name: true, standardPrice: true } },
            hospital: { select: { name: true } },
          },
          orderBy: { requestDate: "desc" },
          take: 5,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const usedAmount = patient.authRequests
      .filter((request) => ["APPROVED", "AUTO_APPROVED"].includes(request.status))
      .reduce(
        (total, request) =>
          total + request.service.standardPrice * request.quantity,
        0
      );

    const responseData = {
      id: patient.id,
      membershipNumber: patient.membershipNumber,
      coverageStartDate: "2026-01-01T00:00:00.000Z",
      coverageEndDate: "2026-12-31T23:59:59.000Z",
      coveragePercentage: 85,
      annualLimit: 500000,
      usedAmount,
      user: patient.user,
      hmo: patient.hmo,
      coveragePlan: patient.coveragePlan,
      recentAuthorizations: patient.authRequests,
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("Error fetching patient profile:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch patient profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
