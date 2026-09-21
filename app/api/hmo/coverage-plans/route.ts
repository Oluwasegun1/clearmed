/**
 * GET   /api/hmo/coverage-plans — List plans for the current logged-in HMO staff/admin
 * POST  /api/hmo/coverage-plans — Create a new plan for the current HMO (HMO_ADMIN role)
 * PATCH /api/hmo/coverage-plans — Update/toggle plan for current HMO
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let hmoId: string | null = null;
    if (session.user.role === "HMO_ADMIN" || session.user.role === "HMO_STAFF") {
      const staff = await prisma.hMOStaff.findUnique({
        where: { userId: session.user.id },
      });
      hmoId = staff?.hmoId ?? null;
    }

    if (!hmoId) {
      return NextResponse.json({ error: "HMO affiliation not found" }, { status: 403 });
    }

    const plans = await prisma.coveragePlan.findMany({
      where: { hmoId },
      include: {
        _count: { select: { patients: true, coverageRules: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("[hmo/coverage-plans] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch coverage plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "HMO_ADMIN" && session.user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Only HMO Administrators can create coverage plans" }, { status: 403 });
    }

    const staff = await prisma.hMOStaff.findUnique({
      where: { userId: session.user.id },
    });
    if (!staff?.hmoId) {
      return NextResponse.json({ error: "HMO affiliation not found" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      annualLimit,
      coveragePercent,
      includedServices,
      excludedServices,
      resetCadence = "ANNUAL",
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    let incStr: string | null = null;
    if (Array.isArray(includedServices)) {
      incStr = JSON.stringify(includedServices);
    } else if (typeof includedServices === "string" && includedServices.trim()) {
      try {
        const parsed = JSON.parse(includedServices);
        incStr = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([includedServices.trim()]);
      } catch {
        incStr = JSON.stringify(includedServices.split(",").map((s) => s.trim()).filter(Boolean));
      }
    }

    let excStr: string | null = null;
    if (Array.isArray(excludedServices)) {
      excStr = JSON.stringify(excludedServices);
    } else if (typeof excludedServices === "string" && excludedServices.trim()) {
      try {
        const parsed = JSON.parse(excludedServices);
        excStr = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([excludedServices.trim()]);
      } catch {
        excStr = JSON.stringify(excludedServices.split(",").map((s) => s.trim()).filter(Boolean));
      }
    }

    const plan = await prisma.coveragePlan.create({
      data: {
        hmoId: staff.hmoId,
        name: name.trim(),
        description: description?.trim() ?? null,
        annualLimit: annualLimit !== undefined && annualLimit !== null ? Number(annualLimit) : null,
        coveragePercent: coveragePercent !== undefined && coveragePercent !== null ? Number(coveragePercent) : null,
        includedServices: incStr,
        excludedServices: excStr,
        resetCadence: resetCadence?.trim() || "ANNUAL",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "CoveragePlan",
        entityId: plan.id,
        details: `Coverage plan "${plan.name}" created by HMO Admin`,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("[hmo/coverage-plans] POST error:", error);
    return NextResponse.json({ error: "Failed to create coverage plan" }, { status: 500 });
  }
}
