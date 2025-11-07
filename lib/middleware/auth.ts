/**
 * Authentication Middleware for API Routes
 *
 * Provides authentication and role-based authorization for API endpoints:
 * - requireAuth: Ensures user is authenticated
 * - requireAdmin: Ensures user is authenticated AND has admin/owner role
 * - requireOrgAccess: Ensures user has access to specified organization
 *
 * Security Features:
 * - Session validation via Supabase Auth
 * - Role-based access control (owner > admin > member > viewer)
 * - Multi-tenant isolation enforcement
 * - Standardized error responses
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth();
 *   if (authResult instanceof NextResponse) return authResult; // Auth failed
 *   const { user, supabase } = authResult;
 *   // ... your authenticated logic
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { User, SupabaseClient } from '@/types/supabase';

/**
 * Organization roles (ordered by privilege)
 */
export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Admin roles that have elevated privileges
 */
const ADMIN_ROLES: OrganizationRole[] = ['owner', 'admin'];

/**
 * Result of successful authentication
 */
export interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Result of successful organization membership check
 */
export interface OrgMembershipResult extends AuthResult {
  organizationId: string;
  role: OrganizationRole;
}

/**
 * Require user authentication
 *
 * Validates that the request has a valid Supabase session.
 * Returns user and Supabase client if authenticated, error response if not.
 *
 * @returns AuthResult if authenticated, NextResponse (401) if not
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();

  if (!supabase) {
    logger.error('Failed to initialize Supabase client in requireAuth');
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    );
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    logger.warn('Unauthenticated request blocked', {
      error: error?.message,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="API"'
        }
      }
    );
  }

  return { user, supabase };
}

/**
 * Require user to be an admin (owner or admin role)
 *
 * Validates authentication AND checks that the user has admin privileges
 * in at least one organization. For multi-tenant analytics, combine with
 * domain filtering to ensure proper data isolation.
 *
 * @returns OrgMembershipResult if admin, NextResponse (401/403) if not
 */
export async function requireAdmin(): Promise<OrgMembershipResult | NextResponse> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult; // Return auth error
  }

  const { user, supabase } = authResult;

  // Check if user has admin role in any organization
  const { data: membership, error } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .in('role', ADMIN_ROLES)
    .single();

  if (error || !membership) {
    logger.warn('Non-admin user attempted to access admin resource', {
      userId: user.id,
      email: user.email,
      error: error?.message,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'This resource requires administrator privileges'
      },
      { status: 403 }
    );
  }

  return {
    user,
    supabase,
    organizationId: membership.organization_id,
    role: membership.role as OrganizationRole
  };
}

/**
 * Require user to have access to a specific organization
 *
 * Validates that user is authenticated AND is a member of the specified
 * organization. Use this for organization-scoped resources.
 *
 * @param organizationId - Organization ID to verify access
 * @returns OrgMembershipResult if member, NextResponse (401/403/404) if not
 */
export async function requireOrgAccess(
  organizationId: string
): Promise<OrgMembershipResult | NextResponse> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult; // Return auth error
  }

  const { user, supabase } = authResult;

  // Verify user is member of the specified organization
  const { data: membership, error } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !membership) {
    logger.warn('User attempted to access unauthorized organization', {
      userId: user.id,
      organizationId,
      error: error?.message,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'You do not have access to this organization'
      },
      { status: 403 }
    );
  }

  return {
    user,
    supabase,
    organizationId: membership.organization_id,
    role: membership.role as OrganizationRole
  };
}

/**
 * Get user's organization with domain filtering
 *
 * For analytics endpoints that accept optional domain parameter,
 * this ensures users can only access data from their own organization's domains.
 *
 * @param domain - Optional domain to filter by
 * @returns Organization info with allowed domains, or error response
 */
export async function requireOrgWithDomains(
  domain?: string
): Promise<
  | (OrgMembershipResult & { allowedDomains: string[] })
  | NextResponse
> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;

  // Get user's organization membership
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (memberError || !membership) {
    return NextResponse.json(
      { error: 'No organization found for user' },
      { status: 404 }
    );
  }

  // Get organization's domains
  const { data: configs, error: configError } = await supabase
    .from('customer_configs')
    .select('domain')
    .eq('organization_id', membership.organization_id);

  if (configError) {
    logger.error('Failed to fetch organization domains', {
      userId: user.id,
      organizationId: membership.organization_id,
      error: configError.message
    });

    return NextResponse.json(
      { error: 'Failed to verify organization access' },
      { status: 500 }
    );
  }

  const allowedDomains = configs?.map(c => c.domain) || [];

  // If domain parameter provided, verify it belongs to this organization
  if (domain && !allowedDomains.includes(domain)) {
    logger.warn('User attempted to access unauthorized domain', {
      userId: user.id,
      requestedDomain: domain,
      allowedDomains,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'You do not have access to data for this domain'
      },
      { status: 403 }
    );
  }

  return {
    user,
    supabase,
    organizationId: membership.organization_id,
    role: membership.role as OrganizationRole,
    allowedDomains
  };
}

/**
 * Type guard to check if result is an error response
 */
export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Check if a role has admin privileges
 */
export function isAdminRole(role: OrganizationRole): boolean {
  return ADMIN_ROLES.includes(role);
}
