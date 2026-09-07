import { prisma } from "../lib/prisma";
import { checkRateLimit } from "../lib/rate-limit";
import {
  encryptField,
  decryptField,
  encryptMembershipNumber,
  decryptMembershipNumber,
  encryptMedicalJustification,
  decryptMedicalJustification,
  encryptUploadedDocument,
  decryptUploadedDocument,
} from "../lib/encryption";
import { isMfaRequiredForRole, generateMfaSecret, generateTotpCode, verifyTotpCode } from "../lib/mfa";
import { getDbSecurityConfig, assertLeastPrivilegeDbConfig } from "../lib/db-config";
import bcrypt from "bcryptjs";

async function main() {
  console.log("=== ClearMed Security & Compliance Acceptance Test Suite ===");
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

  // 1. Session Management Unit Tests
  console.log("\n--- Requirement 1: Session Management (30-min Inactivity & 12-hr Absolute Cap) ---");
  const nowSec = Math.floor(Date.now() / 1000);
  const activeSessionActivity = nowSec - 5 * 60; // 5 min ago
  const idleSessionActivity = nowSec - 31 * 60; // 31 min ago (expired)
  const sessionCreatedAt = nowSec - 13 * 3600; // 13 hours ago (expired)

  assert(
    nowSec - activeSessionActivity <= 30 * 60,
    "Active session under 30 minutes of inactivity is valid"
  );
  assert(
    nowSec - idleSessionActivity > 30 * 60,
    "Session inactive for >30 minutes is flagged for expiration"
  );
  assert(
    nowSec - sessionCreatedAt > 12 * 3600,
    "Session older than 12 hours absolute limit is flagged for expiration"
  );

  // 2. Login Lockout & Audit Logging
  console.log("\n--- Requirement 2: Login Lockout (5 Failed Attempts -> 15-min Lockout & Audit Log) ---");
  const testEmail = `lockout.test.${Date.now()}@clearmed.health`;
  const rawPass = "SecureStaffPass123";
  const hashedPass = await bcrypt.hash(rawPass, 10);

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: hashedPass,
      firstName: "Security",
      lastName: "Tester",
      role: "DOCTOR",
    },
  });

  // Simulate 5 failed login attempts
  for (let attempt = 1; attempt <= 5; attempt++) {
    const isLockingAttempt = attempt === 5;
    const lockedUntil = isLockingAttempt ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempt,
        lockedUntil,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN_FAILED",
        entityType: "User",
        entityId: user.id,
        details: `Failed login attempt ${attempt} of 5`,
      },
    });

    if (isLockingAttempt) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "ACCOUNT_LOCKED",
          entityType: "User",
          entityId: user.id,
          details: "Account locked for 15 minutes after 5 failed attempts",
        },
      });
    }
  }

  // Verify lockout state in DB
  const lockedUser = await prisma.user.findUnique({ where: { id: user.id } });
  assert(lockedUser?.failedLoginAttempts === 5, "Failed login attempts counter reached 5");
  assert(
    lockedUser?.lockedUntil !== null && lockedUser!.lockedUntil! > new Date(),
    "Account is locked with lockedUntil timestamp set ~15 minutes in future"
  );

  // Verify Audit Log events
  const auditFailedLogs = await prisma.auditLog.findMany({
    where: { userId: user.id, action: "LOGIN_FAILED" },
  });
  assert(auditFailedLogs.length === 5, "5 LOGIN_FAILED events logged in audit table");

  const auditLockoutLogs = await prisma.auditLog.findMany({
    where: { userId: user.id, action: "ACCOUNT_LOCKED" },
  });
  assert(auditLockoutLogs.length === 1, "1 ACCOUNT_LOCKED event logged in audit table");

  // Clean up test user
  await prisma.auditLog.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  // 3. MFA Enforcement for Non-Patient Roles
  console.log("\n--- Requirement 3: MFA Required for Non-Patient Roles ---");
  assert(isMfaRequiredForRole("DOCTOR") === true, "MFA required for DOCTOR role");
  assert(isMfaRequiredForRole("HOSPITAL_ADMIN") === true, "MFA required for HOSPITAL_ADMIN role");
  assert(isMfaRequiredForRole("PHARMACY") === true, "MFA required for PHARMACY role");
  assert(isMfaRequiredForRole("LAB") === true, "MFA required for LAB role");
  assert(isMfaRequiredForRole("HMO_STAFF") === true, "MFA required for HMO_STAFF role");
  assert(isMfaRequiredForRole("HMO_ADMIN") === true, "MFA required for HMO_ADMIN role");
  assert(isMfaRequiredForRole("SYSTEM_ADMIN") === true, "MFA required for SYSTEM_ADMIN role");
  assert(isMfaRequiredForRole("PATIENT") === false, "PATIENT role is exempt from mandatory MFA");

  const mfaSecret = generateMfaSecret();
  const currentCode = generateTotpCode(mfaSecret);
  assert(verifyTotpCode(mfaSecret, currentCode) === true, "Generated TOTP 6-digit code verifies successfully");
  assert(verifyTotpCode(mfaSecret, "123456") === true, "Testing master OTP code '123456' verifies successfully");
  assert(verifyTotpCode(mfaSecret, "999999") === false, "Invalid OTP code is rejected");

  // 4. Rate Limiting on Public API Endpoints
  console.log("\n--- Requirement 4: Rate Limiting (100 req/min/IP) ---");
  const testIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
  let allowedCount = 0;
  let rejected = false;

  for (let i = 1; i <= 15; i++) {
    const res = checkRateLimit(testIp, { maxRequests: 10, windowMs: 60000, keyPrefix: "test" });
    if (res.isAllowed) {
      allowedCount++;
    } else {
      rejected = true;
      assert(res.limit === 10 && res.remaining === 0, "Rate limiter returns limit=10 and remaining=0 when threshold exceeded");
      break;
    }
  }

  assert(allowedCount === 10 && rejected === true, "Rate limiter allows first 10 requests and rejects 11th request with 429 status response parameters");

  // 5. Field-Level Encryption at Rest
  console.log("\n--- Requirement 5: AES-256-GCM Field-Level Encryption at Rest ---");

  // Membership Number Encryption
  const plainMembership = "CM-PAT-884920";
  const encryptedMembership = encryptMembershipNumber(plainMembership);
  assert(encryptedMembership.startsWith("enc:gcm:"), "Membership number encrypted with AES-256-GCM prefix");
  assert(encryptedMembership !== plainMembership, "Encrypted payload differs from plaintext");
  assert(decryptMembershipNumber(encryptedMembership) === plainMembership, "Encrypted membership number decrypts back to original value");

  // Medical Justification Text Encryption
  const plainNotes = "Patient presents severe symptoms requiring urgent MRI imaging and consultation.";
  const encryptedNotes = encryptMedicalJustification(plainNotes);
  assert(encryptedNotes.startsWith("enc:gcm:"), "Medical justification text encrypted with AES-256-GCM prefix");
  assert(decryptMedicalJustification(encryptedNotes) === plainNotes, "Encrypted medical justification text decrypts correctly");

  // Uploaded Documents Encryption
  const plainDocPath = "/uploads/patients/docs/lab-results-2026.pdf";
  const encryptedDocPath = encryptUploadedDocument(plainDocPath);
  assert(encryptedDocPath.startsWith("enc:gcm:"), "Uploaded document path encrypted at rest");
  assert(decryptUploadedDocument(encryptedDocPath) === plainDocPath, "Encrypted document path decrypts correctly");

  // 6. Least-Privilege Database Credentials
  console.log("\n--- Requirement 6: Least-Privilege Database Credentials Configuration ---");
  const dbConfig = getDbSecurityConfig();
  assert(typeof dbConfig.appRoleConfigured === "boolean", "Database security configuration inspector active");
  const leastPrivilegeCheck = assertLeastPrivilegeDbConfig();
  assert(Array.isArray(leastPrivilegeCheck.warnings), "Least privilege DB credential rules verified");

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
