import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { UserRole } from "@/lib/enums/UserRole";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phoneNumber, role } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: "Missing required registration fields" },
        { status: 400 }
      );
    }

    const validRole = (role as UserRole) || UserRole.PATIENT;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const user = await registerUser({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role: validRole,
    });

    // If registered as PATIENT, attach a default HMO & Coverage Plan if needed
    if (validRole === "PATIENT") {
      let hmo = await prisma.hMO.findFirst();
      if (!hmo) {
        hmo = await prisma.hMO.create({
          data: {
            name: "ClearMed Primary Health",
            address: "1 Medical Way",
            city: "Lagos",
            state: "Lagos",
            phoneNumber: "+2348000000000",
            email: "info@clearmed.health",
            licenseNumber: "HMO-001",
          },
        });
      }

      let plan = await prisma.coveragePlan.findFirst({
        where: { hmoId: hmo.id },
      });
      if (!plan) {
        plan = await prisma.coveragePlan.create({
          data: {
            hmoId: hmo.id,
            name: "Standard Care Plan",
            description: "Full primary care & specialist coverage",
          },
        });
      }

      const membershipNumber = `CM-PAT-${Math.floor(100000 + Math.random() * 900000)}`;

      await prisma.patient.create({
        data: {
          userId: user.id,
          hmoId: hmo.id,
          membershipNumber,
          coveragePlanId: plan.id,
          dateOfBirth: new Date("1995-01-01"),
          gender: "Prefer not to say",
          address: "Lagos, Nigeria",
        },
      });
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        details: `User registered with role ${validRole}`,
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
