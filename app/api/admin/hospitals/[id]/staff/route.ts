/**
 * GET   /api/admin/hospitals/[id]/staff — List staff members for a hospital
 * POST  /api/admin/hospitals/[id]/staff — Add a hospital administrator / staff member
 * PATCH /api/admin/hospitals/[id]/staff — Toggle staff user isActive or update details
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
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

    const staff = await prisma.hospitalStaff.findMany({
      where: { hospitalId: id },
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
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("[hospital-staff] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
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

    const { id: hospitalId } = await params;
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role = "HOSPITAL_ADMIN",
      position = "Hospital Administrator",
      specialization,
      departmentId,
      staffId,
    } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    // Validate staffId uniqueness if provided, or generate one
    const generatedStaffId =
      staffId?.trim() ||
      `HS-${hospital.licenseNumber.replace(/[^A-Za-z0-9]/g, "").slice(0, 4)}-${Date.now().toString().slice(-4)}`;

    const existingStaff = await prisma.hospitalStaff.findUnique({
      where: { staffId: generatedStaffId },
    });
    if (existingStaff) {
      return NextResponse.json(
        { error: "Staff ID already exists. Please provide a unique staff ID." },
        { status: 409 }
      );
    }

    // Hash password or default temporary password
    const rawPassword = password?.trim() || "ClearMed@2026!";
    const hashedPassword = await hashPassword(rawPassword);

    // Validate permitted role
    const validRoles = ["HOSPITAL_ADMIN", "DOCTOR", "PHARMACY", "LAB"];
    const targetRole = validRoles.includes(role) ? role : "HOSPITAL_ADMIN";

    // Create User and HospitalStaff record in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber?.trim() || null,
          role: targetRole,
          isActive: true,
        },
      });

      const newStaff = await tx.hospitalStaff.create({
        data: {
          userId: newUser.id,
          hospitalId,
          staffId: generatedStaffId,
          position: position.trim(),
          specialization: specialization?.trim() || null,
          departmentId: departmentId || null,
        },
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
      });

      return newStaff;
    });

    await prisma.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "CREATE",
        entityType: "HospitalStaff",
        entityId: result.id,
        details: `Created hospital staff/administrator "${firstName} ${lastName}" (${targetRole}) for hospital "${hospital.name}"`,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[hospital-staff] POST error:", error);
    return NextResponse.json({ error: "Failed to add staff member" }, { status: 500 });
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

    const { id: hospitalId } = await params;
    const body = await req.json();
    const { staffRecordId, userId, isActive, position, specialization, departmentId, role } = body;

    if (!staffRecordId && !userId) {
      return NextResponse.json(
        { error: "staffRecordId or userId is required" },
        { status: 400 }
      );
    }

    const staffMember = await prisma.hospitalStaff.findFirst({
      where: staffRecordId
        ? { id: staffRecordId, hospitalId }
        : { userId, hospitalId },
      include: { user: true },
    });

    if (!staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (typeof isActive === "boolean" || role) {
      await prisma.user.update({
        where: { id: staffMember.userId },
        data: {
          ...(typeof isActive === "boolean" ? { isActive } : {}),
          ...(role ? { role } : {}),
        },
      });
    }

    if (position !== undefined || specialization !== undefined || departmentId !== undefined) {
      await prisma.hospitalStaff.update({
        where: { id: staffMember.id },
        data: {
          ...(position !== undefined ? { position: position.trim() } : {}),
          ...(specialization !== undefined ? { specialization: specialization?.trim() || null } : {}),
          ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "UPDATE",
        entityType: "HospitalStaff",
        entityId: staffMember.id,
        details: `Updated hospital staff "${staffMember.user.firstName} ${staffMember.user.lastName}" status/details for hospital ${hospitalId}`,
      },
    });

    const updated = await prisma.hospitalStaff.findUnique({
      where: { id: staffMember.id },
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
            createdAt: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[hospital-staff] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}
