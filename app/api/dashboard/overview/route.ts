/**
 * Dashboard Overview API Route
 * GET /api/dashboard/overview?days=7
 *
 * Returns comprehensive dashboard metrics including:
 * - Summary statistics (conversations, active users, response times, resolution rates)
 * - Trend data (daily conversations and satisfaction scores)
 * - Recent conversations
 * - Language distribution
 * - Telemetry stats
 * - Bot status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { buildDashboardOverview } from '@/lib/api/dashboard-overview/handlers';
import { getDefaultOverview } from '@/lib/api/dashboard-overview/utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    const searchParams = request.nextUrl.searchParams;
    const days = Math.max(1, parseInt(searchParams.get('days') || '7', 10));

    const overview = await buildDashboardOverview(supabase, days);
    return NextResponse.json(overview);
  } catch (error) {
    console.error('[Dashboard] Error building overview:', error);
    return NextResponse.json(
      { ...getDefaultOverview(), error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    );
  }
}
