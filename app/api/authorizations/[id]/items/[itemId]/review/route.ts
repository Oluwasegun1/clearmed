import { NextRequest, NextResponse } from "next/server";
import { AuthorizationService } from "@/lib/services/authorization-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole } from "@/lib/enums/UserRole";
import { AuthStatus } from "@/lib/enums/AuthStatus";
import { prisma } from "@/lib/prisma";
import { ERROR_MESSAGES, createErrorResponse } from "@/lib/errors";

const authService = new AuthorizationService();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      );
    }

    const userRole = session.user.role as UserRole;
    if (
      userRole !== "HMO_STAFF" &&
      userRole !== "HMO_ADMIN" &&
      userRole !== "SYSTEM_ADMIN"
    ) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
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

    let reviewerStaffId: string | null = null;

    let staff = await prisma.hMOStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staff) {
      const orgMem = await prisma.orgMembership.findFirst({
        where: { userId: session.user.id, orgType: "HMO", isActive: true },
      });
      if (orgMem) {
        staff = await prisma.hMOStaff.findFirst({
          where: { hmoId: orgMem.orgId },
        });
      }
    }

    const authRequest = await prisma.authorizationRequest.findUnique({
      where: { id: requestId },
      include: { patient: true },
    });

    if (!authRequest) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTHORIZATION_NOT_FOUND },
        { status: 404 }
      );
    }

    if (!staff) {
      if (userRole === "SYSTEM_ADMIN") {
        if (authRequest.patient?.hmoId) {
          staff = await prisma.hMOStaff.findFirst({
            where: { hmoId: authRequest.patient.hmoId },
          });
        }
        if (!staff) {
          staff = await prisma.hMOStaff.findFirst();
        }
      }
    }

    if (!staff) {
      return NextResponse.json(
        { error: "HMO staff record not found for user" },
        { status: 404 }
      );
    }

    reviewerStaffId = staff.id;

    if (
      userRole !== "SYSTEM_ADMIN" &&
      authRequest.patient &&
      authRequest.patient.hmoId &&
      staff.hmoId &&
      authRequest.patient.hmoId !== staff.hmoId
    ) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 403 }
      );
    }

    const updatedItem = await authService.reviewAuthorizationItem({
      itemId,
      reviewedById: reviewerStaffId,
      decision: decision as AuthStatus,
      comments,
    });

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: unknown) {
    return createErrorResponse(error, 500, "Error reviewing authorization item");
  }
}
