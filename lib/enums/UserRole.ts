/**
 * Standalone UserRole enum for use in client components
 * This file doesn't import from Prisma to avoid 'fs' module errors in the browser
 */

export const UserRole = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  PHARMACY: 'PHARMACY',
  LAB: 'LAB',
  HMO_STAFF: 'HMO_STAFF',
  HMO_ADMIN: 'HMO_ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN'
} as const;

/**
 * UserRole type for TypeScript type checking
 */
export type UserRole = typeof UserRole[keyof typeof UserRole];

export default UserRole;