/**
 * Funnel Alerts API
 *
 * GET /api/analytics/funnel/alerts?domain=example.com - List alert rules
 * POST /api/analytics/funnel/alerts - Create alert rule
 * PUT /api/analytics/funnel/alerts - Update alert rule
 * DELETE /api/analytics/funnel/alerts?id=X - Delete alert rule
 * GET /api/analytics/funnel/alerts?action=history&domain=X - Get alert history
 * POST /api/analytics/funnel/alerts?action=monitor - Trigger alert monitoring (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { monitorFunnelAlerts } from '@/lib/analytics/funnel-alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const action = searchParams.get('action') || 'list';

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
    }

    // Verify access
    const { data: config } = await supabase
      .from('customer_configs')
      .select('organization_id')
      .eq('domain', domain)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

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
    if (action === 'history') {
      const { data: history } = await supabase
        .from('funnel_alert_history')
        .select('*')
        .eq('domain', domain)
        .order('triggered_at', { ascending: false })
        .limit(100);

      return NextResponse.json({ success: true, history: history || [] });
    }

    // List alert rules
    const { data: rules } = await supabase
      .from('funnel_alert_rules')
      .select('*')
      .eq('domain', domain)
      .order('created_at', { ascending: false });

    return NextResponse.json({ success: true, rules: rules || [] });
  } catch (error) {
    console.error('[Funnel Alerts API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Trigger monitoring (admin only)
    if (action === 'monitor') {
      const result = await monitorFunnelAlerts();
      return NextResponse.json({ success: true, checked: result.checked, triggered: result.triggered });
    }

    // Create alert rule
    const body = await request.json();
    const { domain, alert_type, threshold_value, ...rest } = body;

    if (!domain || !alert_type || threshold_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify admin access
    const { data: config } = await supabase
      .from('customer_configs')
      .select('organization_id')
      .eq('domain', domain)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', config.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: rule } = await supabase
      .from('funnel_alert_rules')
      .insert({ domain, alert_type, threshold_value, ...rest })
      .select()
      .single();

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('[Funnel Alerts API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id field' }, { status: 400 });
    }

    // Verify access
    const { data: existingRule } = await supabase
      .from('funnel_alert_rules')
      .select('domain')
      .eq('id', id)
      .single();

    if (!existingRule) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    const { data: config } = await supabase
      .from('customer_configs')
      .select('organization_id')
      .eq('domain', existingRule.domain)
      .single();

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', config?.organization_id || '')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: rule } = await supabase
      .from('funnel_alert_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('[Funnel Alerts API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Verify access
    const { data: existingRule } = await supabase
      .from('funnel_alert_rules')
      .select('domain')
      .eq('id', id)
      .single();

    if (!existingRule) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    const { data: config } = await supabase
      .from('customer_configs')
      .select('organization_id')
      .eq('domain', existingRule.domain)
      .single();

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', config?.organization_id || '')
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await supabase.from('funnel_alert_rules').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Funnel Alerts API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
