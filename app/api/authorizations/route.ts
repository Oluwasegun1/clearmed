import { NextRequest, NextResponse } from "next/server";
import { AuthorizationService } from "@/lib/services/authorization-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { AuthStatus } from "@/lib/enums/AuthStatus";

const authService = new AuthorizationService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      dependentId,
      hospitalId,
      serviceId,
      diagnosisCode,
      diagnosisNotes,
      diagnosis,
      services,
      notes,
      quantity,
    } = body;

    let targetPatientId = patientId;
    let targetServiceId = serviceId;

    if (!hospitalId) {
      return NextResponse.json(
        { message: "Hospital selection is required" },
        { status: 400 }
      );
    }

    // Auto-resolve patientId if logged in as PATIENT
    if (!targetPatientId) {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id },
      });
      if (patient) {
        targetPatientId = patient.id;
      }
    }

    // Auto-resolve serviceId if not explicitly provided
    if (!targetServiceId) {
      const defaultService = await prisma.service.findFirst();
      if (defaultService) {
        targetServiceId = defaultService.id;
      } else {
        const newService = await prisma.service.create({
          data: {
            name: "General Consultation & Service",
            category: "Consultation",
            code: "CONS-GENERAL",
            standardPrice: 5000,
          },
        });
        targetServiceId = newService.id;
      }
    }

    // Map diagnosis & services text from patient form
    const combinedNotes = [
      diagnosis ? `Diagnosis: ${diagnosis}` : null,
      services ? `Services: ${services}` : null,
      notes ? `Notes: ${notes}` : null,
      diagnosisNotes,
    ]
      .filter(Boolean)
      .join(" | ");

    // Find hospital staff ID or fallback
    let staff = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staff) {
      staff = await prisma.hospitalStaff.findFirst({
        where: { hospitalId },
      });
    }

    if (!staff) {
      staff = await prisma.hospitalStaff.findFirst();
    }

    if (!staff) {
      return NextResponse.json(
        { message: "No hospital staff record found to process request" },
        { status: 404 }
      );
    }

    const authRequest = await authService.createAuthorizationRequest({
      patientId: targetPatientId,
      dependentId,
      hospitalId,
      requestedById: staff.id,
      serviceId: targetServiceId,
      diagnosisCode: diagnosisCode || "GENERAL",
      diagnosisNotes: combinedNotes || "General Request",
      quantity: quantity ? Number(quantity) : 1,
    });

    return NextResponse.json(authRequest, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating authorization request:", error);
    let message = "Error creating authorization request";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const patientIdFilter = searchParams.get("patientId");
    const hospitalIdFilter = searchParams.get("hospitalId");
    const hmoIdFilter = searchParams.get("hmoId");

    const where: Record<string, unknown> = {};

    if (statusFilter && statusFilter.toUpperCase() !== "ALL") {
      const upper = statusFilter.toUpperCase();
      if (upper === "APPROVED") {
        // Include both manual and auto-approved
        where.status = { in: ["APPROVED", "AUTO_APPROVED"] };
      } else if (upper === "COMPLETED") {
        // "Completed" = approved requests that have had a service delivery recorded
        where.status = { in: ["APPROVED", "AUTO_APPROVED"] };
        where.serviceDelivery = { isNot: null };
      } else if (upper === "PENDING") {
        where.status = "PENDING" as AuthStatus;
      } else if (upper === "REJECTED") {
        where.status = "REJECTED" as AuthStatus;
      }
      // "ALL" and unknown values fall through with no status filter
    }

    if (patientIdFilter) where.patientId = patientIdFilter;
    if (hospitalIdFilter) where.hospitalId = hospitalIdFilter;
    if (hmoIdFilter) {
      where.patient = { hmoId: hmoIdFilter };
    }

    const userRole = session.user.role;

    if (userRole === "PATIENT") {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id },
      });

      if (!patient) {
        return NextResponse.json(
          { message: "Patient record not found" },
          { status: 404 }
        );
      }
      where.patientId = patient.id;
    } else if (
      userRole === "DOCTOR" ||
      userRole === "HOSPITAL_ADMIN" ||
      userRole === "PHARMACY" ||
      userRole === "LAB"
    ) {
      const staff = await prisma.hospitalStaff.findFirst({
        where: { userId: session.user.id },
      });

      if (staff) {
        where.hospitalId = staff.hospitalId;
      }
    } else if (userRole === "HMO_STAFF" || userRole === "HMO_ADMIN") {
      const staff = await prisma.hMOStaff.findFirst({
        where: { userId: session.user.id },
      });

      if (staff) {
        where.patient = { hmoId: staff.hmoId };
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
              },
            },
            coveragePlan: true,
          },
        },
        hospital: true,
        service: true,
        requestedBy: {
          include: {
            user: true,
          },
        },
        reviews: {
          orderBy: {
            reviewDate: "desc",
          },
          take: 1,
        },
        serviceDelivery: true,
      },
      orderBy: {
        requestDate: "desc",
      },
    });

    // Transform to the shape the frontend AuthRequest interface expects
    const transformed = authRequests.map((r) => ({
      id: r.id,
      status: r.serviceDelivery ? "COMPLETED" : r.status,
      createdAt: r.requestDate.toISOString(),
      authorizationCode: r.authCode ?? "",
      patient: {
        user: {
          name: r.patient?.user
            ? `${r.patient.user.firstName} ${r.patient.user.lastName}`.trim()
            : "Unknown",
        },
      },
      hospital: {
        name: r.hospital?.name ?? "Unknown Hospital",
      },
      diagnosis: r.diagnosisNotes ?? r.diagnosisCode ?? "",
      services: r.service
        ? [
            {
              id: r.service.id,
              name: r.service.name,
              cost: r.service.standardPrice ?? 0,
            },
          ]
        : [],
      reviewedAt: r.reviews[0]?.reviewDate?.toISOString() ?? null,
    }));

    return NextResponse.json(transformed);
  } catch (error: unknown) {
    console.error("Error fetching authorization requests:", error);
    let message = "Error fetching authorization requests";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
