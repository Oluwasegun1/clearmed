/**
 * Standalone AuthStatus enum for use across client and server components.
 * ClearMed standard authorization lifecycle statuses.
 */

export const AuthStatus = {
  PENDING: "PENDING",
  MORE_INFORMATION_REQUIRED: "MORE_INFORMATION_REQUIRED",
  APPROVED: "APPROVED",
  AUTO_APPROVED: "AUTO_APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export type AuthStatus = (typeof AuthStatus)[keyof typeof AuthStatus];

export default AuthStatus;