import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { UserRole } from "@/lib/enums/UserRole";
import { prisma } from "@/lib/prisma";
import { validatePasswordPolicy, isValidEmail } from "@/lib/password-policy";

/**
 * POST /api/auth/register
 * Self-registration is for PATIENT accounts only.
 * Required fields: firstName, lastName, email, phoneNumber, password, confirmPassword.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, confirmPassword, firstName, lastName, phoneNumber } = body;

    // 1. Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      return NextResponse.json(
        { message: "Missing required registration fields. First name, last name, email, phone number, password, and password confirmation are required." },
        { status: 400 }
      );
    }

    // 2. Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Invalid email address format." },
        { status: 400 }
      );
    }

    // 3. Validate password confirmation match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Password confirmation does not match." },
        { status: 400 }
      );
    }

    // 4. Validate password policy (v2.0)
    const passwordValidation = validatePasswordPolicy(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          message: passwordValidation.errors.join(" "),
          errors: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Self-registration is patient-only
    const validRole = UserRole.PATIENT;

    // 5. Prevent duplicate email registration
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    // 6. Securely hash password and create user with PATIENT role
    const user = await registerUser({
      email: email.trim().toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      role: validRole,
    });

    // Attach to a default HMO + Coverage Plan
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

    let plan = await prisma.coveragePlan.findFirst({ where: { hmoId: hmo.id } });
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

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        details: `Patient registered`,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
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
    return NextResponse.json({ message }, { status: 500 });
  }
}

