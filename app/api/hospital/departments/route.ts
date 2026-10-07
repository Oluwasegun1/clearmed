/**
 * /api/hospital/departments
 * Fetches and creates departments for the current hospital
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve hospitalId
    let hospitalId: string | null = null;
    const staff = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (staff) {
      hospitalId = staff.hospitalId;
    } else {
      const fallbackHosp = await prisma.hospital.findFirst();
      hospitalId = fallbackHosp?.id ?? null;
    }

    if (!hospitalId) {
      return NextResponse.json([]);
    }

    const departments = await prisma.department.findMany({
      where: { hospitalId },
      include: {
        _count: {
          select: { staff: true, services: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(departments);
  } catch (error: unknown) {
    console.error("Error fetching hospital departments:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch departments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let hospitalId: string | null = null;
    const staff = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (staff) {
      hospitalId = staff.hospitalId;
    } else {
      const fallbackHosp = await prisma.hospital.findFirst();
      hospitalId = fallbackHosp?.id ?? null;
    }

    if (!hospitalId) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        hospitalId,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating department:", error);
    const message = error instanceof Error ? error.message : "Failed to create department";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
