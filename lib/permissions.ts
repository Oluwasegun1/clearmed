/**
 * Static permissions catalogue.
 * No DB table — stored as JSON strings in OrgRole.permissions / OrgMembership.permissionOverrides.
 */

// ── Hospital permissions ───────────────────────────────────────────────────

export const HOSPITAL_PERMISSIONS = {
  HOSP_VIEW_REQUESTS:      { label: "View authorization requests" },
  HOSP_CREATE_REQUESTS:    { label: "Create requests on behalf of patients" },
  HOSP_APPROVE_REQUESTS:   { label: "Approve / reject requests" },
  HOSP_VIEW_PATIENTS:      { label: "View patient records" },
  HOSP_MANAGE_STAFF:       { label: "Invite & deactivate staff" },
  HOSP_MANAGE_ROLES:       { label: "Create & edit roles" },
  HOSP_VIEW_REPORTS:       { label: "View analytics & reports" },
  HOSP_EDIT_PROFILE:       { label: "Edit hospital profile" },
  HOSP_MANAGE_DEPARTMENTS: { label: "Manage departments" },
  HOSP_PHARMACY_ACCESS:    { label: "Pharmacy module access" },
  HOSP_LAB_ACCESS:         { label: "Laboratory module access" },
} as const;

export type HospitalPermissionKey = keyof typeof HOSPITAL_PERMISSIONS;

// ── HMO permissions ────────────────────────────────────────────────────────

export const HMO_PERMISSIONS = {
  HMO_VIEW_CLAIMS:      { label: "View authorization claims" },
  HMO_APPROVE_CLAIMS:   { label: "Approve claims" },
  HMO_REJECT_CLAIMS:    { label: "Reject claims" },
  HMO_VIEW_MEMBERS:     { label: "View enrolled members" },
  HMO_MANAGE_STAFF:     { label: "Invite & deactivate staff" },
  HMO_MANAGE_ROLES:     { label: "Create & edit roles" },
  HMO_VIEW_REPORTS:     { label: "View analytics & reports" },
  HMO_EDIT_PROFILE:     { label: "Edit HMO profile" },
  HMO_MANAGE_PLANS:     { label: "Manage coverage plans" },
  HMO_MANAGE_CONTRACTS: { label: "Manage hospital contracts" },
} as const;

export type HmoPermissionKey = keyof typeof HMO_PERMISSIONS;

export type PermissionKey = HospitalPermissionKey | HmoPermissionKey;

// ── Default role presets ───────────────────────────────────────────────────

export const DEFAULT_HOSPITAL_ROLES: Array<{ name: string; permissions: HospitalPermissionKey[]; isDefault: boolean }> = [
  {
    name: "Admin",
    isDefault: true,
    permissions: Object.keys(HOSPITAL_PERMISSIONS) as HospitalPermissionKey[],
  },
  {
    name: "Doctor",
    isDefault: false,
    permissions: ["HOSP_VIEW_REQUESTS", "HOSP_CREATE_REQUESTS", "HOSP_VIEW_PATIENTS"],
  },
  {
    name: "Front Desk",
    isDefault: false,
    permissions: ["HOSP_VIEW_REQUESTS", "HOSP_CREATE_REQUESTS"],
  },
  {
    name: "Pharmacist",
    isDefault: false,
    permissions: ["HOSP_VIEW_REQUESTS", "HOSP_PHARMACY_ACCESS"],
  },
  {
    name: "Lab Technician",
    isDefault: false,
    permissions: ["HOSP_VIEW_REQUESTS", "HOSP_LAB_ACCESS"],
  },
];

export const DEFAULT_HMO_ROLES: Array<{ name: string; permissions: HmoPermissionKey[]; isDefault: boolean }> = [
  {
    name: "Admin",
    isDefault: true,
    permissions: Object.keys(HMO_PERMISSIONS) as HmoPermissionKey[],
  },
  {
    name: "Claims Officer",
    isDefault: false,
    permissions: ["HMO_VIEW_CLAIMS", "HMO_APPROVE_CLAIMS", "HMO_REJECT_CLAIMS"],
  },
  {
    name: "Manager",
    isDefault: false,
    permissions: ["HMO_VIEW_CLAIMS", "HMO_VIEW_MEMBERS", "HMO_VIEW_REPORTS"],
  },
  {
    name: "Front Desk",
    isDefault: false,
    permissions: ["HMO_VIEW_CLAIMS", "HMO_VIEW_MEMBERS"],
  },
];

// ── Helper: check if a membership has a given permission ──────────────────

export interface PermissionOverrides {
  granted: PermissionKey[];
  revoked: PermissionKey[];
}

export function hasPermission(
  rolePermissions: PermissionKey[],
  overrides: PermissionOverrides,
  key: PermissionKey
): boolean {
  if (overrides.revoked.includes(key)) return false;
  if (overrides.granted.includes(key)) return true;
  return rolePermissions.includes(key);
}
