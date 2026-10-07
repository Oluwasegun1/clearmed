import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/hmo/patients — List all enrolled patients under the logged-in HMO
 * PATCH /api/hmo/patients — Update patient enrollment status or coverage plan
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "HMO_ADMIN" && session.user.role !== "HMO_STAFF" && session.user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let hmoId: string | null = null;
    if (session.user.role === "HMO_ADMIN" || session.user.role === "HMO_STAFF") {
      const staff = await prisma.hMOStaff.findUnique({
        where: { userId: session.user.id },
      });
      hmoId = staff?.hmoId ?? null;
    }

    if (!hmoId) {
      return NextResponse.json({ error: "HMO affiliation not found" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const patients = await prisma.patient.findMany({
      where: {
        hmoId,
        ...(search
          ? {
              OR: [
                { membershipNumber: { contains: search } },
                { user: { firstName: { contains: search } } },
                { user: { lastName: { contains: search } } },
                { user: { email: { contains: search } } },
                { user: { phoneNumber: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            isActive: true,
            createdAt: true,
          },
        },
        coveragePlan: {
          select: {
            id: true,
            name: true,
            annualLimit: true,
            coveragePercent: true,
          },
        },
        _count: {
          select: {
            authRequests: true,
            dependents: true,
          },
        },
      },
      orderBy: { user: { createdAt: "desc" } },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("[api/hmo/patients] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch enrolled patients" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "HMO_ADMIN" && session.user.role !== "HMO_STAFF" && session.user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const staff = await prisma.hMOStaff.findUnique({
      where: { userId: session.user.id },
      include: { hmo: true },
    });
    if (!staff?.hmoId) {
      return NextResponse.json({ error: "HMO affiliation not found" }, { status: 403 });
    }

    const body = await req.json();
    const { patientId, coveragePlanId, membershipNumber, action } = body;

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, hmoId: staff.hmoId },
      include: { user: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient record not found under your HMO" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (coveragePlanId) {
      const plan = await prisma.coveragePlan.findFirst({
        where: { id: coveragePlanId, hmoId: staff.hmoId },
      });
      if (plan) {
        updateData.coveragePlanId = plan.id;
      }
    }

    if (membershipNumber && membershipNumber.trim() !== patient.membershipNumber) {
      const dup = await prisma.patient.findUnique({
        where: { membershipNumber: membershipNumber.trim() },
      });
      if (dup && dup.id !== patient.id) {
        return NextResponse.json({ error: "This Member ID is already in use by another member" }, { status: 409 });
      }
      updateData.membershipNumber = membershipNumber.trim();
    }

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: updateData,
      include: {
        user: true,
        coveragePlan: true,
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PATIENT_UPDATED",
          entityType: "Patient",
          entityId: patient.id,
          details: `HMO Staff ${session.user.name || session.user.email} updated patient enrollment for ${patient.user.firstName} ${patient.user.lastName} (Action: ${action || "UPDATE"})`,
        },
      });
    } catch {
      // Non-blocking
    }

    // Send notification to patient
    try {
      await prisma.notification.create({
        data: {
          userId: patient.userId,
          type: "COVERAGE_UPDATE",
          title: "HMO Enrollment Update",
          message: `Your health coverage under ${staff.hmo.name} has been verified and updated. Member ID: ${updated.membershipNumber}.`,
          relatedEntityId: patient.id,
          relatedEntityType: "Patient",
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[api/hmo/patients] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
