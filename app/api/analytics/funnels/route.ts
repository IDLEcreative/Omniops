/**
 * API Route: Analytics Funnels
 * Manages custom conversion funnel configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import {
  getCustomFunnel,
  getAllFunnels,
  saveCustomFunnel,
  deleteCustomFunnel,
  calculateFunnelMetrics,
} from '@/lib/analytics/custom-funnels';

/**
 * GET /api/analytics/funnels
 * Fetch custom funnel for organization/domain
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // Get user's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId') || undefined;
    const action = searchParams.get('action');

    // Get funnel metrics if requested
    if (action === 'metrics') {
      const days = parseInt(searchParams.get('days') || '7');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await calculateFunnelMetrics(membership.organization_id, domainId, {
        start: startDate,
        end: endDate,
      });

      return NextResponse.json(metrics);
    }

    // Get all funnels if requested
    if (action === 'all') {
      const funnels = await getAllFunnels(membership.organization_id);
      return NextResponse.json({ funnels });
    }

    // Get specific funnel for domain
    const funnel = await getCustomFunnel(membership.organization_id, domainId);
    return NextResponse.json(funnel);
  } catch (error) {
    console.error('[API] Error fetching funnels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/analytics/funnels
 * Create or update custom funnel
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // Get user's organization and check permissions
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if user has admin/owner permissions
    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin or owner role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, stages, domainId, isDefault } = body;

    // Validate input
    if (!name || !stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid funnel data. Name and stages required.' },
        { status: 400 }
      );
    }

    // Save funnel
    const result = await saveCustomFunnel(membership.organization_id, {
      id,
      name,
      stages,
      domainId,
      isDefault,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API] Error saving funnel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/analytics/funnels
 * Delete custom funnel
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // Get user's organization and check permissions
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if user has admin/owner permissions
    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin or owner role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('id');

    if (!funnelId) {
      return NextResponse.json({ error: 'Funnel ID required' }, { status: 400 });
    }

    const result = await deleteCustomFunnel(membership.organization_id, funnelId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting funnel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
