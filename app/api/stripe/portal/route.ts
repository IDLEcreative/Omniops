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
      .select('stripe_customer_id')
      .eq('id', organizationId)
      .single();

    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
