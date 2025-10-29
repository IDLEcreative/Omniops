import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select(`
        stripe_customer_id,
        stripe_subscription_id,
        subscription_status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        plan_type
      `)
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasSubscription: !!org.stripe_subscription_id,
      subscription: org.stripe_subscription_id ? {
        status: org.subscription_status,
        currentPeriodStart: org.current_period_start,
        currentPeriodEnd: org.current_period_end,
        cancelAtPeriodEnd: org.cancel_at_period_end,
        planType: org.plan_type,
      } : null,
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
