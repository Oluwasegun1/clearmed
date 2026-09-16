import { NextRequest, NextResponse } from "next/server";
import { AuthorizationService } from "@/lib/services/authorization-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole } from "@/lib/enums/UserRole";
import { AuthStatus } from "@/lib/enums/AuthStatus";
import { prisma } from "@/lib/prisma";

const authService = new AuthorizationService();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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

    const { id: requestId, itemId } = await context.params;
    const body = await request.json();
    const { decision, comments } = body;

    if (!decision) {
      return NextResponse.json(
        { message: "Decision is required (APPROVED, REJECTED, or MORE_INFORMATION_REQUIRED)" },
        { status: 400 }
      );
    }

    if ((decision === "REJECTED" || decision === "MORE_INFORMATION_REQUIRED") && !comments?.trim()) {
      return NextResponse.json(
        {
          message:
            decision === "REJECTED"
              ? "A reason is required when rejecting a service"
              : "A specific explanation is required when requesting additional information",
        },
        { status: 400 }
      );
    }

    let reviewerStaffId = session.user.id;

    if (userRole === "HMO_STAFF" || userRole === "HMO_ADMIN") {
      const staff = await prisma.hMOStaff.findFirst({
        where: { userId: session.user.id },
      });

      if (!staff) {
        return NextResponse.json(
          { message: "HMO staff record not found for user" },
          { status: 404 }
        );
      }
      reviewerStaffId = staff.id;

      // Verify HMO ownership
      const authRequest = await prisma.authorizationRequest.findUnique({
        where: { id: requestId },
        include: { patient: true },
      });

      if (!authRequest) {
        return NextResponse.json(
          { message: "Authorization request not found" },
          { status: 404 }
        );
      }

      if (authRequest.patient && authRequest.patient.hmoId !== staff.hmoId) {
        return NextResponse.json(
          { message: "You can only review requests for your HMO" },
          { status: 403 }
        );
      }
    }

    const updatedItem = await authService.reviewAuthorizationItem({
      itemId,
      reviewedById: reviewerStaffId,
      decision: decision as AuthStatus,
      comments,
    });

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: unknown) {
    console.error("Error reviewing authorization service item:", error);
    let message = "Error reviewing authorization item";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
