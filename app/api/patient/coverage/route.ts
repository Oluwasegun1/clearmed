import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ERROR_MESSAGES, createErrorResponse } from "@/lib/errors";

/**
 * GET /api/patient/coverage
 * Returns the authenticated patient's coverage plan details including all
 * CoverageRule records (itemised per service) so the patient can see exactly
 * what services are covered, at what percentage, and whether pre-auth is needed.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      );
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
      include: {
        hmo: { select: { id: true, name: true, email: true, phoneNumber: true } },
        coveragePlan: {
          include: {
            coverageRules: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true,
                    code: true,
                    standardPrice: true,
                  },
                },
              },
              orderBy: { service: { category: "asc" } },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PATIENT_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({
      membershipNumber: patient.membershipNumber,
      hmo: patient.hmo,
      coveragePlan: {
        id: patient.coveragePlan.id,
        name: patient.coveragePlan.name,
        description: patient.coveragePlan.description,
        isActive: patient.coveragePlan.isActive,
      },
      coverageStartDate: "2026-01-01T00:00:00.000Z",
      coverageEndDate: "2026-12-31T23:59:59.000Z",
      coveragePercentage: 85,
      annualLimit: 500000,
      coverageRules: patient.coveragePlan.coverageRules.map((rule) => ({
        id: rule.id,
        service: rule.service,
        coveragePercentage: rule.coveragePercentage,
        requiresPreAuth: rule.requiresPreAuth,
        annualLimit: rule.annualLimit,
        waitingPeriod: rule.waitingPeriod,
      })),
    });
  } catch (error: unknown) {
    return createErrorResponse(error, 500, "Failed to fetch coverage");
  }
}
