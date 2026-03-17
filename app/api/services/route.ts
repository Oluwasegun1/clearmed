/**
 * GET list of services (e.g. consultations, lab tests, procedures) for use in request forms.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const hospitalId = searchParams.get("hospitalId");

    const where: {
      isActive: boolean;
      category?: string;
      department?: { hospitalId: string };
    } = { isActive: true };
    if (category) where.category = category;
    if (hospitalId) where.department = { hospitalId };

    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        code: true,
        standardPrice: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(services);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch services";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
