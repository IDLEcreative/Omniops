/**
 * Type definitions for organizations and multi-seat support
 */

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  plan_type: string;
  seat_limit: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  email?: string;
  name?: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  // Joined fields
  invited_by_email?: string;
  invited_by_name?: string;
  organization_name?: string;
}

export interface OrganizationWithRole extends Organization {
  user_role: OrganizationRole;
  member_count?: number;
}

/**
 * Role permissions
 */
export const ROLE_PERMISSIONS = {
  owner: {
    can_delete_organization: true,
    can_manage_members: true,
    can_manage_settings: true,
    can_view_data: true,
    can_edit_data: true,
    can_invite_members: true,
  },
  admin: {
    can_delete_organization: false,
    can_manage_members: true,
    can_manage_settings: true,
    can_view_data: true,
    can_edit_data: true,
    can_invite_members: true,
  },
  member: {
    can_delete_organization: false,
    can_manage_members: false,
    can_manage_settings: false,
    can_view_data: true,
    can_edit_data: true,
    can_invite_members: false,
  },
  viewer: {
    can_delete_organization: false,
    can_manage_members: false,
    can_manage_settings: false,
    can_view_data: true,
    can_edit_data: false,
    can_invite_members: false,
  },
} as const;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: OrganizationRole,
  permission: keyof (typeof ROLE_PERMISSIONS)['owner']
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Compare role hierarchy (higher value = more permissions)
 */
export function compareRoles(roleA: OrganizationRole, roleB: OrganizationRole): number {
  const hierarchy: Record<OrganizationRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };
  return hierarchy[roleA] - hierarchy[roleB];
}

/**
 * Check if roleA is at least as powerful as roleB
 */
export function hasRoleLevel(userRole: OrganizationRole, requiredRole: OrganizationRole): boolean {
  return compareRoles(userRole, requiredRole) >= 0;
}
