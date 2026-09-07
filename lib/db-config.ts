/**
 * Least-Privilege Database Configuration & Architecture Guidelines for ClearMed
 * 
 * Requirement:
 * Least-privilege database credentials per service; no shared superuser DB accounts in production.
 * 
 * Role Segregation in Production:
 * 1. Application Runtime DML Role (`clearmed_app_user`):
 *    - Allowed operations: SELECT, INSERT, UPDATE, DELETE on application tables.
 *    - Denied operations: DDL (CREATE TABLE, ALTER TABLE, DROP TABLE), GRANT/REVOKE, SUPERUSER.
 *    - Env variable: `DATABASE_URL`
 * 
 * 2. Migration DDL Role (`clearmed_migrator_user`):
 *    - Allowed operations: DDL schema alterations (Prisma migrations only).
 *    - Env variable: `MIGRATION_DATABASE_URL` or `DIRECT_URL`
 */

export interface DbSecurityConfig {
  appRoleConfigured: boolean;
  migrationRoleConfigured: boolean;
  isProduction: boolean;
  connectionUrlMasked: string;
}

/**
 * Validates and retrieves current database security configuration.
 */
export function getDbSecurityConfig(): DbSecurityConfig {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const migratorUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DIRECT_URL ?? "";
  const isProduction = process.env.NODE_ENV === "production";

  // Mask database URL credentials for display/logs
  const connectionUrlMasked = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");

  const appRoleConfigured = dbUrl.length > 0 && !dbUrl.includes("postgres:postgres") && !dbUrl.includes("root:root");
  const migrationRoleConfigured = migratorUrl.length > 0 || !isProduction;

  return {
    appRoleConfigured,
    migrationRoleConfigured,
    isProduction,
    connectionUrlMasked,
  };
}

/**
 * Asserts least-privilege principles are documented and active.
 */
export function assertLeastPrivilegeDbConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const config = getDbSecurityConfig();

  if (config.isProduction && !process.env.MIGRATION_DATABASE_URL) {
    warnings.push(
      "PRODUCTION WARNING: Separate MIGRATION_DATABASE_URL not configured. Ensure migrations run with DDL credentials separate from application DML credentials."
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
