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
      quantity,
    } = body;

    if (!hospitalId || !serviceId) {
      return NextResponse.json(
        { message: "Missing required fields (hospitalId, serviceId)" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { message: "Hospital staff record not found to submit request" },
        { status: 404 }
      );
    }

    const authRequest = await authService.createAuthorizationRequest({
      patientId,
      dependentId,
      hospitalId,
      requestedById: staff.id,
      serviceId,
      diagnosisCode,
      diagnosisNotes,
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

    const where: any = {};

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter as AuthStatus;
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
      },
      orderBy: {
        requestDate: "desc",
      },
    });

    return NextResponse.json(authRequests);
  } catch (error: unknown) {
    console.error("Error fetching authorization requests:", error);
    let message = "Error fetching authorization requests";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
