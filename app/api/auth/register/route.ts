import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import UserRole from "@/lib/generated/prisma/UserRole";
import { hashPassword } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phoneNumber, role } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        role: role as UserRole,
      },
    });

    // Create role-specific profile
    if (role === "PATIENT") {
      // For now, we'll create a placeholder patient record
      // In a real app, we would collect more information during registration
      // or redirect to a profile completion page

      // Find a default HMO for testing purposes
      let defaultHmo = await prisma.hMO.findFirst();

      // If no HMO exists, create one
      if (!defaultHmo) {
        defaultHmo = await prisma.hMO.create({
          data: {
            name: "Default HMO",
            address: "123 Default Street",
            city: "Lagos",
            state: "Lagos",
            phoneNumber: "08012345678",
            email: "contact@defaulthmo.com",
            licenseNumber: "HMO-DEFAULT-001",
          },
        });

        // Create a default coverage plan
        const defaultPlan = await prisma.coveragePlan.create({
          data: {
            hmoId: defaultHmo.id,
            name: "Basic Coverage Plan",
            description: "Default coverage plan for new patients",
          },
        });

        // Create patient record
        await prisma.patient.create({
          data: {
            userId: user.id,
            hmoId: defaultHmo.id,
            membershipNumber: `P-${Math.floor(
              100000 + Math.random() * 900000
            )}`,
            coveragePlanId: defaultPlan.id,
            dateOfBirth: new Date(1990, 0, 1), // Default date of birth
            gender: "Unspecified",
          },
        });
      } else {
        // Find a default coverage plan
        let defaultPlan = await prisma.coveragePlan.findFirst({
          where: { hmoId: defaultHmo.id },
        });

        // If no plan exists, create one
        if (!defaultPlan) {
          defaultPlan = await prisma.coveragePlan.create({
            data: {
              hmoId: defaultHmo.id,
              name: "Basic Coverage Plan",
              description: "Default coverage plan for new patients",
            },
          });
        }

        // Create patient record
        await prisma.patient.create({
          data: {
            userId: user.id,
            hmoId: defaultHmo.id,
            membershipNumber: `P-${Math.floor(
              100000 + Math.random() * 900000
            )}`,
            coveragePlanId: defaultPlan.id,
            dateOfBirth: new Date(1990, 0, 1), // Default date of birth
            gender: "Unspecified",
          },
        });
      }
    } else if (
      role === "DOCTOR" ||
      role === "HOSPITAL_ADMIN" ||
      role === "PHARMACY" ||
      role === "LAB"
    ) {
      // For hospital staff, we'll create a placeholder record
      // Find or create a default hospital
      let defaultHospital = await prisma.hospital.findFirst();

      if (!defaultHospital) {
        defaultHospital = await prisma.hospital.create({
          data: {
            name: "General Hospital",
            address: "456 Hospital Road",
            city: "Lagos",
            state: "Lagos",
            phoneNumber: "08087654321",
            email: "info@generalhospital.com",
            licenseNumber: "HOSP-DEFAULT-001",
          },
        });
      }

      // Create hospital staff record
      await prisma.hospitalStaff.create({
        data: {
          userId: user.id,
          hospitalId: defaultHospital.id,
          staffId: `STAFF-${Math.floor(100000 + Math.random() * 900000)}`,
          position: role,
          specialization: role === "DOCTOR" ? "General Practice" : undefined,
        },
      });
    } else if (role === "HMO_STAFF" || role === "HMO_ADMIN") {
      // For HMO staff, we'll create a placeholder record
      // Find or create a default HMO
      let defaultHmo = await prisma.hMO.findFirst();

      if (!defaultHmo) {
        defaultHmo = await prisma.hMO.create({
          data: {
            name: "Default HMO",
            address: "123 Default Street",
            city: "Lagos",
            state: "Lagos",
            phoneNumber: "08012345678",
            email: "contact@defaulthmo.com",
            licenseNumber: "HMO-DEFAULT-001",
          },
        });
      }

      // Create HMO staff record
      await prisma.hMOStaff.create({
        data: {
          userId: user.id,
          hmoId: defaultHmo.id,
          staffId: `HMO-${Math.floor(100000 + Math.random() * 900000)}`,
          position: role === "HMO_ADMIN" ? "Administrator" : "Claims Officer",
        },
      });
    }

    // Create audit log for registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        details: `New user registered with role: ${role}`,
      },
    });

    // Return success without exposing sensitive user data
    return NextResponse.json(
      {
        message: "User registered successfully",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

    let message = "Error registering user";

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ message, error }, { status: 500 });
  }
}
