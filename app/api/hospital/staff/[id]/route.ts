/**
 * /api/hospital/staff/[id]
 * Section 20. Hospital Staff Management Item Operations (PATCH, DELETE)
 *
 * Rules:
 * - Hospital administrators manage staff belonging strictly to their hospital.
 * - Permitted hospital roles: DOCTOR, HOSPITAL_ADMIN, PHARMACY, LAB.
 * - Hospital administrators MUST NOT manage system administrators or users belonging to other organizations.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/enums/UserRole";

const ALLOWED_HOSPITAL_ROLES: UserRole[] = [
  UserRole.DOCTOR,
  UserRole.HOSPITAL_ADMIN,
  UserRole.PHARMACY,
  UserRole.LAB,
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const staff = await prisma.hospitalStaff.findUnique({
      where: { id },
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
        department: true,
        hospital: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error: unknown) {
    console.error("Error fetching staff member:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch staff member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerRole = session.user.role as UserRole;
    if (callerRole !== UserRole.HOSPITAL_ADMIN && callerRole !== UserRole.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Only Hospital Administrators can update staff records." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // 1. Fetch target staff and verify existence
    const targetStaff = await prisma.hospitalStaff.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!targetStaff) {
      return NextResponse.json({ error: "Hospital staff member not found." }, { status: 404 });
    }

    // 2. Strict Security: Verify caller belongs to the same hospital
    if (callerRole !== UserRole.SYSTEM_ADMIN) {
      const callerStaff = await prisma.hospitalStaff.findFirst({
        where: { userId: session.user.id },
      });

      if (!callerStaff || callerStaff.hospitalId !== targetStaff.hospitalId) {
        return NextResponse.json(
          { error: "Access denied. You cannot manage staff from other hospitals or organizations." },
          { status: 403 }
        );
      }
    }

    // 3. Strict Security: Cannot modify system administrators or HMO personnel
    if (
      targetStaff.user.role === UserRole.SYSTEM_ADMIN ||
      targetStaff.user.role === UserRole.HMO_ADMIN ||
      targetStaff.user.role === UserRole.HMO_STAFF
    ) {
      return NextResponse.json(
        { error: "Access denied. Hospital administrators cannot manage system or HMO accounts." },
        { status: 403 }
      );
    }

    const {
      firstName,
      lastName,
      phoneNumber,
      role,
      position,
      departmentId,
      specialization,
      isActive,
    } = body;

    // Validate role if changing
    if (role && !ALLOWED_HOSPITAL_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        {
          error: `Invalid role '${role}'. Hospital administrators may only assign roles: DOCTOR, HOSPITAL_ADMIN, PHARMACY, or LAB.`,
        },
        { status: 400 }
      );
    }

    // Verify department if provided
    let validDepartmentId = targetStaff.departmentId;
    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === "") {
        validDepartmentId = null;
      } else {
        const dept = await prisma.department.findFirst({
          where: { id: departmentId, hospitalId: targetStaff.hospitalId },
        });
        if (dept) {
          validDepartmentId = dept.id;
        }
      }
    }

    // Execute updates
    const updatedStaff = await prisma.$transaction(async (tx) => {
      if (
        firstName !== undefined ||
        lastName !== undefined ||
        phoneNumber !== undefined ||
        role !== undefined ||
        isActive !== undefined
      ) {
        await tx.user.update({
          where: { id: targetStaff.userId },
          data: {
            ...(firstName ? { firstName: firstName.trim() } : {}),
            ...(lastName ? { lastName: lastName.trim() } : {}),
            ...(phoneNumber !== undefined ? { phoneNumber: phoneNumber?.trim() || null } : {}),
            ...(role ? { role: role as UserRole } : {}),
            ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          },
        });
      }

      const staffRecord = await tx.hospitalStaff.update({
        where: { id },
        data: {
          ...(position !== undefined ? { position: position.trim() } : {}),
          ...(specialization !== undefined ? { specialization: specialization?.trim() || null } : {}),
          departmentId: validDepartmentId,
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

      return staffRecord;
    });

    return NextResponse.json({
      id: updatedStaff.id,
      userId: updatedStaff.user.id,
      name: `${updatedStaff.user.firstName} ${updatedStaff.user.lastName}`.trim(),
      firstName: updatedStaff.user.firstName,
      lastName: updatedStaff.user.lastName,
      email: updatedStaff.user.email,
      phoneNumber: updatedStaff.user.phoneNumber,
      role: updatedStaff.user.role,
      status: updatedStaff.user.isActive ? "ACTIVE" : "INACTIVE",
      isActive: updatedStaff.user.isActive,
      dateCreated: updatedStaff.user.createdAt.toISOString(),
      staffId: updatedStaff.staffId,
      position: updatedStaff.position,
      specialization: updatedStaff.specialization,
      department: updatedStaff.department,
      hospital: updatedStaff.hospital,
      message: "Staff member updated successfully.",
    });
  } catch (error: unknown) {
    console.error("Error updating hospital staff:", error);
    const message = error instanceof Error ? error.message : "Failed to update hospital staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerRole = session.user.role as UserRole;
    if (callerRole !== UserRole.HOSPITAL_ADMIN && callerRole !== UserRole.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Only Hospital Administrators can deactivate staff." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const targetStaff = await prisma.hospitalStaff.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!targetStaff) {
      return NextResponse.json({ error: "Hospital staff member not found." }, { status: 404 });
    }

    if (callerRole !== UserRole.SYSTEM_ADMIN) {
      const callerStaff = await prisma.hospitalStaff.findFirst({
        where: { userId: session.user.id },
      });

      if (!callerStaff || callerStaff.hospitalId !== targetStaff.hospitalId) {
        return NextResponse.json(
          { error: "Access denied. You cannot deactivate staff from other organizations." },
          { status: 403 }
        );
      }
    }

    if (targetStaff.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot deactivate or remove your own administrator account." },
        { status: 400 }
      );
    }

    // Soft-deactivate user account
    await prisma.user.update({
      where: { id: targetStaff.userId },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Staff member account deactivated successfully.",
    });
  } catch (error: unknown) {
    console.error("Error deactivating staff member:", error);
    const message = error instanceof Error ? error.message : "Failed to deactivate staff member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
