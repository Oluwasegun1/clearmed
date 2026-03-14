/**
 * Seeds the database with one account per role for login flows.
 * All demo passwords: password123
 */
import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  // 1. HMO and coverage plan (required for Patient)
  const hmo = await prisma.hMO.upsert({
    where: { licenseNumber: "HMO-LIC-001" },
    update: {},
    create: {
      name: "ClearCare HMO",
      address: "12 Health Plaza",
      city: "Lagos",
      state: "Lagos",
      phoneNumber: "+2348010000001",
      email: "contact@clearcarehmo.com",
      licenseNumber: "HMO-LIC-001",
    },
  });

  const coveragePlan = await prisma.coveragePlan.upsert({
    where: { id: "seed-coverage-plan-1" },
    update: {},
    create: {
      id: "seed-coverage-plan-1",
      hmoId: hmo.id,
      name: "Standard Plan",
      description: "Standard health coverage",
    },
  });

  // 2. Hospital and department (required for HospitalStaff)
  const hospital = await prisma.hospital.upsert({
    where: { licenseNumber: "HOSP-LIC-001" },
    update: {},
    create: {
      name: "ClearMed General Hospital",
      address: "45 Medical Drive",
      city: "Lagos",
      state: "Lagos",
      phoneNumber: "+2348010000002",
      email: "info@clearmedhospital.com",
      licenseNumber: "HOSP-LIC-001",
    },
  });

  const department = await prisma.department.upsert({
    where: { id: "seed-dept-1" },
    update: {},
    create: {
      id: "seed-dept-1",
      hospitalId: hospital.id,
      name: "General Practice",
      description: "General consultations",
    },
  });

  // 3. Service (optional for seed; useful for auth requests later)
  await prisma.service.upsert({
    where: { code: "CONS-001" },
    update: {},
    create: {
      name: "General Consultation",
      description: "Outpatient consultation",
      category: "Consultation",
      code: "CONS-001",
      standardPrice: 5000,
      departmentId: department.id,
    },
  });

  // 4. Users and role-specific records
  const roles = [
    {
      email: "patient@example.com",
      firstName: "Jane",
      lastName: "Patient",
      role: "PATIENT" as const,
    },
    {
      email: "doctor@example.com",
      firstName: "John",
      lastName: "Doctor",
      role: "DOCTOR" as const,
    },
    {
      email: "hospital@example.com",
      firstName: "Hospital",
      lastName: "Admin",
      role: "HOSPITAL_ADMIN" as const,
    },
    {
      email: "pharmacy@example.com",
      firstName: "Pharmacy",
      lastName: "Staff",
      role: "PHARMACY" as const,
    },
    {
      email: "lab@example.com",
      firstName: "Lab",
      lastName: "Staff",
      role: "LAB" as const,
    },
    {
      email: "hmo@example.com",
      firstName: "HMO",
      lastName: "Staff",
      role: "HMO_STAFF" as const,
    },
    {
      email: "hmo-admin@example.com",
      firstName: "HMO",
      lastName: "Admin",
      role: "HMO_ADMIN" as const,
    },
    {
      email: "admin@example.com",
      firstName: "System",
      lastName: "Admin",
      role: "SYSTEM_ADMIN" as const,
    },
  ];

  for (const row of roles) {
    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: { password: hashedPassword, role: row.role, isActive: true },
      create: {
        email: row.email,
        password: hashedPassword,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
      },
    });

    if (row.role === "PATIENT") {
      await prisma.patient.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          hmoId: hmo.id,
          membershipNumber: `MEM-${user.id.slice(0, 8).toUpperCase()}`,
          coveragePlanId: coveragePlan.id,
          dateOfBirth: new Date("1990-01-15"),
          gender: "Female",
          address: "10 Patient Street, Lagos",
        },
      });
    }

    if (
      row.role === "DOCTOR" ||
      row.role === "HOSPITAL_ADMIN" ||
      row.role === "PHARMACY" ||
      row.role === "LAB"
    ) {
      const staffId = `EMP-${row.role.slice(0, 2).toUpperCase()}-${user.id.slice(0, 6)}`;
      const position =
        row.role === "DOCTOR"
          ? "Consultant"
          : row.role === "HOSPITAL_ADMIN"
            ? "Administrator"
            : row.role;
      await prisma.hospitalStaff.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          hospitalId: hospital.id,
          departmentId: department.id,
          staffId,
          position,
          specialization: row.role === "DOCTOR" ? "General Practice" : undefined,
        },
      });
    }

    if (row.role === "HMO_STAFF" || row.role === "HMO_ADMIN") {
      const staffId = `HMO-${user.id.slice(0, 8).toUpperCase()}`;
      await prisma.hMOStaff.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          hmoId: hmo.id,
          staffId,
          position: row.role === "HMO_ADMIN" ? "Admin" : "Reviewer",
        },
      });
    }
  }

  console.log("Seed completed. Demo accounts (password: password123):");
  console.log("  patient@example.com   -> PATIENT (personal dashboard)");
  console.log("  doctor@example.com    -> DOCTOR (hospital dashboard)");
  console.log("  hospital@example.com -> HOSPITAL_ADMIN (hospital dashboard)");
  console.log("  pharmacy@example.com -> PHARMACY (hospital dashboard)");
  console.log("  lab@example.com       -> LAB (hospital dashboard)");
  console.log("  hmo@example.com       -> HMO_STAFF (hmo dashboard)");
  console.log("  hmo-admin@example.com -> HMO_ADMIN (hmo dashboard)");
  console.log("  admin@example.com     -> SYSTEM_ADMIN (admin dashboard)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
