/**
 * API Route: Analytics Alerts
 * Manages alert thresholds and history
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import {
  getAlertThresholds,
  getAlertHistory,
  saveAlertThreshold,
  deleteAlertThreshold,
  acknowledgeAlert,
} from '@/lib/alerts/threshold-checker';

/**
 * GET /api/analytics/alerts
 * Fetch alert thresholds or history
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
    const type = searchParams.get('type') || 'thresholds';

    if (type === 'history') {
      // Fetch alert history
      const limit = parseInt(searchParams.get('limit') || '50');
      const onlyUnacknowledged = searchParams.get('unacknowledged') === 'true';
      const metricFilter = searchParams.get('metric') || undefined;

      const history = await getAlertHistory(membership.organization_id, {
        limit,
        onlyUnacknowledged,
        metricFilter,
      });

      return NextResponse.json({ history });
    } else {
      // Fetch alert thresholds
      const thresholds = await getAlertThresholds(membership.organization_id);
      return NextResponse.json({ thresholds });
    }
  } catch (error) {
    console.error('[API] Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/analytics/alerts
 * Create or update alert threshold
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
    const { id, metric, condition, threshold, enabled, notification_channels } = body;

    // Validate input
    if (!metric || !condition || threshold === undefined) {
      return NextResponse.json(
        { error: 'Invalid alert data. Metric, condition, and threshold required.' },
        { status: 400 }
      );
    }

    if (!['above', 'below'].includes(condition)) {
      return NextResponse.json(
        { error: 'Invalid condition. Must be "above" or "below".' },
        { status: 400 }
      );
    }

    // Save threshold
    const result = await saveAlertThreshold(membership.organization_id, {
      id,
      metric,
      condition,
      threshold,
      enabled,
      notification_channels,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API] Error saving alert threshold:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/analytics/alerts
 * Acknowledge an alert
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    const result = await acknowledgeAlert(alertId, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error acknowledging alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/analytics/alerts
 * Delete alert threshold
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
    const thresholdId = searchParams.get('id');

    if (!thresholdId) {
      return NextResponse.json({ error: 'Threshold ID required' }, { status: 400 });
    }

    const result = await deleteAlertThreshold(membership.organization_id, thresholdId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting alert threshold:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
