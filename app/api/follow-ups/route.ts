/**
 * Follow-ups API
 *
 * Endpoints for managing automated follow-ups:
 * - GET: Retrieve follow-up analytics and summary
 * - POST: Manually trigger follow-up detection and scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/middleware/auth';
import {
  detectFollowUpCandidates,
  prioritizeFollowUps,
  scheduleFollowUps,
  getFollowUpAnalytics,
  getFollowUpSummary,
} from '@/lib/follow-ups';

/**
 * GET /api/follow-ups
 * Retrieve follow-up analytics and summary
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'summary'; // 'summary' or 'analytics'
    const days = parseInt(searchParams.get('days') || '30');

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const serviceSupabase = await createServiceRoleClient();
    if (!serviceSupabase) {
      throw new Error('Failed to create Supabase client');
    }

    if (type === 'summary') {
      // Get summary statistics
      const summary = await getFollowUpSummary(serviceSupabase);
      return NextResponse.json({ success: true, data: summary });
    } else if (type === 'analytics') {
      // Get detailed analytics
      const analytics = await getFollowUpAnalytics(serviceSupabase, {
        days,
        organizationId: membership.organization_id,
      });
      return NextResponse.json({ success: true, data: analytics });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('[Follow-ups API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

/**
 * POST /api/follow-ups
 * Manually trigger follow-up detection and scheduling
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // Get user's organization domains
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { data: configs } = await supabase
      .from('customer_configs')
      .select('domain')
      .eq('organization_id', membership.organization_id);

    const domainIds = configs?.map(c => c.domain) || [];

    if (domainIds.length === 0) {
      return NextResponse.json({ error: 'No domains found' }, { status: 404 });
    }

    const serviceSupabase = await createServiceRoleClient();
    if (!serviceSupabase) {
      throw new Error('Failed to create Supabase client');
    }

    // Detect candidates
    const candidates = await detectFollowUpCandidates(serviceSupabase, domainIds);

    // Prioritize
    const prioritized = prioritizeFollowUps(candidates);

    // Schedule follow-ups
    const result = await scheduleFollowUps(serviceSupabase, prioritized);

    return NextResponse.json({
      success: true,
      data: {
        candidates_found: candidates.length,
        scheduled: result.scheduled,
        skipped: result.skipped,
      },
    });
  } catch (error) {
    console.error('[Follow-ups API] POST error:', error);
    return NextResponse.json({ error: 'Failed to schedule follow-ups' }, { status: 500 });
  }
}
