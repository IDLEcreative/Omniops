/**
 * Stripe Operations
 *
 * Handles Stripe API interactions for subscription management
 */

import { getStripeClient } from '@/lib/stripe-client';

/**
 * Update Stripe subscription item with new price
 */
export async function updateStripeSubscriptionItem(
  subscriptionId: string,
  itemId: string | undefined,
  newPriceId: string
): Promise<void> {
  const stripe = getStripeClient();

  // Fetch subscription to get item ID if not provided
  let subscriptionItemId = itemId;
  if (!subscriptionItemId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.items.data.length === 0) {
      throw new Error('No subscription items found');
    }
    subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      throw new Error('Subscription item ID not found');
    }
  }

  // Update the subscription item with new price
  await stripe.subscriptionItems.update(subscriptionItemId, {
    price: newPriceId,
    proration_behavior: 'create_prorations',
  });
}

/**
 * Cancel Stripe subscription
 */
export async function cancelStripeSubscription(
  stripeSubscriptionId: string,
  atPeriodEnd: boolean
): Promise<void> {
  const stripe = getStripeClient();

  if (atPeriodEnd) {
    // Schedule cancellation at period end
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    // Cancel immediately
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  }
}
