import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/hmos
 * Public endpoint to list all active HMO organizations along with their coverage plans
 * for patient registration and directory lookup.
 */
export async function GET() {
  try {
    const hmos = await prisma.hMO.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        city: true,
        state: true,
        email: true,
        phoneNumber: true,
        coveragePlans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            annualLimit: true,
            coveragePercent: true,
            includedServices: true,
            resetCadence: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(hmos);
  } catch (error) {
    console.error("[api/hmos] Error fetching HMOs:", error);
    return NextResponse.json({ error: "Failed to fetch HMOs" }, { status: 500 });
  }
}
