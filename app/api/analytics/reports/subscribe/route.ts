import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  enabled: z.boolean(),
});

/**
 * POST /api/analytics/reports/subscribe
 * Create or update report subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = subscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { frequency, enabled } = validation.data;

    // Get user's organization (assuming user metadata or profile table)
    // For now, using user.id as organization_id
    const organizationId = user.id;

    // Upsert subscription
    const { data, error } = await supabase
      .from('report_subscriptions')
      .upsert(
        {
          organization_id: organizationId,
          user_email: user.email!,
          frequency,
          enabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'organization_id,frequency',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save subscription:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: data,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/reports/subscribe
 * Get current report subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = user.id;

    // Fetch subscriptions
    const { data, error } = await supabase
      .from('report_subscriptions')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptions: data || [],
    });
  } catch (error) {
    console.error('Fetch subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/reports/subscribe
 * Delete report subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency');

    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency parameter' },
        { status: 400 }
      );
    }

    const organizationId = user.id;

    // Delete subscription
    const { error } = await supabase
      .from('report_subscriptions')
      .delete()
      .eq('organization_id', organizationId)
      .eq('frequency', frequency);

    if (error) {
      console.error('Failed to delete subscription:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
