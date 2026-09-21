import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "Only patients can access this endpoint" },
        { status: 403 },
      );
    }

    const userId = session.user.id;

    const patient = await prisma.patient.findFirst({
      where: { userId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
        },
        hmo: { select: { id: true, name: true } },
        coveragePlan: {
          select: {
            id: true,
            name: true,
            description: true,
            annualLimit: true,
            coveragePercent: true,
            resetCadence: true,
            includedServices: true,
            excludedServices: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Fetch all requests with items & service delivery
    const allRequests = await prisma.authorizationRequest.findMany({
      where: { patientId: patient.id },
      include: {
        service: { select: { name: true, standardPrice: true, category: true } },
        hospital: { select: { name: true } },
        items: true,
        serviceDelivery: true,
      },
      orderBy: { requestDate: "desc" },
    });

    const coveragePercentage = patient.coveragePlan?.coveragePercent ?? 85;
    const coverageRate = coveragePercentage / 100;
    const annualLimit = patient.coveragePlan?.annualLimit ?? 500000;

    // Coverage calculation, in order:
    // • Service Cost — submitted cost per service
    // • HMO Payable per Service = Service Cost × Coverage Percentage (85%)
    // • Patient Responsibility per Service = Service Cost − HMO Payable
    // • Used Amount: increments by HMO Payable ONLY when reaching COMPLETED status
    // • Reserved Amount: HMO Payable for APPROVED / AUTO_APPROVED services not yet completed
    let usedAmount = 0;
    let reservedAmount = 0;

    for (const req of allRequests) {
      if (req.items && req.items.length > 0) {
        for (const it of req.items) {
          const itCost = it.cost;
          const hmoPayable = Math.round(itCost * coverageRate);

          if (it.status === "COMPLETED") {
            usedAmount += hmoPayable;
          } else if (["APPROVED", "AUTO_APPROVED"].includes(it.status)) {
            reservedAmount += hmoPayable;
          }
        }
      } else {
        const serviceCost = (req.service?.standardPrice ?? 5000) * req.quantity;
        const hmoPayable = Math.round(serviceCost * coverageRate);

        if (req.serviceDelivery || req.status === "COMPLETED") {
          usedAmount += hmoPayable;
        } else if (["APPROVED", "AUTO_APPROVED"].includes(req.status)) {
          reservedAmount += hmoPayable;
        }
      }
    }

    // Remaining Coverage = Annual Limit - Used Amount (sum of completed services only)
    const remainingCoverage = Math.max(0, annualLimit - usedAmount);

    const authorizationCounts = {
      pending: allRequests.filter((r) => r.status === "PENDING").length,
      approved: allRequests.filter((r) => ["APPROVED", "AUTO_APPROVED"].includes(r.status)).length,
      rejected: allRequests.filter((r) => r.status === "REJECTED").length,
      completed: allRequests.filter((r) => r.status === "COMPLETED" || !!r.serviceDelivery).length,
      total: allRequests.length,
    };

    const recentAuthorizations = allRequests.slice(0, 5).map((r) => {
      const itemsList = r.items && r.items.length > 0 ? r.items : [];
      const serviceCost =
        itemsList.length > 0
          ? itemsList.reduce((acc, it) => acc + it.cost, 0)
          : (r.service?.standardPrice ?? 5000) * r.quantity;

      const hmoPayable = Math.round(serviceCost * coverageRate);
      const patientResponsibility = serviceCost - hmoPayable;

      return {
        id: r.id,
        authCode: r.authCode ?? "",
        status: r.status,
        rawStatus: r.status,
        requestDate: r.requestDate.toISOString(),
        quantity: r.quantity,
        serviceCost,
        hmoPayable,
        patientResponsibility,
        service: r.service,
        items: itemsList,
        hospital: r.hospital,
        hasServiceDelivery: !!r.serviceDelivery || r.status === "COMPLETED",
      };
    });

    const responseData = {
      id: patient.id,
      membershipNumber: patient.membershipNumber,
      coverageStartDate: "2026-01-01T00:00:00.000Z",
      coverageEndDate: "2026-12-31T23:59:59.000Z",
      coveragePercentage,
      annualLimit,
      usedAmount,
      reservedAmount,
      remainingCoverage,
      authorizationCounts,
      user: {
        ...patient.user,
        name: `${patient.user.firstName} ${patient.user.lastName}`.trim(),
      },
      hmo: patient.hmo,
      coveragePlan: patient.coveragePlan,
      recentAuthorizations,
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("Error fetching patient profile:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch patient profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "Only patients can update this profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, phoneNumber } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(firstName ? { firstName: firstName.trim() } : {}),
        ...(lastName ? { lastName: lastName.trim() } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber: phoneNumber ? phoneNumber.trim() : null } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PATIENT_UPDATED",
        entityType: "Patient",
        entityId: session.user.id,
        details: `Patient profile updated by user (${updatedUser.email})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error updating patient profile:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
