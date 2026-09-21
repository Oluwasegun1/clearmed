import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ERROR_MESSAGES, createErrorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH_UNAUTHORIZED },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    let hmoId: string | null = null;

    if (userRole === "HMO_STAFF" || userRole === "HMO_ADMIN") {
      const staff = await prisma.hMOStaff.findFirst({
        where: { userId: session.user.id },
      });
      if (staff) {
        hmoId = staff.hmoId;
      }
    }

    // Fallback if system admin or testing
    if (!hmoId) {
      const fallbackHmo = await prisma.hMO.findFirst();
      hmoId = fallbackHmo?.id ?? null;
    }

    if (!hmoId) {
      return NextResponse.json({
        totalEnrolledPatients: 0,
        pendingAuthorizations: 0,
        approvedAuthorizations: 0,
        rejectedAuthorizations: 0,
        completedAuthorizations: 0,
        coverageUtilization: {
          totalPoolLimit: 0,
          usedAmount: 0,
          reservedAmount: 0,
          remainingPool: 0,
          utilizationPercentage: 0,
        },
        queue: [],
      });
    }

    const hmo = await prisma.hMO.findUnique({
      where: { id: hmoId },
      include: {
        patients: {
          include: {
            user: true,
            coveragePlan: true,
          },
        },
      },
    });

    const totalEnrolledPatients = hmo?.patients.length || 0;

    // Fetch all authorization requests for this HMO's enrolled patients
    const authRequests = await prisma.authorizationRequest.findMany({
      where: {
        patient: { hmoId },
      },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            coveragePlan: true,
          },
        },
        hospital: { select: { id: true, name: true, city: true, state: true } },
        service: true,
        items: {
          include: {
            service: true,
            reviewer: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          orderBy: { reviewDate: "desc" },
          take: 1,
        },
        serviceDelivery: true,
      },
      orderBy: { requestDate: "desc" },
    });

    // Service-level counts
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let completedCount = 0;
    let moreInfoCount = 0;

    let totalUsedAmount = 0;
    let totalReservedAmount = 0;
    const coverageRate = 0.85; // 85% HMO payable

    // Flatten into service-level queue items
    const serviceQueue: Array<{
      id: string; // item id
      requestId: string;
      authCode: string;
      patientId: string;
      patientName: string;
      membershipNumber: string;
      planName: string;
      hospitalId: string;
      hospitalName: string;
      serviceName: string;
      category: string;
      cost: number;
      hmoPayable: number;
      patientCoPay: number;
      quantity: number;
      reason: string;
      requestDate: string;
      status: string;
      decisionReason: string | null;
      reviewerName: string | null;
      reviewedAt: string | null;
    }> = [];

    for (const req of authRequests) {
      const patientName = req.patient?.user
        ? `${req.patient.user.firstName} ${req.patient.user.lastName}`.trim()
        : "Unknown Patient";
      const membershipNumber = req.patient?.membershipNumber || "—";
      const planName = req.patient?.coveragePlan?.name || "Standard Plan";
      const hospitalName = req.hospital?.name || "Unknown Hospital";

      if (req.items && req.items.length > 0) {
        for (const item of req.items) {
          const itemCost = item.cost || 0;
          const hmoPayable = Math.round(itemCost * coverageRate);
          const patientCoPay = itemCost - hmoPayable;

          if (item.status === "PENDING") pendingCount++;
          else if (item.status === "APPROVED" || item.status === "AUTO_APPROVED") approvedCount++;
          else if (item.status === "REJECTED") rejectedCount++;
          else if (item.status === "COMPLETED") completedCount++;
          else if (item.status === "MORE_INFORMATION_REQUIRED") moreInfoCount++;

          if (item.status === "COMPLETED") {
            totalUsedAmount += hmoPayable;
          } else if (item.status === "APPROVED" || item.status === "AUTO_APPROVED") {
            totalReservedAmount += hmoPayable;
          }

          serviceQueue.push({
            id: item.id,
            requestId: req.id,
            authCode: req.authCode || "",
            patientId: req.patientId || "",
            patientName,
            membershipNumber,
            planName,
            hospitalId: req.hospitalId,
            hospitalName,
            serviceName: item.description || item.service?.name || "Medical Service",
            category: item.category || item.service?.category || "General",
            cost: itemCost,
            hmoPayable,
            patientCoPay,
            quantity: item.quantity || 1,
            reason: item.reason || req.diagnosisNotes || "Clinical treatment",
            requestDate: req.requestDate.toISOString(),
            status: item.status,
            decisionReason: item.decisionReason || null,
            reviewerName: item.reviewer?.user
              ? `${item.reviewer.user.firstName} ${item.reviewer.user.lastName}`
              : null,
            reviewedAt: item.reviewedAt?.toISOString() || null,
          });
        }
      } else {
        const itemCost = (req.service?.standardPrice || 5000) * req.quantity;
        const hmoPayable = Math.round(itemCost * coverageRate);
        const patientCoPay = itemCost - hmoPayable;
        const itemStatus = req.serviceDelivery ? "COMPLETED" : req.status;

        if (itemStatus === "PENDING") pendingCount++;
        else if (itemStatus === "APPROVED" || itemStatus === "AUTO_APPROVED") approvedCount++;
        else if (itemStatus === "REJECTED") rejectedCount++;
        else if (itemStatus === "COMPLETED") completedCount++;
        else if (itemStatus === "MORE_INFORMATION_REQUIRED") moreInfoCount++;

        if (itemStatus === "COMPLETED") {
          totalUsedAmount += hmoPayable;
        } else if (itemStatus === "APPROVED" || itemStatus === "AUTO_APPROVED") {
          totalReservedAmount += hmoPayable;
        }

        serviceQueue.push({
          id: req.id,
          requestId: req.id,
          authCode: req.authCode || "",
          patientId: req.patientId || "",
          patientName,
          membershipNumber,
          planName,
          hospitalId: req.hospitalId,
          hospitalName,
          serviceName: req.service?.name || "General Consultation",
          category: req.service?.category || "Consultation",
          cost: itemCost,
          hmoPayable,
          patientCoPay,
          quantity: req.quantity || 1,
          reason: req.diagnosisNotes || "Clinical treatment",
          requestDate: req.requestDate.toISOString(),
          status: itemStatus,
          decisionReason: req.reviews[0]?.comments || null,
          reviewerName: null,
          reviewedAt: req.reviews[0]?.reviewDate?.toISOString() || null,
        });
      }
    }

    const defaultAnnualLimitPerPatient = 500000;
    const totalPoolLimit = totalEnrolledPatients * defaultAnnualLimitPerPatient;
    const remainingPool = Math.max(0, totalPoolLimit - totalUsedAmount);
    const utilizationPercentage =
      totalPoolLimit > 0 ? Number(((totalUsedAmount / totalPoolLimit) * 100).toFixed(1)) : 0;

    // Top network hospitals by authorization volume
    const hospitalMap = new Map<string, { name: string; city: string; count: number; totalAmount: number }>();
    for (const item of serviceQueue) {
      const existing = hospitalMap.get(item.hospitalId) || {
        name: item.hospitalName,
        city: "",
        count: 0,
        totalAmount: 0,
      };
      existing.count += 1;
      existing.totalAmount += item.cost;
      hospitalMap.set(item.hospitalId, existing);
    }

    const topHospitals = Array.from(hospitalMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      hmoName: hmo?.name || "ClearMed HMO",
      totalEnrolledPatients,
      pendingAuthorizations: pendingCount,
      approvedAuthorizations: approvedCount,
      rejectedAuthorizations: rejectedCount,
      completedAuthorizations: completedCount,
      moreInfoAuthorizations: moreInfoCount,
      coverageUtilization: {
        totalPoolLimit,
        usedAmount: totalUsedAmount,
        reservedAmount: totalReservedAmount,
        remainingPool,
        utilizationPercentage,
      },
      topHospitals,
      queue: serviceQueue,
    });
  } catch (error: unknown) {
    return createErrorResponse(error, 500, "Error fetching HMO dashboard");
  }
}
