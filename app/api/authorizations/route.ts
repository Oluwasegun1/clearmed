import { NextRequest, NextResponse } from "next/server";
import { AuthorizationService } from "@/lib/services/authorization-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

const authService = new AuthorizationService();

// Create a new authorization request
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { patientId, hospitalId, serviceIds, diagnosis, notes } = body;

    // Validate required fields
    if (!patientId || !hospitalId || !serviceIds || !diagnosis) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the authorization request
    const authRequest = await authService.createAuthorizationRequest({
      patientId,
      hospitalId,
      requestedBy: session.user.id,
      serviceIds,
      diagnosis,
      notes,
    });

    return NextResponse.json(authRequest, { status: 201 });
  } catch (error: unknown) {
    console.error("Error reviewing authorization request:", error);
    let message = "Error reviewing authorization request";

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ message, error }, { status: 500 });
  }
}

// Get all authorization requests
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const hospitalId = searchParams.get("hospitalId");
    const hmoId = searchParams.get("hmoId");

    // Build the query based on the user's role and filters
    const query: Record<string, string> = {};

    // Apply filters if provided
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    if (hospitalId) query.hospitalId = hospitalId;
    if (hmoId) query.hmoId = hmoId;

    // Role-based access control
    const userRole = session.user.role;

    if (userRole === "PATIENT") {
      // Patients can only see their own requests
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id },
      });

      if (!patient) {
        return NextResponse.json(
          { message: "Patient record not found" },
          { status: 404 }
        );
      }

      query.patientId = patient.id;
    } else if (
      userRole === "DOCTOR" ||
      userRole === "HOSPITAL_ADMIN" ||
      userRole === "PHARMACY" ||
      userRole === "LAB"
    ) {
      // Hospital staff can only see requests for their hospital
      const staff = await prisma.hospitalStaff.findFirst({
        where: { userId: session.user.id },
      });

      if (!staff) {
        return NextResponse.json(
          { message: "Hospital staff record not found" },
          { status: 404 }
        );
      }

      query.hospitalId = staff.hospitalId;
    } else if (userRole === "HMO_STAFF" || userRole === "HMO_ADMIN") {
      // HMO staff can only see requests for their HMO
      const staff = await prisma.hMOStaff.findFirst({
        where: { userId: session.user.id },
      });

      if (!staff) {
        return NextResponse.json(
          { message: "HMO staff record not found" },
          { status: 404 }
        );
      }

      query.hmoId = staff.hmoId;
    }
    // System admins can see all requests (no additional filters)

    // Get the authorization requests
    const authRequests = await prisma.authorizationRequest.findMany({
      where: query,
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
          },
        },
        hospital: true,
        services: {
          include: {
            service: true,
          },
        },
        reviews: {
          orderBy: {
            reviewDate: "desc",
            id: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(authRequests);
  } catch (error: unknown) {
    console.error("Error reviewing authorization request:", error);
    let message = "Error reviewing authorization request";

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ message, error }, { status: 500 });
  }
}
