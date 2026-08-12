/**
 * POST /api/org/signup
 * Creates an organisation (Hospital or HMO) + the first Admin user in one atomic operation.
 * Seeds default OrgRoles, creates HospitalStaff/HMOStaff, and creates an Admin OrgMembership.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/lib/auth";
import { DEFAULT_HOSPITAL_ROLES, DEFAULT_HMO_ROLES } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orgType,           // "HOSPITAL" | "HMO"
      orgName,
      address,
      city,
      state,
      phoneNumber,
      orgEmail,
      licenseNumber,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
    } = body;

    if (!orgType || !orgName || !address || !city || !state || !phoneNumber
      || !orgEmail || !licenseNumber || !adminFirstName || !adminLastName
      || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (orgType !== "HOSPITAL" && orgType !== "HMO") {
      return NextResponse.json({ error: "orgType must be HOSPITAL or HMO" }, { status: 400 });
    }

    // Check for duplicate admin email
    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Check for duplicate licence
    if (orgType === "HOSPITAL") {
      const dup = await prisma.hospital.findUnique({ where: { licenseNumber } });
      if (dup) return NextResponse.json({ error: "A hospital with this licence number already exists" }, { status: 409 });
    } else {
      const dup = await prisma.hMO.findUnique({ where: { licenseNumber } });
      if (dup) return NextResponse.json({ error: "An HMO with this licence number already exists" }, { status: 409 });
    }

    // ── Create admin user ──────────────────────────────────────────────────
    const adminRole = orgType === "HOSPITAL" ? "HOSPITAL_ADMIN" : "HMO_ADMIN";
    const user = await registerUser({
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: adminRole as "HOSPITAL_ADMIN" | "HMO_ADMIN",
    });

    // ── Create the org ─────────────────────────────────────────────────────
    let orgId: string;

    if (orgType === "HOSPITAL") {
      const hospital = await prisma.hospital.create({
        data: { name: orgName, address, city, state, phoneNumber, email: orgEmail, licenseNumber },
      });
      orgId = hospital.id;

      // Link admin as HospitalStaff
      await prisma.hospitalStaff.create({
        data: {
          userId: user.id,
          hospitalId: orgId,
          staffId: `STAFF-${user.id.slice(-8).toUpperCase()}`,
          position: "Hospital Administrator",
        },
      });

      // Seed default roles
      for (const preset of DEFAULT_HOSPITAL_ROLES) {
        await prisma.orgRole.create({
          data: {
            orgType: "HOSPITAL",
            orgId,
            name: preset.name,
            permissions: JSON.stringify(preset.permissions),
            isDefault: preset.isDefault,
          },
        });
      }
    } else {
      const hmo = await prisma.hMO.create({
        data: { name: orgName, address, city, state, phoneNumber, email: orgEmail, licenseNumber },
      });
      orgId = hmo.id;

      // Auto-create default coverage plan
      await prisma.coveragePlan.create({
        data: { hmoId: orgId, name: "Standard Care Plan", description: "Default plan — update in HMO settings" },
      });

      // Link admin as HMOStaff
      await prisma.hMOStaff.create({
        data: {
          userId: user.id,
          hmoId: orgId,
          staffId: `HSTAFF-${user.id.slice(-8).toUpperCase()}`,
          position: "HMO Administrator",
        },
      });

      // Seed default roles
      for (const preset of DEFAULT_HMO_ROLES) {
        await prisma.orgRole.create({
          data: {
            orgType: "HMO",
            orgId,
            name: preset.name,
            permissions: JSON.stringify(preset.permissions),
            isDefault: preset.isDefault,
          },
        });
      }
    }

    // ── Find the Admin OrgRole just created ────────────────────────────────
    const adminOrgRole = await prisma.orgRole.findFirst({
      where: { orgId, name: "Admin" },
    });

    // ── Create admin's OrgMembership ───────────────────────────────────────
    await prisma.orgMembership.create({
      data: {
        userId: user.id,
        orgType: orgType as "HOSPITAL" | "HMO",
        orgId,
        roleId: adminOrgRole?.id ?? null,
        isActive: true,
      },
    });

    // ── Audit log ──────────────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: orgType,
        entityId: orgId,
        details: `${orgType} "${orgName}" registered by ${adminEmail}`,
      },
    });

    return NextResponse.json(
      { message: "Organisation registered successfully", orgId, orgType },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Org signup error:", error);
    const message = error instanceof Error ? error.message : "Failed to register organisation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
