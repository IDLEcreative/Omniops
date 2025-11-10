/**
 * Subscription Manager
 *
 * Core CRUD operations for domain subscriptions
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type {
  CreateDomainSubscriptionInput,
  UpdateDomainSubscriptionInput,
  DomainSubscription,
} from './types';
import { applyMultiDomainDiscount } from './discount-calculator';
import { updateStripeSubscriptionItem, cancelStripeSubscription } from './stripe-operations';
import { getPricingTier } from './database-queries';

/**
 * Create a new domain subscription
 *
 * For new customers:
 * 1. Creates Stripe subscription via checkout session
 * 2. Records subscription in domain_subscriptions table
 * 3. Calculates multi-domain discount
 *
 * For legacy migrations:
 * 1. Uses existing Stripe subscription ID
 * 2. Links to existing subscription
 * 3. Applies loyalty discount
 */
export async function createDomainSubscription(
  input: CreateDomainSubscriptionInput
): Promise<DomainSubscription> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Database client unavailable');
  }

  // Get pricing tier details
  const tier = await getPricingTier(input.pricingTierId);
  if (!tier) {
    throw new Error(`Pricing tier not found: ${input.pricingTierId}`);
  }

  // For new subscriptions, we'll handle the Stripe creation separately
  // This function just records the subscription in the database
  const { data: subscription, error: createError } = await supabase
    .from('domain_subscriptions')
    .insert({
      domain_id: input.domainId,
      organization_id: input.organizationId,
      pricing_tier_id: input.pricingTierId,
      stripe_subscription_id: input.stripeSubscriptionId || null,
      status: 'trialing', // Default to trialing, webhook will update to active
      multi_domain_discount: 0,
      effective_monthly_price: tier.monthly_price,
      is_legacy_migration: input.isLegacyMigration || false,
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create domain subscription: ${createError.message}`);
  }

  // Calculate and apply multi-domain discount
  await applyMultiDomainDiscount(input.organizationId);

  return subscription as DomainSubscription;
}

/**
 * Update an existing domain subscription
 *
 * Handles:
 * - Tier upgrades/downgrades
 * - Status changes (cancellation, past due, etc.)
 * - Period-end cancellation scheduling
 */
export async function updateDomainSubscription(
  input: UpdateDomainSubscriptionInput
): Promise<DomainSubscription> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Database client unavailable');
  }

  // Fetch current subscription
  const { data: currentSub, error: fetchError } = await supabase
    .from('domain_subscriptions')
    .select('*')
    .eq('id', input.domainSubscriptionId)
    .single();

  if (fetchError || !currentSub) {
    throw new Error('Domain subscription not found');
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // Handle status updates
  if (input.status) {
    updates.status = input.status;
  }

  if (input.cancelAtPeriodEnd !== undefined) {
    updates.cancel_at_period_end = input.cancelAtPeriodEnd;
  }

  // Handle tier changes
  if (input.pricingTierId && input.pricingTierId !== currentSub.pricing_tier_id) {
    const newTier = await getPricingTier(input.pricingTierId);

    if (newTier) {
      updates.pricing_tier_id = input.pricingTierId;
      updates.effective_monthly_price = newTier.monthly_price;

      // Update Stripe subscription if it exists
      if (currentSub.stripe_subscription_id && newTier.stripe_price_id) {
        await updateStripeSubscriptionItem(
          currentSub.stripe_subscription_id,
          currentSub.stripe_subscription_item_id || undefined,
          newTier.stripe_price_id
        );
      }
    }
  }

  // Apply update to database
  const { data: updatedSub, error: updateError } = await supabase
    .from('domain_subscriptions')
    .update(updates)
    .eq('id', input.domainSubscriptionId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update subscription: ${updateError.message}`);
  }

  return updatedSub as DomainSubscription;
}

/**
 * Cancel a domain subscription
 *
 * Options:
 * - Immediate cancellation: cancels at Stripe immediately
 * - End of period: schedules cancellation at period end
 */
export async function cancelDomainSubscription(
  domainSubscriptionId: string,
  atPeriodEnd: boolean = false
): Promise<DomainSubscription> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Database client unavailable');
  }

  // Fetch subscription
  const { data: subscription, error: fetchError } = await supabase
    .from('domain_subscriptions')
    .select('*')
    .eq('id', domainSubscriptionId)
    .single();

  if (fetchError || !subscription) {
    throw new Error('Domain subscription not found');
  }

  // Cancel in Stripe if subscription exists
  if (subscription.stripe_subscription_id) {
    await cancelStripeSubscription(subscription.stripe_subscription_id, atPeriodEnd);
  }

  // Update database
  const { data: updatedSub, error: updateError } = await supabase
    .from('domain_subscriptions')
    .update({
      status: atPeriodEnd ? 'active' : 'canceled',
      cancel_at_period_end: atPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', domainSubscriptionId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to cancel subscription: ${updateError.message}`);
  }

  return updatedSub as DomainSubscription;
}
