/**
 * Organization Context - Type Definitions
 *
 * Central type definitions for organization management system.
 * Exported for use across the application.
 */

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
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
}

export interface SeatUsage {
  used: number;
  pending: number;
  limit: number;
  available: number;
  lastUpdated: Date;
}

export interface OrganizationPermissions {
  canInviteMembers: boolean;
  canManageOrganization: boolean;
  canDeleteOrganization: boolean;
  canViewBilling: boolean;
}

export interface OrganizationContextType {
  // Current organization
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;

  // User's organizations
  userOrganizations: Organization[];
  isLoadingOrganizations: boolean;

  // Current user's role
  currentUserRole: string | null;

  // Seat usage (cached)
  seatUsage: SeatUsage | null;

  // Actions
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  refreshSeatUsage: () => Promise<void>;
  createOrganization: (name: string) => Promise<Organization>;
  inviteMember: (email: string, role: string) => Promise<void>;

  // Permissions (cached and computed)
  permissions: OrganizationPermissions;

  // Cache management
  clearCache: () => void;
  cacheExpiry: number; // milliseconds
}
