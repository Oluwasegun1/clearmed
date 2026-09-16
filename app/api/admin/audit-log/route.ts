import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/audit-log
 * Returns paginated audit log entries. SYSTEM_ADMIN only.
 * Query params:
 *   page     — page number (default 1)
 *   limit    — page size (default 50, max 100)
 *   action   — filter by AuditAction enum value (optional)
 *   userId   — filter by actor user id (optional)
 *   from     — ISO date string start range (optional)
 *   to       — ISO date string end range (optional)
 *   search   — search within details / entityType (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const skip = (page - 1) * limit;

    const actionFilter = searchParams.get("action");
    const userIdFilter = searchParams.get("userId");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const search = searchParams.get("search") ?? "";

    const where: Record<string, unknown> = {};

    if (actionFilter) where.action = actionFilter;
    if (userIdFilter) where.userId = userIdFilter;

    const timestampFilter: Record<string, Date> = {};
    if (fromDate) timestampFilter.gte = new Date(fromDate);
    if (toDate) timestampFilter.lte = new Date(toDate);
    if (Object.keys(timestampFilter).length > 0) where.timestamp = timestampFilter;

    if (search) {
      where.OR = [
        { details: { contains: search } },
        { entityType: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    console.error("Error fetching audit log:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch audit log";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
