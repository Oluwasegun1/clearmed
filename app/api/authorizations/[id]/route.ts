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
            hmo: true,
            coveragePlan: {
              include: {
                coverageRules: {
                  include: {
                    service: true,
                  },
                },
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
            phoneNumber: true,
            email: true,
          },
        },
        service: true,
        items: {
          include: {
            service: true,
            reviewer: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            fulfilledBy: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
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
          orderBy: { reviewDate: "desc" },
        },
        serviceDelivery: true,
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

    // Fetch previous relevant authorizations for Section 18 review
    let previousAuthorizations: Array<{
      id: string;
      authCode: string | null;
      status: string;
      requestDate: string;
      hospitalName: string;
      serviceSummary: string;
      totalCost: number;
    }> = [];

    if (authorization.patientId) {
      const prev = await prisma.authorizationRequest.findMany({
        where: {
          patientId: authorization.patientId,
          id: { not: authorizationId },
        },
        include: {
          hospital: { select: { name: true } },
          service: true,
          items: true,
        },
        orderBy: { requestDate: "desc" },
        take: 5,
      });

      previousAuthorizations = prev.map((p) => {
        const cost =
          p.items && p.items.length > 0
            ? p.items.reduce((s, it) => s + it.cost, 0)
            : (p.service?.standardPrice || 5000) * p.quantity;

        const summary =
          p.items && p.items.length > 0
            ? p.items.map((it) => it.description).join(", ")
            : p.service?.name || "Medical Service";

        return {
          id: p.id,
          authCode: p.authCode,
          status: p.status,
          requestDate: p.requestDate.toISOString(),
          hospitalName: p.hospital?.name || "Hospital",
          serviceSummary: summary,
          totalCost: cost,
        };
      });
    }

    return NextResponse.json({
      ...authorization,
      previousAuthorizations,
    });
  } catch (error) {
    console.error("Error fetching authorization:", error);
    return NextResponse.json(
      { error: "Failed to fetch authorization details" },
      { status: 500 }
    );
  }
}