/**
 * Funnel Analytics API
 *
 * GET /api/analytics/funnel?domain=example.com&start=2025-01-01&end=2025-01-31
 * GET /api/analytics/funnel/trends?domain=example.com&days=30
 *
 * Returns complete customer journey metrics from chat → cart → purchase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { getFunnelMetrics, getFunnelTrends } from '@/lib/analytics/funnel-analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const action = searchParams.get('action') || 'metrics';

    if (!domain) {
      return NextResponse.json(
        { error: 'Missing required parameter: domain' },
        { status: 400 }
      );
    }

    // Verify user has access to this domain
    const { data: config } = await supabase
      .from('customer_configs')
      .select('*, organization:organizations!inner(*)')
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

    // Handle different actions
    if (action === 'trends') {
      const days = parseInt(searchParams.get('days') || '30');
      const trends = await getFunnelTrends(domain, days);

      return NextResponse.json({
        success: true,
        domain,
        period: `Last ${days} days`,
        trends,
      });
    }

    // Default: Get funnel metrics
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const end = endParam ? new Date(endParam) : new Date();
    const start = startParam ? new Date(startParam) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metrics = await getFunnelMetrics(domain, { start, end });

    return NextResponse.json({
      success: true,
      domain,
      metrics,
    });
  } catch (error) {
    console.error('[Funnel Analytics API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
