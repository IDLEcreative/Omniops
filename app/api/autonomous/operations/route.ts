/**
 * Autonomous Operations List API
 *
 * GET /api/autonomous/operations
 * Fetches list of autonomous operations with optional filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getUserOrganization } from '@/lib/auth/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult; // Return auth error
    }

    const { user, supabase } = authResult;

    // Get user's organization
    const orgResult = await getUserOrganization(user.id, supabase);
    if (orgResult instanceof NextResponse) {
      return orgResult;
    }

    const { organizationId } = orgResult;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('autonomous_operations')
      .select('*')
      .eq('organization_id', organizationId) // Filter by user's organization
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (service) {
      query = query.eq('service', service);
    }

    const { data: operations, error } = await query;

    if (error) {
      console.error('[API] Failed to fetch operations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch operations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      operations: operations || [],
      count: operations?.length || 0,
    });
  } catch (error) {
    console.error('[API] Operations list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
