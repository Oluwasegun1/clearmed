-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'PHARMACY', 'LAB', 'HMO_STAFF', 'HMO_ADMIN', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "AuthStatus" AS ENUM ('PENDING', 'MORE_INFORMATION_REQUIRED', 'AUTO_APPROVED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('AUTH_REQUEST', 'AUTH_APPROVAL', 'AUTH_REJECTION', 'SERVICE_DELIVERY', 'COVERAGE_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'USER_CREATED', 'USER_UPDATED', 'AUTHORIZATION_CREATED', 'SERVICE_APPROVED', 'SERVICE_REJECTED', 'SERVICE_MORE_INFO_REQUESTED', 'SERVICE_COMPLETED', 'SERVICE_CANCELLED', 'PATIENT_UPDATED', 'HMO_UPDATED', 'HOSPITAL_UPDATED', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'ACCOUNT_LOCKED', 'MFA_VERIFIED', 'MFA_FAILED', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'AUTH_REQUEST', 'AUTH_REVIEW', 'SERVICE_DELIVERY');

-- CreateEnum
CREATE TYPE "CoverageInquiryStatus" AS ENUM ('PENDING', 'REVIEWED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('HOSPITAL', 'HMO');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hmoId" TEXT NOT NULL,
    "membershipNumber" TEXT NOT NULL,
    "coveragePlanId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,

    CONSTRAINT "Dependent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalStaff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT,
    "staffId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "specialization" TEXT,

    CONSTRAINT "HospitalStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HMO" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HMO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HMOStaff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hmoId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "position" TEXT NOT NULL,

    CONSTRAINT "HMOStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoveragePlan" (
    "id" TEXT NOT NULL,
    "hmoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "annualLimit" DOUBLE PRECISION,
    "coveragePercent" DOUBLE PRECISION,
    "includedServices" TEXT,
    "excludedServices" TEXT,
    "resetCadence" TEXT DEFAULT 'ANNUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CoveragePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageRule" (
    "id" TEXT NOT NULL,
    "coveragePlanId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "coveragePercentage" INTEGER NOT NULL,
    "requiresPreAuth" BOOLEAN NOT NULL DEFAULT false,
    "annualLimit" INTEGER,
    "waitingPeriod" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HMOHospitalContract" (
    "id" TEXT NOT NULL,
    "hmoId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HMOHospitalContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractService" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "agreedPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "standardPrice" DOUBLE PRECISION NOT NULL,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizationRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "dependentId" TEXT,
    "hospitalId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "serviceId" TEXT,
    "diagnosisCode" TEXT,
    "diagnosisNotes" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "AuthStatus" NOT NULL DEFAULT 'PENDING',
    "authCode" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),

    CONSTRAINT "AuthorizationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizationItem" (
    "id" TEXT NOT NULL,
    "authRequestId" TEXT NOT NULL,
    "serviceId" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "cost" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "supportingDocs" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "AuthStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "fulfilledById" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "fulfillmentNotes" TEXT,
    "actualCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorizationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizationReview" (
    "id" TEXT NOT NULL,
    "authRequestId" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "decision" "AuthStatus" NOT NULL,
    "comments" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorizationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDelivery" (
    "id" TEXT NOT NULL,
    "authRequestId" TEXT NOT NULL,
    "deliveredById" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "actualQuantity" INTEGER NOT NULL,
    "actualCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ServiceDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageInquiry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalTests" TEXT NOT NULL,
    "treatments" TEXT NOT NULL,
    "drugs" TEXT NOT NULL,
    "notes" TEXT,
    "status" "CoverageInquiryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgRole" (
    "id" TEXT NOT NULL,
    "orgType" "OrgType" NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orgType" "OrgType" NOT NULL,
    "orgId" TEXT NOT NULL,
    "roleId" TEXT,
    "invitedById" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgType" "OrgType" NOT NULL,
    "orgId" TEXT NOT NULL,
    "roleId" TEXT,
    "permissionOverrides" TEXT NOT NULL DEFAULT '{"granted":[],"revoked":[]}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_membershipNumber_key" ON "Patient"("membershipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_licenseNumber_key" ON "Hospital"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalStaff_userId_key" ON "HospitalStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalStaff_staffId_key" ON "HospitalStaff"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "HMO_licenseNumber_key" ON "HMO"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HMOStaff_userId_key" ON "HMOStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HMOStaff_staffId_key" ON "HMOStaff"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorizationRequest_authCode_key" ON "AuthorizationRequest"("authCode");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDelivery_authRequestId_key" ON "ServiceDelivery"("authRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgInvite_token_key" ON "OrgInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMembership_userId_orgId_key" ON "OrgMembership"("userId", "orgId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_hmoId_fkey" FOREIGN KEY ("hmoId") REFERENCES "HMO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_coveragePlanId_fkey" FOREIGN KEY ("coveragePlanId") REFERENCES "CoveragePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependent" ADD CONSTRAINT "Dependent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalStaff" ADD CONSTRAINT "HospitalStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalStaff" ADD CONSTRAINT "HospitalStaff_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalStaff" ADD CONSTRAINT "HospitalStaff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HMOStaff" ADD CONSTRAINT "HMOStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HMOStaff" ADD CONSTRAINT "HMOStaff_hmoId_fkey" FOREIGN KEY ("hmoId") REFERENCES "HMO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoveragePlan" ADD CONSTRAINT "CoveragePlan_hmoId_fkey" FOREIGN KEY ("hmoId") REFERENCES "HMO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRule" ADD CONSTRAINT "CoverageRule_coveragePlanId_fkey" FOREIGN KEY ("coveragePlanId") REFERENCES "CoveragePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRule" ADD CONSTRAINT "CoverageRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HMOHospitalContract" ADD CONSTRAINT "HMOHospitalContract_hmoId_fkey" FOREIGN KEY ("hmoId") REFERENCES "HMO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HMOHospitalContract" ADD CONSTRAINT "HMOHospitalContract_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractService" ADD CONSTRAINT "ContractService_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "HMOHospitalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractService" ADD CONSTRAINT "ContractService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationRequest" ADD CONSTRAINT "AuthorizationRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationRequest" ADD CONSTRAINT "AuthorizationRequest_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationRequest" ADD CONSTRAINT "AuthorizationRequest_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationRequest" ADD CONSTRAINT "AuthorizationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "HospitalStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationRequest" ADD CONSTRAINT "AuthorizationRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationItem" ADD CONSTRAINT "AuthorizationItem_authRequestId_fkey" FOREIGN KEY ("authRequestId") REFERENCES "AuthorizationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationItem" ADD CONSTRAINT "AuthorizationItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationItem" ADD CONSTRAINT "AuthorizationItem_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "HMOStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationItem" ADD CONSTRAINT "AuthorizationItem_fulfilledById_fkey" FOREIGN KEY ("fulfilledById") REFERENCES "HospitalStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationReview" ADD CONSTRAINT "AuthorizationReview_authRequestId_fkey" FOREIGN KEY ("authRequestId") REFERENCES "AuthorizationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationReview" ADD CONSTRAINT "AuthorizationReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "HMOStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDelivery" ADD CONSTRAINT "ServiceDelivery_authRequestId_fkey" FOREIGN KEY ("authRequestId") REFERENCES "AuthorizationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDelivery" ADD CONSTRAINT "ServiceDelivery_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "HospitalStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDelivery" ADD CONSTRAINT "ServiceDelivery_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageInquiry" ADD CONSTRAINT "CoverageInquiry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

