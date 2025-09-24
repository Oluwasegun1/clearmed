import { NextRequest, NextResponse } from "next/server";
import { AuthorizationService } from "@/lib/services/authorization-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import { PrismaClient } from "@/lib/generated/prisma";
import UserRole from "@/lib/generated/prisma/UserRole";

// const prisma = new PrismaClient();
const authService = new AuthorizationService();

// Record service delivery
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is hospital staff
    const userRole = session.user.role as UserRole;
    if (
      userRole !== "DOCTOR" &&
      userRole !== "HOSPITAL_ADMIN" &&
      userRole !== "PHARMACY" &&
      userRole !== "LAB" &&
      userRole !== "SYSTEM_ADMIN"
    ) {
      return NextResponse.json(
        { message: "Only hospital staff can record service delivery" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { authorizationCode, serviceId } = body;

    // Validate required fields
    if (!authorizationCode || !serviceId) {
      return NextResponse.json(
        { message: "Authorization code and service ID are required" },
        { status: 400 }
      );
    }

    // Record the service delivery
    const serviceDelivery = await authService.recordServiceDelivery(
      authorizationCode,
      serviceId,
      session.user.id
    );

    return NextResponse.json(serviceDelivery, { status: 201 });
  } catch (error: unknown) {
    console.error("Error recording service delivery:", error);
    let message = "Error recording service delivery";

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ message, error }, { status: 500 });
  }
}
