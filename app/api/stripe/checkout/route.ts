import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import stripe from '@/lib/stripe-client';

const CheckoutSchema = z.object({
  priceId: z.string(),
  domainId: z.string().uuid(),
  pricingTierId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

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

    const body = await request.json();
    const { priceId, domainId, pricingTierId, organizationId } = CheckoutSchema.parse(body);

    // Verify user is owner/admin of organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify domain belongs to organization
    const { data: domain } = await supabase
      .from('customer_configs')
      .select('id, domain, customer_id')
      .eq('id', domainId)
      .single();

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Verify customer (via customer_configs) belongs to organization
    const { data: customer } = await supabase
      .from('customers')
      .select('id, organization_id')
      .eq('id', domain.customer_id)
      .single();

    if (!customer || customer.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Domain does not belong to organization' }, { status: 403 });
    }

    // Check if domain already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('domain_subscriptions')
      .select('id, status')
      .eq('domain_id', domainId)
      .in('status', ['active', 'trialing', 'past_due', 'incomplete'])
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Domain already has an active subscription' },
        { status: 400 }
      );
    }

    // Verify pricing tier exists
    const { data: pricingTier } = await supabase
      .from('pricing_tiers')
      .select('id, display_name, stripe_price_id')
      .eq('id', pricingTierId)
      .single();

    if (!pricingTier) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 });
    }

    // Verify the priceId matches the pricing tier's stripe price
    if (pricingTier.stripe_price_id !== priceId) {
      return NextResponse.json(
        { error: 'Price ID does not match pricing tier' },
        { status: 400 }
      );
    }

    // Get organization
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_customer_id, name')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organizationId,
          organizationName: org.name,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/domains/${domainId}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/domains/${domainId}/billing?canceled=true`,
      metadata: {
        organizationId,
        domainId,
        pricingTierId,
      },
      subscription_data: {
        metadata: {
          domain_id: domainId,
          pricing_tier_id: pricingTierId,
          organization_id: organizationId,
        },
      },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
