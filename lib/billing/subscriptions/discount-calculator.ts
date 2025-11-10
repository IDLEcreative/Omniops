/**
 * Multi-Domain Discount Calculator
 *
 * Calculates and applies volume discounts based on domain count
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Calculate discount percentage based on domain count
 *
 * Discount structure:
 * - 1 domain: 0%
 * - 2 domains: 10%
 * - 3 domains: 15%
 * - 4 domains: 20%
 * - 5 domains: 25%
 * - 6-10 domains: 30%
 * - 11+ domains: 35%
 */
export function calculateDiscountPercentage(domainCount: number): number {
  if (domainCount >= 11) return 0.35;
  if (domainCount >= 6) return 0.30;
  if (domainCount === 5) return 0.25;
  if (domainCount === 4) return 0.20;
  if (domainCount === 3) return 0.15;
  if (domainCount === 2) return 0.10;
  return 0;
}

/**
 * Apply multi-domain discount to all subscriptions in an organization
 *
 * Updates effective_monthly_price for all active subscriptions
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
  const discountPercent = calculateDiscountPercentage(domainCount);

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
