/**
 * GET   /api/admin/hmos/[id]/coverage-plans  — List all coverage plans for an HMO
 * POST  /api/admin/hmos/[id]/coverage-plans  — Create a new coverage plan
 * PATCH /api/admin/hmos/[id]/coverage-plans  — Update/Toggle plan. Body: { planId, name, description, annualLimit, coveragePercent, includedServices, excludedServices, resetCadence, isActive }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SYSTEM_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const guard = await requireAdmin(session);
    if (guard) return guard;

    const { id } = await params;

    const plans = await prisma.coveragePlan.findMany({
      where: { hmoId: id },
      include: {
        _count: { select: { patients: true, coverageRules: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("[coverage-plans] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch coverage plans" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const guard = await requireAdmin(session);
    if (guard) return guard;

    const { id } = await params;
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

    // Format included/excluded services as JSON strings if provided as arrays or strings
    let incStr: string | null = null;
    if (Array.isArray(includedServices)) {
      incStr = JSON.stringify(includedServices);
    } else if (typeof includedServices === "string" && includedServices.trim()) {
      // If comma-separated or json string
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
        hmoId: id,
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
        userId: session!.user.id,
        action: "CREATE",
        entityType: "CoveragePlan",
        entityId: plan.id,
        details: `Coverage plan "${plan.name}" (Limit: ₦${plan.annualLimit ?? "None"}, ${plan.coveragePercent ?? "N/A"}%) created for HMO ${id} by admin`,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("[coverage-plans] POST error:", error);
    return NextResponse.json({ error: "Failed to create coverage plan" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const guard = await requireAdmin(session);
    if (guard) return guard;

    const body = await req.json();
    const {
      planId,
      name,
      description,
      annualLimit,
      coveragePercent,
      includedServices,
      excludedServices,
      resetCadence,
      isActive,
    } = body;

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (annualLimit !== undefined) updateData.annualLimit = annualLimit !== null ? Number(annualLimit) : null;
    if (coveragePercent !== undefined) updateData.coveragePercent = coveragePercent !== null ? Number(coveragePercent) : null;
    if (resetCadence !== undefined) updateData.resetCadence = resetCadence;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    if (includedServices !== undefined) {
      if (Array.isArray(includedServices)) {
        updateData.includedServices = JSON.stringify(includedServices);
      } else if (typeof includedServices === "string") {
        try {
          const parsed = JSON.parse(includedServices);
          updateData.includedServices = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([includedServices.trim()]);
        } catch {
          updateData.includedServices = JSON.stringify(includedServices.split(",").map((s) => s.trim()).filter(Boolean));
        }
      } else {
        updateData.includedServices = null;
      }
    }

    if (excludedServices !== undefined) {
      if (Array.isArray(excludedServices)) {
        updateData.excludedServices = JSON.stringify(excludedServices);
      } else if (typeof excludedServices === "string") {
        try {
          const parsed = JSON.parse(excludedServices);
          updateData.excludedServices = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([excludedServices.trim()]);
        } catch {
          updateData.excludedServices = JSON.stringify(excludedServices.split(",").map((s) => s.trim()).filter(Boolean));
        }
      } else {
        updateData.excludedServices = null;
      }
    }

    const plan = await prisma.coveragePlan.update({
      where: { id: planId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "UPDATE",
        entityType: "CoveragePlan",
        entityId: planId,
        details: `Coverage plan "${plan.name}" updated by admin — fields: ${Object.keys(updateData).join(", ")}`,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("[coverage-plans] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update coverage plan" }, { status: 500 });
  }
}
