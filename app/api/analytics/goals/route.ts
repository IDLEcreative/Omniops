import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { MetricGoal } from '@/types/dashboard';

/**
 * GET /api/analytics/goals
 *
 * Fetch all metric goals for the user's organization
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // 2. Get user's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }

    // 3. Fetch goals for organization (RLS policies will enforce access)
    const { data: goals, error: goalsError } = await supabase
      .from('metric_goals')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('[Goals API] Error fetching goals:', goalsError);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    return NextResponse.json({ goals: goals || [] });

  } catch (error) {
    console.error('[Goals API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/analytics/goals
 *
 * Create a new metric goal
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // 2. Get user's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { metric_name, target_value, period } = body;

    // 4. Validation
    if (!metric_name || typeof metric_name !== 'string') {
      return NextResponse.json({ error: 'metric_name is required and must be a string' }, { status: 400 });
    }

    if (!target_value || typeof target_value !== 'number' || target_value <= 0) {
      return NextResponse.json({ error: 'target_value is required and must be a positive number' }, { status: 400 });
    }

    if (!period || !['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json({ error: 'period must be one of: daily, weekly, monthly' }, { status: 400 });
    }

    // 5. Create goal (RLS policies will enforce organization_id)
    const { data: goal, error: insertError } = await supabase
      .from('metric_goals')
      .insert({
        organization_id: membership.organization_id,
        metric_name,
        target_value,
        period,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A goal for this metric and period already exists' },
          { status: 409 }
        );
      }

      console.error('[Goals API] Error creating goal:', insertError);
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    return NextResponse.json({ goal }, { status: 201 });

  } catch (error) {
    console.error('[Goals API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/analytics/goals
 *
 * Update an existing metric goal
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // 2. Parse request body
    const body = await request.json();
    const { id, target_value, period } = body;

    // 3. Validation
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required and must be a string' }, { status: 400 });
    }

    if (target_value !== undefined && (typeof target_value !== 'number' || target_value <= 0)) {
      return NextResponse.json({ error: 'target_value must be a positive number' }, { status: 400 });
    }

    if (period !== undefined && !['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json({ error: 'period must be one of: daily, weekly, monthly' }, { status: 400 });
    }

    // 4. Build update object (only include fields that are provided)
    const updates: Partial<MetricGoal> = {};
    if (target_value !== undefined) updates.target_value = target_value;
    if (period !== undefined) updates.period = period;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // 5. Update goal (RLS policies will enforce organization access)
    const { data: goal, error: updateError } = await supabase
      .from('metric_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Goals API] Error updating goal:', updateError);

      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
      }

      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    return NextResponse.json({ goal });

  } catch (error) {
    console.error('[Goals API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/analytics/goals
 *
 * Delete a metric goal
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { supabase } = authResult;

    // 2. Get goal ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    // 3. Delete goal (RLS policies will enforce organization access)
    const { error: deleteError } = await supabase
      .from('metric_goals')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[Goals API] Error deleting goal:', deleteError);
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Goals API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
