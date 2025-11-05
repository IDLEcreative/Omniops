import { NextRequest, NextResponse } from 'next/server';
import { getLookupFailureStats } from '@/lib/telemetry/lookup-failures';
import { createServiceRoleClientSync } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const supabase = createServiceRoleClientSync();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const domainId = searchParams.get('domainId') || undefined;

    // Get stats
    const stats = await getLookupFailureStats(domainId, days);

    if (!stats) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    return NextResponse.json({
      stats,
      period: `Last ${days} days`,
      domainId: domainId || 'all'
    });
  } catch (error) {
    console.error('[Lookup Failures API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
