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
      description: "Comprehensive 85% health coverage with pre-authorization support",
    },
  });

  // 2. Hospital and departments
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

  const deptGeneral = await prisma.department.upsert({
    where: { id: "seed-dept-1" },
    update: {},
    create: {
      id: "seed-dept-1",
      hospitalId: hospital.id,
      name: "General Practice",
      description: "General consultations",
    },
  });

  const deptPharmacy = await prisma.department.upsert({
    where: { id: "seed-dept-2" },
    update: {},
    create: {
      id: "seed-dept-2",
      hospitalId: hospital.id,
      name: "Pharmacy",
      description: "Dispensing medications and pharmaceutical care",
    },
  });

  const deptLab = await prisma.department.upsert({
    where: { id: "seed-dept-3" },
    update: {},
    create: {
      id: "seed-dept-3",
      hospitalId: hospital.id,
      name: "Laboratory & Diagnostics",
      description: "Clinical pathology and diagnostic testing",
    },
  });

  // 3. Seed Catalog of Medical Services
  const servicesToSeed = [
    {
      name: "General Medical Consultation",
      description: "Standard outpatient physical examination and physician consultation",
      category: "Consultation",
      code: "CONS-001",
      standardPrice: 5000,
      departmentId: deptGeneral.id,
      preAuth: false,
    },
    {
      name: "Specialist Consultant Examination",
      description: "Specialized clinical consultation with a medical specialist",
      category: "Consultation",
      code: "CONS-002",
      standardPrice: 12000,
      departmentId: deptGeneral.id,
      preAuth: true,
    },
    {
      name: "Full Blood Count (FBC)",
      description: "Complete blood count analysis including differential",
      category: "Laboratory",
      code: "LAB-001",
      standardPrice: 4500,
      departmentId: deptLab.id,
      preAuth: false,
    },
    {
      name: "Malaria Parasite Test (MP)",
      description: "Rapid diagnostic test and microscopy for malaria parasite",
      category: "Laboratory",
      code: "LAB-002",
      standardPrice: 2500,
      departmentId: deptLab.id,
      preAuth: false,
    },
    {
      name: "Comprehensive Lipid Profile",
      description: "Total cholesterol, HDL, LDL, and triglycerides analysis",
      category: "Laboratory",
      code: "LAB-003",
      standardPrice: 9000,
      departmentId: deptLab.id,
      preAuth: true,
    },
    {
      name: "Amoxicillin-Clavulanic Acid (Augmentin 625mg)",
      description: "14 tablets antibiotic course",
      category: "Pharmacy",
      code: "PHARM-001",
      standardPrice: 6500,
      departmentId: deptPharmacy.id,
      preAuth: false,
    },
    {
      name: "Artemether/Lumefantrine (Coartem 80/480mg)",
      description: "6 tablets malaria treatment course",
      category: "Pharmacy",
      code: "PHARM-002",
      standardPrice: 3500,
      departmentId: deptPharmacy.id,
      preAuth: false,
    },
    {
      name: "Ciprofloxacin 500mg",
      description: "10 tablets broad-spectrum antibiotic",
      category: "Pharmacy",
      code: "PHARM-003",
      standardPrice: 4200,
      departmentId: deptPharmacy.id,
      preAuth: false,
    },
    {
      name: "Chest X-Ray (PA View)",
      description: "Digital diagnostic radiography of the chest",
      category: "Radiology",
      code: "RAD-001",
      standardPrice: 15000,
      departmentId: deptLab.id,
      preAuth: true,
    },
  ];

  for (const s of servicesToSeed) {
    const service = await prisma.service.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        description: s.description,
        category: s.category,
        standardPrice: s.standardPrice,
        departmentId: s.departmentId,
      },
      create: {
        name: s.name,
        description: s.description,
        category: s.category,
        code: s.code,
        standardPrice: s.standardPrice,
        departmentId: s.departmentId,
      },
    });

    // Seed CoverageRule for this service
    const existingRule = await prisma.coverageRule.findFirst({
      where: {
        coveragePlanId: coveragePlan.id,
        serviceId: service.id,
      },
    });

    if (!existingRule) {
      await prisma.coverageRule.create({
        data: {
          coveragePlanId: coveragePlan.id,
          serviceId: service.id,
          coveragePercentage: 85,
          requiresPreAuth: s.preAuth,
          annualLimit: 500000,
          waitingPeriod: 0,
        },
      });
    }
  }

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
      update: {
        password: hashedPassword,
        role: row.role,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        email: row.email,
        password: hashedPassword,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
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
      const staffId = `EMP-${row.role.replace("_", "")}-${user.id.slice(-8).toUpperCase()}`;
      const position =
        row.role === "DOCTOR"
          ? "Consultant"
          : row.role === "HOSPITAL_ADMIN"
            ? "Administrator"
            : row.role;
      await prisma.hospitalStaff.upsert({
        where: { userId: user.id },
        update: { staffId, position },
        create: {
          userId: user.id,
          hospitalId: hospital.id,
          departmentId:
            row.role === "PHARMACY"
              ? deptPharmacy.id
              : row.role === "LAB"
              ? deptLab.id
              : deptGeneral.id,
          staffId,
          position,
          specialization: row.role === "DOCTOR" ? "General Practice" : undefined,
        },
      });
    }

    if (row.role === "HMO_STAFF" || row.role === "HMO_ADMIN") {
      const staffId = `HMO-${row.role.replace("_", "")}-${user.id.slice(-8).toUpperCase()}`;
      const position = row.role === "HMO_ADMIN" ? "Admin" : "Reviewer";
      await prisma.hMOStaff.upsert({
        where: { userId: user.id },
        update: { staffId, position },
        create: {
          userId: user.id,
          hmoId: hmo.id,
          staffId,
          position,
        },
      });
    }
  }

  console.log("Database reset and seeded successfully. Demo accounts (password: password123):");
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
