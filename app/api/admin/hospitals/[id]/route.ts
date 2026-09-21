/**
 * GET   /api/admin/hospitals/[id] — Full hospital record with staff, departments, contracts, counts
 * PATCH /api/admin/hospitals/[id] — Update hospital fields or isActive. SYSTEM_ADMIN only.
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

    const hospital = await prisma.hospital.findUnique({
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
                phoneNumber: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { user: { createdAt: "desc" } },
        },
        departments: {
          include: {
            _count: { select: { staff: true, services: true } },
          },
        },
        hmoContracts: {
          include: {
            hmo: {
              select: { id: true, name: true, logoUrl: true, licenseNumber: true },
            },
          },
        },
        _count: {
          select: { staff: true, departments: true, authRequests: true, hmoContracts: true },
        },
      },
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    return NextResponse.json(hospital);
  } catch (error) {
    console.error("[hospitals/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch hospital" }, { status: 500 });
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

    const allowed = ["name", "address", "city", "state", "phoneNumber", "email", "isActive"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const hospital = await prisma.hospital.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "HOSPITAL_UPDATED",
        entityType: "Hospital",
        entityId: id,
        details: `Hospital "${hospital.name}" updated by admin — fields: ${Object.keys(data).join(", ")}`,
      },
    });

    return NextResponse.json(hospital);
  } catch (error) {
    console.error("[hospitals/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update hospital" }, { status: 500 });
  }
}
