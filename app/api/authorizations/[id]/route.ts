import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorizationId = params.id;
    
    if (!authorizationId) {
      return NextResponse.json({ error: "Authorization ID is required" }, { status: 400 });
    }

    // Get the authorization request with related data
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
                name: true,
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
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!authorization) {
      return NextResponse.json({ error: "Authorization request not found" }, { status: 404 });
    }

    // Check if the user has permission to view this authorization
    const userId = session.user.id;
    const userRole = session.user.role;

    // Patients can only view their own authorizations
    if (userRole === "PATIENT" && authorization.patient?.user?.id !== userId) {
      return NextResponse.json({ error: "You don't have permission to view this authorization" }, { status: 403 });
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