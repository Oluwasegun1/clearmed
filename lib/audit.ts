/**
 * ClearMed Audit Logging System (v2.0)
 * NDPA 12-month retention compliant immutable audit trail.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@/lib/generated/prisma";

export interface LogAuditParams {
  userId?: string | null;
  action: AuditAction | keyof typeof AuditAction;
  entityType: string;
  entityId: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  req?: NextRequest | Request | null;
}

/**
 * Extracts IP Address and User Agent from a Request
 */
export function extractClientMeta(req?: NextRequest | Request | null): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  if (!req) return { ipAddress: null, userAgent: null };

  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  try {
    const headers = req.headers;
    const xForwardedFor = headers.get("x-forwarded-for");
    const xRealIp = headers.get("x-real-ip");
    ipAddress = xForwardedFor?.split(",")[0]?.trim() || xRealIp || null;
    userAgent = headers.get("user-agent") || null;
  } catch {
    // Ignore extraction errors
  }

  return { ipAddress, userAgent };
}

/**
 * Creates an immutable AuditLog record.
 * Handles both authenticated and unauthenticated/security audit events.
 */
export async function logAuditEvent(params: LogAuditParams) {
  try {
    const { userId, action, entityType, entityId, details, req } = params;
    const clientMeta = extractClientMeta(req);

    const ipAddress = params.ipAddress ?? clientMeta.ipAddress;
    const userAgent = params.userAgent ?? clientMeta.userAgent;

    const log = await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: action as AuditAction,
        entityType,
        entityId,
        details: details || null,
        ipAddress,
        userAgent,
      },
    });

    return log;
  } catch (error) {
    // Audit logging should not crash critical transactions, but error is reported
    console.error("[AuditLog] Failed to record audit event:", error);
    return null;
  }
}

/**
 * Audit Action Descriptions for Display and Compliance Reporting
 */
export const AUDIT_ACTION_DESCRIPTIONS: Record<string, string> = {
  LOGIN: "User successfully authenticated",
  LOGOUT: "User signed out",
  LOGIN_FAILED: "Failed authentication attempt",
  USER_CREATED: "New user account created",
  USER_UPDATED: "User account or permissions modified",
  AUTHORIZATION_CREATED: "New pre-authorization request submitted",
  SERVICE_APPROVED: "Authorization service item approved by HMO",
  SERVICE_REJECTED: "Authorization service item rejected by HMO",
  SERVICE_MORE_INFO_REQUESTED: "HMO requested additional medical info",
  SERVICE_COMPLETED: "Service item completed/fulfilled by hospital",
  SERVICE_CANCELLED: "Service item cancelled",
  PATIENT_UPDATED: "Patient demographic or coverage record updated",
  HMO_UPDATED: "HMO profile or settings modified",
  HOSPITAL_UPDATED: "Hospital facility profile or settings modified",
  UNAUTHORIZED_ACCESS_ATTEMPT: "Security: unauthorized access or binding rule violation attempt",
  ACCOUNT_LOCKED: "User account locked due to consecutive failed attempts",
  MFA_VERIFIED: "Multi-Factor Authentication challenge verified",
  MFA_FAILED: "Multi-Factor Authentication challenge failed",
};
