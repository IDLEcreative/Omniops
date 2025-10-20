/**
 * Server-side helper functions for organization operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationRole } from '@/types/organizations';

/**
 * Get user's membership in an organization
 */
export async function getUserOrganizationMembership(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<{ role: OrganizationRole } | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as { role: OrganizationRole };
}

/**
 * Check if user has at least the required role level in an organization
 */
export async function hasOrganizationRole(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  requiredRole: OrganizationRole
): Promise<boolean> {
  const membership = await getUserOrganizationMembership(supabase, organizationId, userId);

  if (!membership) {
    return false;
  }

  const roleHierarchy: Record<OrganizationRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  return roleHierarchy[membership.role] >= roleHierarchy[requiredRole];
}

/**
 * Check if user is a member of an organization
 */
export async function isOrganizationMember(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const membership = await getUserOrganizationMembership(supabase, organizationId, userId);
  return membership !== null;
}

/**
 * Get organization by ID with user's role
 */
export async function getOrganizationWithRole(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
) {
  // Check membership
  const membership = await getUserOrganizationMembership(supabase, organizationId, userId);

  if (!membership) {
    return null;
  }

  // Get organization
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error || !organization) {
    return null;
  }

  return {
    ...organization,
    user_role: membership.role,
  };
}

/**
 * Get organization ID from domain
 * Useful for scoping API requests by domain
 */
export async function getOrganizationIdFromDomain(
  supabase: SupabaseClient,
  domain: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('domains')
    .select('organization_id')
    .eq('domain', domain)
    .maybeSingle();

  if (error || !data || !data.organization_id) {
    return null;
  }

  return data.organization_id;
}

/**
 * Verify user has access to a domain through organization membership
 */
export async function verifyDomainAccess(
  supabase: SupabaseClient,
  domain: string,
  userId: string,
  requiredRole: OrganizationRole = 'viewer'
): Promise<boolean> {
  const organizationId = await getOrganizationIdFromDomain(supabase, domain);

  if (!organizationId) {
    // Fallback to old user_id based check for backward compatibility
    const { data } = await supabase
      .from('domains')
      .select('user_id')
      .eq('domain', domain)
      .eq('user_id', userId)
      .maybeSingle();

    return !!data;
  }

  return hasOrganizationRole(supabase, organizationId, userId, requiredRole);
}

/**
 * Get all domains for an organization
 */
export async function getOrganizationDomains(
  supabase: SupabaseClient,
  organizationId: string
) {
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching organization domains:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if organization has reached seat limit
 */
export async function hasReachedSeatLimit(
  supabase: SupabaseClient,
  organizationId: string
): Promise<boolean> {
  // Get organization seat limit
  const { data: org } = await supabase
    .from('organizations')
    .select('seat_limit')
    .eq('id', organizationId)
    .single();

  if (!org) {
    return true; // Conservative: assume limit reached if org not found
  }

  // Count current members
  const { count } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  return (count || 0) >= org.seat_limit;
}
