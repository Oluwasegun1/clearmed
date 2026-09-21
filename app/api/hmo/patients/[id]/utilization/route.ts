/**
 * GET /api/hmo/patients/[id]/utilization
 * ClearMed Section 12.1 & 28 — Patient Coverage Utilization Tracking
 * Formula: Annual Limit − Used Amount (COMPLETED only) = Remaining Coverage
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: patientId } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        hmo: {
          select: { id: true, name: true, logoUrl: true, licenseNumber: true },
        },
        coveragePlan: {
          select: {
            id: true,
            name: true,
            description: true,
            annualLimit: true,
            coveragePercent: true,
            resetCadence: true,
            includedServices: true,
            excludedServices: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Permission check: HMO staff/admin must belong to same HMO, or user is SYSTEM_ADMIN
    if (
      session.user.role === "HMO_ADMIN" ||
      session.user.role === "HMO_STAFF"
    ) {
      const hmoStaff = await prisma.hMOStaff.findUnique({
        where: { userId: session.user.id },
      });
      if (hmoStaff?.hmoId !== patient.hmoId) {
        return NextResponse.json({ error: "Forbidden: Patient belongs to another HMO" }, { status: 403 });
      }
    } else if (session.user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all requests with items and service delivery
    const requests = await prisma.authorizationRequest.findMany({
      where: { patientId },
      include: {
        service: { select: { id: true, name: true, code: true, standardPrice: true, category: true } },
        hospital: { select: { id: true, name: true, city: true } },
        items: true,
        serviceDelivery: true,
      },
      orderBy: { requestDate: "desc" },
    });

    const annualLimit = patient.coveragePlan?.annualLimit ?? 1000000;
    const coveragePercent = patient.coveragePlan?.coveragePercent ?? 80;
    const coverageRate = coveragePercent / 100;

    let usedAmount = 0;
    let reservedAmount = 0;
    const completedServices: Array<{
      id: string;
      authCode: string | null;
      description: string;
      hospitalName: string;
      completedAt: string | null;
      totalCost: number;
      hmoPayable: number;
      patientResponsibility: number;
    }> = [];

    for (const req of requests) {
      if (req.items && req.items.length > 0) {
        for (const item of req.items) {
          const cost = item.actualCost ?? item.cost;
          const hmoPayable = Math.round(cost * coverageRate);
          const patientResponsibility = cost - hmoPayable;

          if (item.status === "COMPLETED") {
            usedAmount += hmoPayable;
            completedServices.push({
              id: item.id,
              authCode: req.authCode,
              description: item.description,
              hospitalName: req.hospital.name,
              completedAt: item.fulfilledAt ? item.fulfilledAt.toISOString() : null,
              totalCost: cost,
              hmoPayable,
              patientResponsibility,
            });
          } else if (["APPROVED", "AUTO_APPROVED"].includes(item.status)) {
            reservedAmount += hmoPayable;
          }
        }
      } else {
        const cost = req.serviceDelivery?.actualCost ?? ((req.service?.standardPrice ?? 5000) * req.quantity);
        const hmoPayable = Math.round(cost * coverageRate);
        const patientResponsibility = cost - hmoPayable;

        if (req.serviceDelivery || req.status === "COMPLETED") {
          usedAmount += hmoPayable;
          completedServices.push({
            id: req.id,
            authCode: req.authCode,
            description: req.service?.name ?? "Consultation / Treatment",
            hospitalName: req.hospital.name,
            completedAt: req.serviceDelivery?.deliveryDate ? req.serviceDelivery.deliveryDate.toISOString() : null,
            totalCost: cost,
            hmoPayable,
            patientResponsibility,
          });
        } else if (["APPROVED", "AUTO_APPROVED"].includes(req.status)) {
          reservedAmount += hmoPayable;
        }
      }
    }

    const remainingCoverage = Math.max(0, annualLimit - usedAmount);
    const utilizationPercentage = annualLimit > 0 ? Math.round((usedAmount / annualLimit) * 100) : 0;

    return NextResponse.json({
      patient: {
        id: patient.id,
        name: `${patient.user.firstName} ${patient.user.lastName}`,
        email: patient.user.email,
        phoneNumber: patient.user.phoneNumber,
        membershipNumber: patient.membershipNumber,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth.toISOString(),
      },
      coveragePlan: patient.coveragePlan,
      hmo: patient.hmo,
      utilization: {
        annualLimit,
        usedAmount,
        reservedAmount,
        remainingCoverage,
        utilizationPercentage,
        resetCadence: patient.coveragePlan?.resetCadence ?? "ANNUAL",
        rule: "Only COMPLETED services contribute to Used Amount (Section 12.1)",
      },
      completedServices,
      totalRequestsCount: requests.length,
    });
  } catch (error) {
    console.error("[patient-utilization] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch patient utilization" }, { status: 500 });
  }
}
