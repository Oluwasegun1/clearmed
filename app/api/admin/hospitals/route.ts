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

    const hospitals = await prisma.hospital.findMany({
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
        _count: { select: { staff: true, departments: true } },
      },
    });

    return NextResponse.json(hospitals);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch hospitals";
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
    const existing = await prisma.hospital.findUnique({ where: { licenseNumber } });
    if (existing) {
      return NextResponse.json(
        { error: "A hospital with this licence number already exists" },
        { status: 409 }
      );
    }

    const hospital = await prisma.hospital.create({
      data: { name, address, city, state, phoneNumber, email, licenseNumber },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Hospital",
        entityId: hospital.id,
        details: `Hospital "${name}" created by admin`,
      },
    });

    return NextResponse.json(hospital, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create hospital";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
