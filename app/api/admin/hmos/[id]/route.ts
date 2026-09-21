/**
 * GET  /api/admin/hmos/[id]  — Full HMO record with counts, staff, coverage plans
 * PATCH /api/admin/hmos/[id] — Update editable fields or isActive. SYSTEM_ADMIN only.
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

    const hmo = await prisma.hMO.findUnique({
      where: { id },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
              },
            },
          },
          orderBy: { user: { createdAt: "desc" } },
        },
        coveragePlans: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { patients: true, hospitalContracts: true },
        },
      },
    });

    if (!hmo) {
      return NextResponse.json({ error: "HMO not found" }, { status: 404 });
    }

    return NextResponse.json(hmo);
  } catch (error) {
    console.error("[hmos/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch HMO" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const guard = await requireAdmin(session);
    if (guard) return guard;

    const { id } = await params;
    const body = await req.json();

    const allowed = ["name", "address", "city", "state", "phoneNumber", "email", "logoUrl", "isActive"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const hmo = await prisma.hMO.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "HMO_UPDATED",
        entityType: "HMO",
        entityId: id,
        details: `HMO "${hmo.name}" updated by admin — fields: ${Object.keys(data).join(", ")}`,
      },
    });

    return NextResponse.json(hmo);
  } catch (error) {
    console.error("[hmos/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update HMO" }, { status: 500 });
  }
}
