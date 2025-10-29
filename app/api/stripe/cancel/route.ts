import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import stripe from '@/lib/stripe-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();

    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_subscription_id')
      .eq('id', organizationId)
      .single();

    if (!org?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    const subscription = await stripe.subscriptions.update(
      org.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    await supabase
      .from('organizations')
      .update({ cancel_at_period_end: true })
      .eq('id', organizationId);

    return NextResponse.json({
      success: true,
      cancelAt: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
