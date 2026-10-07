/**
 * GET /api/hospital/patients
 * Enforces Section 8.3 Binding Relationship Rule:
 * A Doctor or Hospital Staff may only access patient information where a binding
 * relationship exists (i.e. the patient has an active or historical authorization request
 * at that doctor's hospital) or by exact Membership Number verification.
 * General patient lookup across ClearMed is strictly prohibited.
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

    const userRole = session.user.role;
    const allowedRoles = ["DOCTOR", "HOSPITAL_ADMIN", "PHARMACY", "LAB", "SYSTEM_ADMIN"];

    if (!allowedRoles.includes(userRole)) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UNAUTHORIZED_ACCESS_ATTEMPT",
          entityType: "Patient",
          entityId: "HOSPITAL_PATIENTS",
          details: `Role ${userRole} attempted unauthorized access to hospital patient registry (Section 8.3 violation)`,
        },
      });
      return NextResponse.json(
        { error: "Only hospital personnel can access this endpoint" },
        { status: 403 }
      );
    }

    // Resolve hospital for this user
    let hospitalId: string | null = null;
    const staff = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (staff) {
      hospitalId = staff.hospitalId;
    } else {
      const fallbackHosp = await prisma.hospital.findFirst();
      hospitalId = fallbackHosp?.id ?? null;
    }

    if (!hospitalId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const membershipQuery = searchParams.get("membershipNumber");

    // Exact membership number lookup for patient presenting HMO card at the hospital
    if (membershipQuery) {
      const exactPatient = await prisma.patient.findFirst({
        where: {
          membershipNumber: membershipQuery.trim(),
        },
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
            select: { id: true, name: true },
          },
          coveragePlan: {
            select: { id: true, name: true },
          },
        },
      });

      if (!exactPatient) {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "UNAUTHORIZED_ACCESS_ATTEMPT",
            entityType: "Patient",
            entityId: membershipQuery.trim(),
            details: `Failed patient lookup with unverified membership number: ${membershipQuery.trim()} (Section 8.3 binding check)`,
          },
        });
        return NextResponse.json(
          { error: "No patient found matching that exact membership number" },
          { status: 404 }
        );
      }

      return NextResponse.json([
        {
          id: exactPatient.id,
          name: `${exactPatient.user.firstName} ${exactPatient.user.lastName}`.trim(),
          email: exactPatient.user.email,
          phoneNumber: exactPatient.user.phoneNumber,
          membershipNumber: exactPatient.membershipNumber,
          hmoName: exactPatient.hmo?.name ?? "General HMO",
          planName: exactPatient.coveragePlan?.name ?? "Standard Plan",
          bindingType: "VERIFIED_MEMBERSHIP",
        },
      ]);
    }

    // Otherwise, fetch ONLY patients with active or historical authorization requests at this hospital
    const hospitalRequests = await prisma.authorizationRequest.findMany({
      where: { hospitalId },
      select: {
        patientId: true,
        patient: {
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
              select: { id: true, name: true },
            },
            coveragePlan: {
              select: { id: true, name: true },
            },
          },
        },
      },
      distinct: ["patientId"],
    });

    const boundPatients = hospitalRequests
      .filter((r): r is typeof r & { patient: NonNullable<typeof r.patient> & { user: NonNullable<NonNullable<typeof r.patient>['user']> } } => 
        Boolean(r.patient && r.patient.user)
      )
      .map((r) => ({
        id: r.patient.id,
        name: `${r.patient.user.firstName} ${r.patient.user.lastName}`.trim(),
        email: r.patient.user.email,
        phoneNumber: r.patient.user.phoneNumber,
        membershipNumber: r.patient.membershipNumber,
        hmoName: r.patient.hmo?.name ?? "General HMO",
        planName: r.patient.coveragePlan?.name ?? "Standard Plan",
        bindingType: "HOSPITAL_HISTORY",
      }));

    return NextResponse.json(boundPatients);
  } catch (error: unknown) {
    console.error("Error fetching hospital patients:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch hospital patients";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
