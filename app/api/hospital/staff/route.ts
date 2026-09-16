/**
 * /api/hospital/staff
 * Section 20. Hospital Staff Management API
 *
 * Rules:
 * - Hospital administrators manage staff belonging strictly to their hospital.
 * - Permitted hospital roles: DOCTOR, HOSPITAL_ADMIN, PHARMACY, LAB.
 * - Hospital administrators MUST NOT manage system administrators or users belonging to other organizations.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { UserRole } from "@/lib/enums/UserRole";

const ALLOWED_HOSPITAL_ROLES: UserRole[] = [
  UserRole.DOCTOR,
  UserRole.HOSPITAL_ADMIN,
  UserRole.PHARMACY,
  UserRole.LAB,
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerRole = session.user.role as UserRole;
    const allowedCallerRoles: UserRole[] = [
      UserRole.HOSPITAL_ADMIN,
      UserRole.DOCTOR,
      UserRole.PHARMACY,
      UserRole.LAB,
      UserRole.SYSTEM_ADMIN,
    ];

    if (!allowedCallerRoles.includes(callerRole)) {
      return NextResponse.json(
        { error: "Access denied. Only hospital staff or administrators can view staff." },
        { status: 403 }
      );
    }

    // Resolve caller's hospitalId
    let hospitalId: string | null = null;
    const callerStaff = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (callerStaff) {
      hospitalId = callerStaff.hospitalId;
    } else {
      const fallbackHosp = await prisma.hospital.findFirst();
      hospitalId = fallbackHosp?.id ?? null;
    }

    if (!hospitalId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const query = searchParams.get("search")?.toLowerCase();

    // Query hospital staff belonging ONLY to this hospital
    const staffMembers = await prisma.hospitalStaff.findMany({
      where: {
        hospitalId,
        user: {
          role: {
            in: ALLOWED_HOSPITAL_ROLES,
          },
        },
      },
      include: {
        user: {
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
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        user: {
          createdAt: "desc",
        },
      },
    });

    // Transform and apply in-memory filters
    let results = staffMembers.map((sm) => ({
      id: sm.id,
      userId: sm.user.id,
      name: `${sm.user.firstName} ${sm.user.lastName}`.trim(),
      firstName: sm.user.firstName,
      lastName: sm.user.lastName,
      email: sm.user.email,
      phoneNumber: sm.user.phoneNumber,
      role: sm.user.role,
      status: sm.user.isActive ? "ACTIVE" : "INACTIVE",
      isActive: sm.user.isActive,
      dateCreated: sm.user.createdAt.toISOString(),
      createdAt: sm.user.createdAt.toISOString(),
      lastLogin: sm.user.lastLogin?.toISOString() || null,
      staffId: sm.staffId,
      position: sm.position,
      specialization: sm.specialization,
      department: sm.department ? { id: sm.department.id, name: sm.department.name } : null,
      hospital: sm.hospital,
    }));

    if (roleFilter && roleFilter !== "ALL") {
      results = results.filter((s) => s.role === roleFilter);
    }

    if (statusFilter && statusFilter !== "ALL") {
      const activeCheck = statusFilter === "ACTIVE";
      results = results.filter((s) => s.isActive === activeCheck);
    }

    if (query) {
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.staffId.toLowerCase().includes(query) ||
          s.position.toLowerCase().includes(query) ||
          (s.specialization && s.specialization.toLowerCase().includes(query)) ||
          (s.department && s.department.name.toLowerCase().includes(query))
      );
    }

    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error("Error fetching hospital staff:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch hospital staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerRole = session.user.role as UserRole;
    if (callerRole !== UserRole.HOSPITAL_ADMIN && callerRole !== UserRole.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Only Hospital Administrators can add staff members." },
        { status: 403 }
      );
    }

    // Resolve caller's hospitalId
    let hospitalId: string | null = null;
    const callerStaff = await prisma.hospitalStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (callerStaff) {
      hospitalId = callerStaff.hospitalId;
    } else if (callerRole === UserRole.SYSTEM_ADMIN) {
      const fallbackHosp = await prisma.hospital.findFirst();
      hospitalId = fallbackHosp?.id ?? null;
    }

    if (!hospitalId) {
      return NextResponse.json(
        { error: "Hospital not found for current administrator." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      role,
      position,
      departmentId,
      specialization,
      phoneNumber,
      password,
    } = body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !role) {
      return NextResponse.json(
        { error: "First name, last name, email, and role are required." },
        { status: 400 }
      );
    }

    // Strict role validation: Hospital Admin can ONLY create hospital roles
    if (!ALLOWED_HOSPITAL_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        {
          error: `Invalid role '${role}'. Hospital administrators may only create staff with roles: DOCTOR, HOSPITAL_ADMIN, PHARMACY, or LAB.`,
        },
        { status: 400 }
      );
    }

    // Check email existence
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists in the system." },
        { status: 400 }
      );
    }

    // Hash password (default temporary password if none provided)
    const rawPassword = password?.trim() || "ClearMedStaff@2026";
    const hashedPassword = await hashPassword(rawPassword);

    // Generate unique Staff ID (e.g. STF-HOSP-XXXX)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix =
      role === UserRole.DOCTOR
        ? "DOC"
        : role === UserRole.PHARMACY
        ? "PHARM"
        : role === UserRole.LAB
        ? "LAB"
        : "ADM";
    const generatedStaffId = `${prefix}-${randomSuffix}`;

    // Verify departmentId belongs to this hospital if provided
    let validDepartmentId: string | null = null;
    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, hospitalId },
      });
      if (dept) {
        validDepartmentId = dept.id;
      }
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber?.trim() || null,
          role: role as UserRole,
          password: hashedPassword,
          isActive: true,
        },
      });

      const newStaff = await tx.hospitalStaff.create({
        data: {
          userId: newUser.id,
          hospitalId,
          departmentId: validDepartmentId,
          staffId: generatedStaffId,
          position: position?.trim() || `${role.replace("_", " ")} Staff`,
          specialization: specialization?.trim() || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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
          hospital: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newStaff;
    });

    return NextResponse.json(
      {
        id: result.id,
        userId: result.user.id,
        name: `${result.user.firstName} ${result.user.lastName}`.trim(),
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        role: result.user.role,
        status: result.user.isActive ? "ACTIVE" : "INACTIVE",
        isActive: result.user.isActive,
        dateCreated: result.user.createdAt.toISOString(),
        staffId: result.staffId,
        position: result.position,
        specialization: result.specialization,
        department: result.department,
        hospital: result.hospital,
        message: "Hospital staff member created successfully.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating hospital staff member:", error);
    const message = error instanceof Error ? error.message : "Failed to create hospital staff member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
