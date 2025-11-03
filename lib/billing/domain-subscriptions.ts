/**
 * Domain Subscription Management
 *
 * Handles per-domain subscription creation, updates, and cancellation
 * Includes multi-domain discount calculations and Stripe integration
 *
 * Key Functions:
 * - createDomainSubscription: Create subscription for a domain
 * - updateDomainSubscription: Update tier or pricing
 * - cancelDomainSubscription: Cancel domain subscription
 * - applyMultiDomainDiscount: Calculate and apply discounts for multiple domains
 * - getDomainSubscription: Fetch subscription details
 * - getOrganizationSubscriptions: Get all subscriptions for an organization
 */

import { getStripeClient } from '@/lib/stripe-client';
import { createServiceRoleClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

export interface CreateDomainSubscriptionInput {
  domainId: string;
  organizationId: string;
  pricingTierId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string; // For legacy migrations
  isLegacyMigration?: boolean;
}

export interface UpdateDomainSubscriptionInput {
  domainSubscriptionId: string;
  pricingTierId?: string;
  status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  cancelAtPeriodEnd?: boolean;
}

export interface DomainSubscription {
  id: string;
  domain_id: string;
  organization_id: string;
  pricing_tier_id: string;
  stripe_subscription_id: string | null;
  stripe_subscription_item_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  multi_domain_discount: number;
  effective_monthly_price: number;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  id: string;
  tier_name: string;
  display_name: string;
  monthly_price: number;
  included_completions: number;
  overage_rate: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  features: Record<string, boolean>;
}

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
  const { data: tier, error: tierError } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('id', input.pricingTierId)
    .single();

  if (tierError || !tier) {
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
    // Get new tier details
    const { data: newTier } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('id', input.pricingTierId)
      .single();

    if (newTier) {
      updates.pricing_tier_id = input.pricingTierId;
      updates.effective_monthly_price = newTier.monthly_price;

      // Update Stripe subscription if it exists
      if (currentSub.stripe_subscription_id && newTier.stripe_price_id) {
        const stripe = getStripeClient();
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
    const stripe = getStripeClient();
    if (atPeriodEnd) {
      // Schedule cancellation at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      await stripe.subscriptions.del(subscription.stripe_subscription_id);
    }
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

/**
 * Calculate and apply multi-domain discount
 *
 * Discount structure (based on active domain count in organization):
 * - 1 domain: 0%
 * - 2 domains: 10%
 * - 3 domains: 15%
 * - 4 domains: 20%
 * - 5 domains: 25%
 * - 6-10 domains: 30%
 * - 11+ domains: 35%
 *
 * Updates effective_monthly_price for all subscriptions
 */
export async function applyMultiDomainDiscount(organizationId: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Database client unavailable');
  }

  // Count active domains in organization
  const { data: subscriptions, error: listError } = await supabase
    .from('domain_subscriptions')
    .select('id, pricing_tier_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active');

  if (listError || !subscriptions) {
    console.error('Failed to fetch subscriptions for discount calculation:', listError);
    return;
  }

  const domainCount = subscriptions.length;

  // Calculate discount percentage based on domain count
  let discountPercent = 0;
  if (domainCount >= 11) {
    discountPercent = 0.35;
  } else if (domainCount >= 6) {
    discountPercent = 0.30;
  } else if (domainCount === 5) {
    discountPercent = 0.25;
  } else if (domainCount === 4) {
    discountPercent = 0.20;
  } else if (domainCount === 3) {
    discountPercent = 0.15;
  } else if (domainCount === 2) {
    discountPercent = 0.10;
  }

  // Get base prices for all tiers
  const { data: tiers } = await supabase.from('pricing_tiers').select('id, monthly_price');

  const tierPriceMap = new Map((tiers || []).map((t) => [t.id, t.monthly_price]));

  // Update all subscriptions in this organization
  for (const subscription of subscriptions) {
    const basePrice = tierPriceMap.get(subscription.pricing_tier_id);
    if (!basePrice) continue;

    const effectivePrice = basePrice * (1 - discountPercent);

    const { error: updateError } = await supabase
      .from('domain_subscriptions')
      .update({
        multi_domain_discount: discountPercent,
        effective_monthly_price: Math.round(effectivePrice * 100) / 100, // Round to 2 decimals
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error(`Failed to update discount for subscription ${subscription.id}:`, updateError);
    }
  }
}

/**
 * Get a specific domain subscription
 */
export async function getDomainSubscription(
  domainSubscriptionId: string
): Promise<DomainSubscription | null> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Database client unavailable');
  }

  const { data, error } = await supabase
    .from('domain_subscriptions')
    .select('*')
    .eq('id', domainSubscriptionId)
    .single();

  if (error) {
    console.error('Failed to fetch domain subscription:', error);
    return null;
  }

  return data as DomainSubscription;
}

/**
 * Get all subscriptions for an organization
 */
export async function getOrganizationSubscriptions(
  organizationId: string,
  status?: string
): Promise<DomainSubscription[]> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Database client unavailable');
  }

  let query = supabase
    .from('domain_subscriptions')
    .select('*')
    .eq('organization_id', organizationId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch organization subscriptions:', error);
    return [];
  }

  return (data || []) as DomainSubscription[];
}

/**
 * Get subscription with pricing tier details
 */
export async function getDomainSubscriptionWithTier(
  domainSubscriptionId: string
): Promise<(DomainSubscription & { pricing_tier: PricingTier }) | null> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Database client unavailable');
  }

  const { data, error } = await supabase
    .from('domain_subscriptions')
    .select(
      `
      *,
      pricing_tier:pricing_tiers(
        id,
        tier_name,
        display_name,
        monthly_price,
        included_completions,
        overage_rate,
        stripe_product_id,
        stripe_price_id,
        features
      )
    `
    )
    .eq('id', domainSubscriptionId)
    .single();

  if (error) {
    console.error('Failed to fetch subscription with tier:', error);
    return null;
  }

  return data as DomainSubscription & { pricing_tier: PricingTier };
}

/**
 * Internal: Update Stripe subscription item with new price
 */
async function updateStripeSubscriptionItem(
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
    subscriptionItemId = subscription.items.data[0].id;
  }

  // Update the subscription item with new price
  await stripe.subscriptionItems.update(subscriptionItemId, {
    price: newPriceId,
    proration_behavior: 'create_prorations',
  });
}
