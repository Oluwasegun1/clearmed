import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const hmos = await prisma.hMO.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        email: true,
        phoneNumber: true,
        licenseNumber: true,
        isActive: true,
        createdAt: true,
        _count: { select: { staff: true, coveragePlans: true, patients: true } },
      },
    });

    return NextResponse.json(hmos);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch HMOs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, address, city, state, phoneNumber, email, licenseNumber } = body;

    if (!name || !address || !city || !state || !phoneNumber || !email || !licenseNumber) {
      return NextResponse.json(
        { error: "All fields are required: name, address, city, state, phoneNumber, email, licenseNumber" },
        { status: 400 }
      );
    }

    // Check for duplicate licence
    const existing = await prisma.hMO.findUnique({ where: { licenseNumber } });
    if (existing) {
      return NextResponse.json(
        { error: "An HMO with this licence number already exists" },
        { status: 409 }
      );
    }

    const hmo = await prisma.hMO.create({
      data: { name, address, city, state, phoneNumber, email, licenseNumber },
    });

    // Auto-create a default coverage plan for the new HMO
    await prisma.coveragePlan.create({
      data: {
        hmoId: hmo.id,
        name: "Standard Care Plan",
        description: "Default coverage plan — update details in HMO settings",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "HMO",
        entityId: hmo.id,
        details: `HMO "${name}" created by admin`,
      },
    });

    return NextResponse.json(hmo, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create HMO";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
