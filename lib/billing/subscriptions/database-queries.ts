/**
 * Database Queries
 *
 * All database operations for domain subscriptions
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { DomainSubscription, PricingTier, DomainSubscriptionWithTier } from './types';

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
): Promise<DomainSubscriptionWithTier | null> {
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

  return data as DomainSubscriptionWithTier;
}

/**
 * Get pricing tier by ID
 */
export async function getPricingTier(tierId: string): Promise<PricingTier | null> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Database client unavailable');
  }

  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('id', tierId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as PricingTier;
}
