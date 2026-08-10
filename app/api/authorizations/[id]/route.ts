import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: authorizationId } = await context.params;

    if (!authorizationId) {
      return NextResponse.json(
        { error: "Authorization ID is required" },
        { status: 400 }
      );
    }

    const authorization = await prisma.authorizationRequest.findUnique({
      where: {
        id: authorizationId,
      },
      include: {
        patient: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        service: true,
        requestedBy: {
          select: {
            id: true,
            position: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        reviews: {
          include: {
            reviewedBy: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!authorization) {
      return NextResponse.json(
        { error: "Authorization request not found" },
        { status: 404 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole === "PATIENT" && authorization.patient?.user?.id !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to view this authorization" },
        { status: 403 }
      );
    }

    return NextResponse.json(authorization);
  } catch (error) {
    console.error("Error fetching authorization:", error);
    return NextResponse.json(
      { error: "Failed to fetch authorization details" },
      { status: 500 }
    );
  }
}