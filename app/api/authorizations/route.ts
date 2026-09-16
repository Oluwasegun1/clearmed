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
      items,
    } = body;

    let targetPatientId = patientId;

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

    if (!targetPatientId) {
      return NextResponse.json(
        { message: "Patient selection is required" },
        { status: 400 }
      );
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
      diagnosisCode: diagnosisCode || "GENERAL",
      diagnosisNotes: combinedNotes || "Medical Authorization Request",
      items: Array.isArray(items) && items.length > 0 ? items : undefined,
      serviceId: serviceId || undefined,
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
        where.status = { in: ["APPROVED", "AUTO_APPROVED"] };
      } else if (upper === "COMPLETED") {
        where.status = "COMPLETED" as AuthStatus;
      } else if (upper === "PENDING") {
        where.status = "PENDING" as AuthStatus;
      } else if (upper === "REJECTED") {
        where.status = "REJECTED" as AuthStatus;
      } else if (upper === "MORE_INFORMATION_REQUIRED") {
        where.status = "MORE_INFORMATION_REQUIRED" as AuthStatus;
      }
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
                phoneNumber: true,
              },
            },
            coveragePlan: true,
          },
        },
        hospital: true,
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
          include: {
            user: true,
          },
        },
        reviews: {
          orderBy: {
            reviewDate: "desc",
          },
        },
        serviceDelivery: true,
      },
      orderBy: {
        requestDate: "desc",
      },
    });

    // Transform to shape expected by frontend (with v2.0 itemized services)
    const transformed = authRequests.map((r) => {
      // Build itemized services array
      const itemsList =
        r.items && r.items.length > 0
          ? r.items.map((it) => ({
              id: it.id,
              serviceId: it.serviceId,
              name: it.description,
              category: it.category,
              cost: it.cost,
              quantity: it.quantity,
              reason: it.reason,
              status: it.status,
              decisionReason: it.decisionReason,
              reviewedAt: it.reviewedAt?.toISOString() || null,
              reviewerName: it.reviewer?.user
                ? `${it.reviewer.user.firstName} ${it.reviewer.user.lastName}`
                : null,
              fulfilledAt: it.fulfilledAt?.toISOString() || null,
              fulfilledByName: it.fulfilledBy?.user
                ? `${it.fulfilledBy.user.firstName} ${it.fulfilledBy.user.lastName}`
                : null,
            }))
          : r.service
          ? [
              {
                id: r.service.id,
                serviceId: r.service.id,
                name: r.service.name,
                category: r.service.category,
                cost: r.service.standardPrice ?? 0,
                quantity: r.quantity,
                reason: r.diagnosisNotes,
                status: r.serviceDelivery ? "COMPLETED" : r.status,
                decisionReason: r.reviews[0]?.comments || null,
                reviewedAt: r.reviews[0]?.reviewDate?.toISOString() || null,
                reviewerName: null,
                fulfilledAt: null,
                fulfilledByName: null,
              },
            ]
          : [];

      const itemStatuses = itemsList.map((it) => it.status);
      let derivedStatus = r.status as string;
      if (itemStatuses.length > 1) {
        const hasApproved = itemStatuses.some((s) =>
          ["APPROVED", "AUTO_APPROVED", "COMPLETED"].includes(s)
        );
        const hasRejected = itemStatuses.some((s) => s === "REJECTED");
        const hasPending = itemStatuses.some((s) => s === "PENDING");
        if (hasApproved && hasRejected && !hasPending) {
          derivedStatus = "PARTIALLY_APPROVED";
        }
      }

      return {
        id: r.id,
        status: derivedStatus,
        createdAt: r.requestDate.toISOString(),
        authorizationCode: r.authCode ?? "",
        authCode: r.authCode ?? "",
        patient: {
          id: r.patient?.id,
          membershipNumber: r.patient?.membershipNumber,
          coveragePlan: r.patient?.coveragePlan,
          user: {
            firstName: r.patient?.user?.firstName || "",
            lastName: r.patient?.user?.lastName || "",
            name: r.patient?.user
              ? `${r.patient.user.firstName} ${r.patient.user.lastName}`.trim()
              : "Unknown",
            email: r.patient?.user?.email || "",
            phoneNumber: r.patient?.user?.phoneNumber || "",
          },
        },
        hospital: {
          id: r.hospital?.id,
          name: r.hospital?.name ?? "Unknown Hospital",
          city: r.hospital?.city,
          state: r.hospital?.state,
        },
        diagnosis: r.diagnosisNotes ?? r.diagnosisCode ?? "",
        diagnosisCode: r.diagnosisCode ?? "",
        diagnosisNotes: r.diagnosisNotes ?? "",
        quantity: r.quantity,
        services: itemsList,
        items: itemsList,
        requestedBy: {
          position: r.requestedBy?.position,
          user: {
            firstName: r.requestedBy?.user?.firstName || "",
            lastName: r.requestedBy?.user?.lastName || "",
          },
        },
        reviews: r.reviews.map((rev) => ({
          id: rev.id,
          decision: rev.decision,
          comments: rev.comments,
          reviewDate: rev.reviewDate.toISOString(),
        })),
        reviewedAt: r.reviews[0]?.reviewDate?.toISOString() ?? null,
      };
    });

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
