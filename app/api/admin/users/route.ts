import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users
 * Returns all user accounts. SYSTEM_ADMIN only.
 * Query params:
 *   role    — filter by UserRole (optional)
 *   page    — page number (default 1)
 *   limit   — page size (default 50)
 *   search  — search by name / email
 *
 * PATCH /api/admin/users
 * Body (activate/soft-deactivate): { userId, isActive: boolean }
 * Body (role change):               { userId, role: string }
 */

const VALID_ROLES = [
  "PATIENT",
  "DOCTOR",
  "HOSPITAL_ADMIN",
  "PHARMACY",
  "LAB",
  "HMO_STAFF",
  "HMO_ADMIN",
  "SYSTEM_ADMIN",
];

async function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const guard = await requireAdmin(session);
    if (guard) return guard;

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";

    const where: Record<string, unknown> = {};
    if (roleFilter) where.role = roleFilter;
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          mfaEnabled: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    const guard = await requireAdmin(session);
    if (guard) return guard;

    const body = await req.json();
    const { userId, isActive, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // ── Role change ────────────────────────────────────────────────────────────
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      if (userId === session!.user.id) {
        return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
      }

      const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!target) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: role as never },
        select: { id: true, email: true, role: true, isActive: true },
      });

      await prisma.auditLog.create({
        data: {
          userId: session!.user.id,
          action: "USER_UPDATED",
          entityType: "User",
          entityId: userId,
          details: `Role changed from ${target.role} to ${role} by admin`,
        },
      });

      return NextResponse.json(updatedUser);
    }

    // ── Activate / soft-deactivate ────────────────────────────────────────────
    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Either isActive (boolean) or role (string) is required" },
        { status: 400 },
      );
    }

    if (userId === session!.user.id && !isActive) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "USER_UPDATED",
        entityType: "User",
        entityId: userId,
        details: `User account ${isActive ? "activated" : "deactivated/soft-deleted"} by admin`,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
