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
        { status: 403 }
      );
    }

    const userId = session.user.id;

    const patient = await prisma.patient.findFirst({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        hmo: { select: { id: true, name: true, logo: true } },
        coveragePlan: { select: { id: true, name: true, description: true } },
        authorizationRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            services: true,
            hospital: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Calculate usedAmount from APPROVED/COMPLETED services
    let usedAmount = 0;
    patient.authorizationRequests
      .filter((req) => ["APPROVED", "COMPLETED"].includes(req.status))
      .forEach((req) => {
        if (Array.isArray(req.services)) {
          req.services.forEach((service: { cost?: number }) => {
            if (service?.cost) {
              usedAmount += service.cost;
            }
          });
        }
      });

    const responseData = {
      id: patient.id,
      membershipNumber: patient.membershipNumber,
      coverageStartDate: patient.coverageStartDate,
      coverageEndDate: patient.coverageEndDate,
      coveragePercentage: patient.coveragePercentage,
      annualLimit: patient.annualLimit,
      usedAmount,
      user: patient.user,
      hmo: patient.hmo,
      coveragePlan: patient.coveragePlan,
      recentAuthorizations: patient.authorizationRequests,
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("Error fetching patient profile:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch patient profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
