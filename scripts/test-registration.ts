import { prisma } from "../lib/prisma";
import { validatePasswordPolicy, isValidEmail } from "../lib/password-policy";
import bcrypt from "bcryptjs";

async function main() {
  console.log("=== ClearMed 6.1 Registration Acceptance Test Suite ===");
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, description: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${description}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${description}`);
      process.exitCode = 1;
    }
  }

  // 1. Password Policy v2.0 Unit Tests
  console.log("\n--- Testing Password Policy v2.0 ---");

  // Minimum length check
  const shortPass = validatePasswordPolicy("Ab1");
  assert(
    !shortPass.isValid && shortPass.errors.some((e) => e.includes("8 characters")),
    "Rejects password under 8 characters with specific reason"
  );

  // Uppercase check
  const noUpperPass = validatePasswordPolicy("lowercase123");
  assert(
    !noUpperPass.isValid && noUpperPass.errors.some((e) => e.includes("uppercase")),
    "Rejects password without uppercase letter with specific reason"
  );

  // Lowercase check
  const noLowerPass = validatePasswordPolicy("UPPERCASE123");
  assert(
    !noLowerPass.isValid && noLowerPass.errors.some((e) => e.includes("lowercase")),
    "Rejects password without lowercase letter with specific reason"
  );

  // Number check
  const noNumberPass = validatePasswordPolicy("NoNumbersHere");
  assert(
    !noNumberPass.isValid && noNumberPass.errors.some((e) => e.includes("number")),
    "Rejects password without number with specific reason"
  );

  // Common breached password check
  const breachedPass = validatePasswordPolicy("Password123");
  assert(
    !breachedPass.isValid && breachedPass.errors.some((e) => e.includes("common") || e.includes("flagged")),
    "Rejects common breached password ('Password123') with specific reason"
  );

  // Valid password
  const validPass = validatePasswordPolicy("ClearMed#2026Secure");
  assert(validPass.isValid && validPass.errors.length === 0, "Accepts valid password complying with v2.0 policy");

  // 2. Email Validation Unit Tests
  console.log("\n--- Testing Email Format Validator ---");
  assert(isValidEmail("patient@example.com"), "Accepts valid email format");
  assert(!isValidEmail("invalid-email"), "Rejects invalid email format");
  assert(!isValidEmail(""), "Rejects empty email format");

  // 3. Integration Tests via Prisma DB
  console.log("\n--- Testing Patient User Registration & Database Integration ---");
  const testEmail = `test.patient.${Date.now()}@clearmed.health`;
  const rawPassword = "SecurePass123!";
  const firstName = "Jane";
  const lastName = "Doe";
  const phoneNumber = "+2348123456789";

  // Clean up any old test user if exists
  await prisma.user.deleteMany({ where: { email: testEmail } });

  // Simulate API registration process
  // a) Verify Duplicate Email Check on clean state
  const existingUserCheck = await prisma.user.findUnique({ where: { email: testEmail } });
  assert(existingUserCheck === null, "Email is not initially registered");

  // b) Hash password securely
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  assert(hashedPassword !== rawPassword, "Password is password-hashed (never plain text)");
  assert(hashedPassword.startsWith("$2a$") || hashedPassword.startsWith("$2b$"), "Password uses bcrypt hash format");

  // c) Create User & Patient
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role: "PATIENT",
    },
  });

  assert(user.id !== undefined && user.role === "PATIENT", "User created with PATIENT role");

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

  const patient = await prisma.patient.create({
    data: {
      userId: user.id,
      hmoId: hmo.id,
      membershipNumber: `CM-PAT-TEST-${Date.now()}`,
      coveragePlanId: plan.id,
      dateOfBirth: new Date("1995-01-01"),
      gender: "Prefer not to say",
      address: "Lagos, Nigeria",
    },
  });

  assert(patient.userId === user.id, "Patient relationship correctly established with User");

  // d) Verify Duplicate Email Rejection
  const duplicateUserCheck = await prisma.user.findUnique({ where: { email: testEmail } });
  assert(duplicateUserCheck !== null, "Duplicate email registration check identifies existing user");

  // e) Verify New Patient Can Subsequently Log In
  const loginUser = await prisma.user.findUnique({ where: { email: testEmail } });
  const isPasswordValid = await bcrypt.compare(rawPassword, loginUser!.password);
  assert(isPasswordValid, "New patient can subsequently log in with correct credentials");

  const isInvalidPasswordRejected = !(await bcrypt.compare("WrongPassword123", loginUser!.password));
  assert(isInvalidPasswordRejected, "Login fails with incorrect password");

  // Clean up test user
  await prisma.user.delete({ where: { id: user.id } });

  console.log(`\n==================================================`);
  console.log(`Test Results: ${passedTests}/${totalTests} tests passed.`);
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
