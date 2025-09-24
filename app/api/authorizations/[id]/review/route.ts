import { NextRequest, NextResponse } from "next/server";
import { AuthorizationService } from "@/lib/services/authorization-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/lib/generated/prisma";
import UserRole from "@/lib/generated/prisma/UserRole";
import { AuthStatus } from "@/lib/generated/prisma";

const prisma = new PrismaClient();
const authService = new AuthorizationService();

// Review an authorization request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is HMO staff or admin
    const userRole = session.user.role as UserRole;
    if (
      userRole !== "HMO_STAFF" &&
      userRole !== "HMO_ADMIN" &&
      userRole !== "SYSTEM_ADMIN"
    ) {
      return NextResponse.json(
        { message: "Only HMO staff can review authorization requests" },
        { status: 403 }
      );
    }

    // Get the request ID from the URL
    const requestId = params.id;

    // Parse the request body
    const body = await request.json();
    const { status, notes } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
      );
    }

    // If HMO staff, check if they belong to the correct HMO
    if (userRole === "HMO_STAFF" || userRole === "HMO_ADMIN") {
      const staff = await prisma.hMOStaff.findFirst({
        where: { userId: session.user.id },
      });

      if (!staff) {
        return NextResponse.json(
          { message: "HMO staff record not found" },
          { status: 404 }
        );
      }

      const authRequest = await prisma.authorizationRequest.findUnique({
        where: { id: requestId },
      });

      if (!authRequest) {
        return NextResponse.json(
          { message: "Authorization request not found" },
          { status: 404 }
        );
      }

      // Check if the staff belongs to the HMO that received the request
      if (staff.hmoId !== authRequest.hmoId) {
        return NextResponse.json(
          { message: "You can only review requests for your HMO" },
          { status: 403 }
        );
      }
    }

    // Review the authorization request
    const review = await authService.reviewAuthorizationRequest({
      requestId,
      reviewerId: session.user.id,
      status: status as AuthStatus,
      notes,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    console.error("Error reviewing authorization request:", error);
    let message = "Error reviewing authorization request";

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ message, error }, { status: 500 });
  }
}
