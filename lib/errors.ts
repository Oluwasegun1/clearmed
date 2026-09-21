/**
 * ClearMed Standardized User-Facing Error Messages and Sanitizer (v2.0)
 * Ensures technical/sensitive internals are never leaked to end users.
 */

import { NextResponse } from "next/server";

export const ERROR_MESSAGES = {
  AUTH_INVALID_CREDENTIALS: "Invalid email or password.",
  AUTH_UNAUTHORIZED: "You are not authorized to perform this action.",
  AUTH_SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_ACCOUNT_LOCKED: "Account locked due to multiple failed login attempts. Please try again after 15 minutes.",
  AUTH_ACCOUNT_DEACTIVATED: "This account has been deactivated. Please contact support.",
  PATIENT_NOT_FOUND: "Patient not found.",
  AUTHORIZATION_NOT_FOUND: "Authorization request not found.",
  HOSPITAL_NOT_FOUND: "Hospital not found.",
  HMO_NOT_FOUND: "HMO not found.",
  SERVICE_ITEM_NOT_FOUND: "Service item not found.",
  SERVER_ERROR: "Something went wrong. Please try again.",
  VALIDATION_ERROR: "Please check the information provided and try again.",
  SECTION_8_3_VIOLATION: "You are not authorized to perform this action.",
} as const;

/**
 * Sanitizes any raw exception into a clean, safe, user-friendly message.
 * Logs full technical details to server console for debugging.
 */
export function sanitizeErrorMessage(error: unknown, fallbackMessage: string = ERROR_MESSAGES.SERVER_ERROR): string {
  if (error instanceof Error) {
    const msg = error.message;

    // Check for known user-facing intentional errors
    if (
      msg.includes("Invalid email or password") ||
      msg.includes("Invalid credentials")
    ) {
      return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
    }

    if (
      msg.includes("not authorized") ||
      msg.includes("Forbidden") ||
      msg.includes("Unauthorized") ||
      msg.includes("binding rule")
    ) {
      return ERROR_MESSAGES.AUTH_UNAUTHORIZED;
    }

    if (msg.includes("Patient not found") || msg.includes("patient not found")) {
      return ERROR_MESSAGES.PATIENT_NOT_FOUND;
    }

    if (
      msg.includes("Authorization request not found") ||
      msg.includes("authorization not found") ||
      msg.includes("Authorization not found")
    ) {
      return ERROR_MESSAGES.AUTHORIZATION_NOT_FOUND;
    }

    if (msg.includes("Account locked")) {
      return msg;
    }

    if (msg.includes("Account is deactivated")) {
      return ERROR_MESSAGES.AUTH_ACCOUNT_DEACTIVATED;
    }

    // Filter out Prisma/Database/Runtime raw error dumps
    if (
      msg.includes("PrismaClient") ||
      msg.includes("Unique constraint") ||
      msg.includes("Foreign key") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("sqlite") ||
      msg.includes("SQLITE_") ||
      msg.includes("database query") ||
      msg.includes("syntax error") ||
      msg.includes("at ")
    ) {
      return fallbackMessage;
    }

    // Safe custom validation messages
    if (
      msg.length < 120 &&
      !msg.includes("error") &&
      !msg.includes("Error") &&
      !msg.includes("fail") &&
      !msg.includes("{")
    ) {
      return msg;
    }
  }

  return fallbackMessage;
}

/**
 * Standard API error responder
 */
export function createErrorResponse(
  error: unknown,
  status = 500,
  fallback: string = ERROR_MESSAGES.SERVER_ERROR
) {
  const safeMessage = sanitizeErrorMessage(error, fallback);
  if (status >= 500) {
    console.error("[ServerError]", error);
  }
  return NextResponse.json({ error: safeMessage }, { status });
}
