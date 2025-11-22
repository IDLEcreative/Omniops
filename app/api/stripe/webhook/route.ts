import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@/lib/supabase-server';
import stripe from '@/lib/stripe-client';
import { checkRateLimit } from '@/lib/rate-limit';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const EVENT_TOLERANCE_SECONDS = 300; // 5 minutes

export async function POST(request: NextRequest) {
  // SECURITY: Rate limit webhook endpoint (100 requests per minute per IP)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  const { allowed } = await checkRateLimit(clientIp, 100, 60 * 1000);

  if (!allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // SECURITY: Validate event timestamp to prevent replay attacks
  const eventTime = event.created; // Unix timestamp
  const currentTime = Math.floor(Date.now() / 1000);

  if (Math.abs(currentTime - eventTime) > EVENT_TOLERANCE_SECONDS) {
    console.warn('Webhook event outside tolerance window', {
      eventId: event.id,
      difference: Math.abs(currentTime - eventTime),
    });
    return NextResponse.json(
      { error: 'Event timestamp outside tolerance window' },
      { status: 400 }
    );
  }

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  // Check for duplicate event (idempotency)
  const { data: existingEvent } = await supabase
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent) {
    console.log('Event already processed:', event.id);
    return NextResponse.json({ received: true });
  }

  // Process different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const domainId = session.metadata?.domainId;

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Per-domain subscription (new model)
          if (domainId && organizationId) {
            await supabase
              .from('domain_subscriptions')
              .update({
                stripe_subscription_id: subscription.id,
                stripe_subscription_item_id: subscription.items.data[0]?.id || null,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              })
              .eq('domain_id', domainId);
          }
          // Legacy organization subscription (old model - fallback)
          else if (organizationId) {
            await supabase
              .from('organizations')
              .update({
                stripe_subscription_id: subscription.id,
                subscription_status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              })
              .eq('id', organizationId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const domainId = subscription.metadata?.domainId;
        const organizationId = subscription.metadata?.organizationId;

        // Per-domain subscription update
        if (domainId) {
          await supabase
            .from('domain_subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        // Legacy organization subscription
        else if (organizationId) {
          await supabase
            .from('organizations')
            .update({
              subscription_status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('id', organizationId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const domainId = subscription.metadata?.domainId;
        const organizationId = subscription.metadata?.organizationId;

        // Per-domain subscription cancellation
        if (domainId) {
          await supabase
            .from('domain_subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        // Legacy organization subscription
        else if (organizationId) {
          await supabase
            .from('organizations')
            .update({
              subscription_status: 'canceled',
            })
            .eq('id', organizationId);
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        let organizationId: string | null = null;

        // Try to find organization via subscription (per-domain or legacy)
        if (subscriptionId) {
          const { data: domainSub } = await supabase
            .from('domain_subscriptions')
            .select('organization_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (domainSub) {
            organizationId = domainSub.organization_id;
          }
        }

        // Fallback: find organization by customer ID
        if (!organizationId && customerId) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          organizationId = org?.id || null;
        }

        if (organizationId) {
          await supabase.from('invoices').insert({
            organization_id: organizationId,
            stripe_invoice_id: invoice.id,
            amount_due: invoice.amount_due,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          });
        }
        break;
      }
    }

    // Log the event (for all event types)
    const customerId = (event.data.object as any).customer;
    let organizationId = (event.data.object as any).metadata?.organizationId;

    if (!organizationId && customerId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
      organizationId = org?.id;
    }

    if (organizationId) {
      await supabase.from('billing_events').insert({
        organization_id: organizationId,
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
