/**
 * Standalone AuthStatus enum for use in client components
 * This file doesn't import from Prisma to avoid 'fs' module errors in the browser
 */

export const AuthStatus = {
  PENDING: 'PENDING',
  AUTO_APPROVED: 'AUTO_APPROVED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
} as const;

/**
 * AuthStatus type for TypeScript type checking
 */
export type AuthStatus = typeof AuthStatus[keyof typeof AuthStatus];

export default AuthStatus;