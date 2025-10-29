/**
 * Authentication & Authorization Helpers for API Routes
 *
 * Provides reusable auth utilities for securing API endpoints with:
 * - User authentication verification
 * - Organization membership checks
 * - Role-based access control
 * - Standardized error responses
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Organization role types
 */
export type OrganizationRole = 'owner' | 'admin' | 'member';

/**
 * Result of authentication check
 */
export interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Result of organization membership check
 */
export interface MembershipResult {
  organizationId: string;
  role: OrganizationRole;
  userId: string;
}

/**
 * Require user authentication
 *
 * @returns AuthResult if authenticated, NextResponse error if not
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();

  if (!supabase) {
    logger.error('Failed to initialize Supabase client in requireAuth');
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 503 }
    );
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    logger.warn('Unauthenticated request blocked', { error: error?.message });
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return { user, supabase };
}

/**
 * Require user to be a member of the specified organization
 *
 * @param userId - User ID to check
 * @param organizationId - Organization ID to verify membership
 * @param supabase - Supabase client instance
 * @returns MembershipResult if member, NextResponse error if not
 */
export async function requireOrgMembership(
  userId: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<MembershipResult | NextResponse> {
  const { data: member, error } = await supabase
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !member) {
    logger.warn('Non-member attempted to access organization resource', {
      userId,
      organizationId,
      error: error?.message
    });
    return NextResponse.json(
      { error: 'Forbidden: Not a member of this organization' },
      { status: 403 }
    );
  }

  return {
    organizationId: member.organization_id,
    role: member.role as OrganizationRole,
    userId
  };
}

/**
 * Require user to have a specific role in the organization
 *
 * @param membership - Membership result from requireOrgMembership
 * @param allowedRoles - Array of roles that are allowed
 * @returns True if authorized, NextResponse error if not
 */
export function requireRole(
  membership: MembershipResult,
  allowedRoles: OrganizationRole[]
): true | NextResponse {
  if (!allowedRoles.includes(membership.role)) {
    logger.warn('Insufficient permissions for operation', {
      userId: membership.userId,
      organizationId: membership.organizationId,
      userRole: membership.role,
      requiredRoles: allowedRoles
    });
    return NextResponse.json(
      {
        error: 'Forbidden: Insufficient permissions',
        message: `This operation requires one of the following roles: ${allowedRoles.join(', ')}`,
        userRole: membership.role
      },
      { status: 403 }
    );
  }

  return true;
}

/**
 * Get user's organization membership (first organization only)
 * Helper for endpoints that don't require specific organization ID
 *
 * @param userId - User ID to check
 * @param supabase - Supabase client instance
 * @returns MembershipResult if member of any org, NextResponse error if not
 */
export async function getUserOrganization(
  userId: string,
  supabase: SupabaseClient
): Promise<MembershipResult | NextResponse> {
  const { data: membership, error } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();

  if (error || !membership) {
    logger.warn('User has no organization membership', {
      userId,
      error: error?.message
    });
    return NextResponse.json(
      { error: 'No organization found for user' },
      { status: 404 }
    );
  }

  return {
    organizationId: membership.organization_id,
    role: membership.role as OrganizationRole,
    userId
  };
}

/**
 * Verify user has access to a customer config
 * Checks that the config belongs to user's organization
 *
 * @param configId - Customer config ID
 * @param userId - User ID
 * @param supabase - Supabase client instance
 * @returns Config with organization ID if authorized, NextResponse error if not
 */
export async function verifyConfigAccess(
  configId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<{ id: string; organization_id: string } | NextResponse> {
  // Get the config
  const { data: config, error: configError } = await supabase
    .from('customer_configs')
    .select('id, organization_id')
    .eq('id', configId)
    .single();

  if (configError || !config) {
    logger.warn('Customer config not found', { configId, error: configError?.message });
    return NextResponse.json(
      { error: 'Configuration not found' },
      { status: 404 }
    );
  }

  // Verify user is member of the config's organization
  const membershipResult = await requireOrgMembership(
    userId,
    config.organization_id,
    supabase
  );

  if (membershipResult instanceof NextResponse) {
    return membershipResult; // Return the error response
  }

  return config;
}

/**
 * Type guard to check if result is an error response
 */
export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}
