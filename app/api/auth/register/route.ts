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
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phoneNumber,
      hmoId,
      membershipNumber: userMembershipNumber,
      coveragePlanId,
      dateOfBirth,
      gender,
      address,
    } = body;

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

    // 4. Validate password policy  
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

    // 6. Check HMO Member ID uniqueness if provided
    const targetMembershipNumber = userMembershipNumber?.trim() || `CM-PAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const existingMember = await prisma.patient.findUnique({
      where: { membershipNumber: targetMembershipNumber },
    });
    if (existingMember) {
      return NextResponse.json(
        { message: `The HMO Member ID "${targetMembershipNumber}" is already registered. Please check your policy ID or contact your HMO.` },
        { status: 409 }
      );
    }

    // 7. Resolve target HMO
    let targetHmo = null;
    if (hmoId) {
      targetHmo = await prisma.hMO.findUnique({ where: { id: hmoId } });
    }
    if (!targetHmo) {
      targetHmo = await prisma.hMO.findFirst({ where: { isActive: true } });
    }
    if (!targetHmo) {
      targetHmo = await prisma.hMO.create({
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

    // 8. Resolve target Coverage Plan
    let targetPlan = null;
    if (coveragePlanId) {
      targetPlan = await prisma.coveragePlan.findFirst({
        where: { id: coveragePlanId, hmoId: targetHmo.id },
      });
    }
    if (!targetPlan) {
      targetPlan = await prisma.coveragePlan.findFirst({
        where: { hmoId: targetHmo.id, isActive: true },
      });
    }
    if (!targetPlan) {
      targetPlan = await prisma.coveragePlan.create({
        data: {
          hmoId: targetHmo.id,
          name: "Standard Care Plan",
          description: "Full primary care & specialist coverage",
          annualLimit: 500000,
          coveragePercent: 85,
        },
      });
    }

    // 9. Securely hash password and create user with PATIENT role
    const user = await registerUser({
      email: email.trim().toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      role: validRole,
    });

    // 10. Create Patient profile
    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : new Date("1995-01-01");
    const validDob = isNaN(parsedDob.getTime()) ? new Date("1995-01-01") : parsedDob;

    await prisma.patient.create({
      data: {
        userId: user.id,
        hmoId: targetHmo.id,
        membershipNumber: targetMembershipNumber,
        coveragePlanId: targetPlan.id,
        dateOfBirth: validDob,
        gender: gender?.trim() || "Prefer not to say",
        address: address?.trim() || "Nigeria",
      },
    });

    // 11. Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_CREATED",
          entityType: "User",
          entityId: user.id,
          details: `Patient account created (${user.email}) under HMO "${targetHmo.name}" with Member ID ${targetMembershipNumber}`,
        },
      });
    } catch {
      // Non-blocking
    }

    // 12. Notify HMO Staff of new enrollment
    try {
      const hmoStaff = await prisma.hMOStaff.findFirst({
        where: { hmoId: targetHmo.id },
      });
      if (hmoStaff) {
        await prisma.notification.create({
          data: {
            userId: hmoStaff.userId,
            type: "COVERAGE_UPDATE",
            title: "New Patient Member Registration",
            message: `${firstName} ${lastName} has registered under ${targetHmo.name} with Member ID ${targetMembershipNumber}.`,
            relatedEntityId: user.id,
            relatedEntityType: "Patient",
          },
        });
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          hmoName: targetHmo.name,
          membershipNumber: targetMembershipNumber,
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

