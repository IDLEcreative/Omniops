/**
 * Revenue Analytics API
 *
 * GET /api/analytics/revenue
 *
 * Query parameters:
 * - domain: Domain to get analytics for
 * - start: Start date (ISO string)
 * - end: End date (ISO string)
 * - metric: 'overview' | 'ltv' | 'attribution' | 'all'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRevenueMetrics, getCustomerLTVMetrics, getAttributionBreakdown } from '@/lib/analytics/revenue-analytics';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user authentication
    const supabase = createServiceRoleClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const metric = searchParams.get('metric') || 'all';

    if (!domain) {
      return NextResponse.json({ error: 'Missing required parameter: domain' }, { status: 400 });
    }

    // Verify user has access to this domain
    const { data: config } = await supabase
      .from('customer_configs')
      .select('id, organization_id')
      .eq('domain', domain)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Check organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', config.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse date range
    const timeRange = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    };

    // Fetch requested metrics
    let result: any = {};

    if (metric === 'overview' || metric === 'all') {
      result.overview = await getRevenueMetrics(domain, timeRange);
    }

    if (metric === 'ltv' || metric === 'all') {
      result.ltv = await getCustomerLTVMetrics(domain);
    }

    if (metric === 'attribution' || metric === 'all') {
      result.attribution = await getAttributionBreakdown(domain, timeRange);
    }

    return NextResponse.json({
      success: true,
      domain,
      timeRange,
      data: result,
    });
  } catch (error) {
    console.error('[Revenue Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
