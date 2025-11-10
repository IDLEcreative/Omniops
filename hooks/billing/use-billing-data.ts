/**
 * Custom hook for loading billing data
 *
 * Fetches subscription, usage, and organization data for a domain
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { PricingTier, DomainSubscription } from '@/lib/billing/domain-subscriptions';

export interface BillingData {
  subscription: DomainSubscription & { pricing_tier: PricingTier };
  currentMonth: {
    completedConversations: number;
    usagePercent: number;
    overageAmount: number;
    estimatedOverageCharge: number;
  };
  organization: {
    activeDomainsCount: number;
    appliedDiscount: number;
    totalMRR: number;
  };
}

export function useBillingData(domainId: string) {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBillingData() {
      try {
        const supabase = await createClient();
        if (!supabase) {
          throw new Error('Database service unavailable');
        }

        // Fetch subscription with tier details
        const { data: subscription, error: subError } = await supabase
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
              features
            )
          `
          )
          .eq('domain_id', domainId)
          .single();

        if (subError || !subscription) {
          throw new Error('Subscription not found');
        }

        // Fetch current month usage
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split('T')[0];

        const { data: usage } = await supabase
          .from('domain_monthly_usage')
          .select('*')
          .eq('domain_id', domainId)
          .eq('month', monthStart)
          .single();

        const completedConversations = usage?.completed_conversations || 0;
        const includedLimit = subscription.pricing_tier.included_completions;
        const usagePercent = Math.round((completedConversations / includedLimit) * 100);
        const overageAmount = Math.max(0, completedConversations - includedLimit);
        const estimatedOverageCharge = overageAmount * subscription.pricing_tier.overage_rate;

        // Fetch organization details
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', subscription.organization_id)
          .single();

        // Count active domains in organization
        const { data: activeDomains } = await supabase
          .from('domain_subscriptions')
          .select('id', { count: 'exact' })
          .eq('organization_id', subscription.organization_id)
          .eq('status', 'active');

        const activeDomainsCount = activeDomains?.length || 0;

        // Calculate total organization MRR
        const { data: allSubs } = await supabase
          .from('domain_subscriptions')
          .select('effective_monthly_price')
          .eq('organization_id', subscription.organization_id)
          .eq('status', 'active');

        const totalMRR =
          allSubs?.reduce((sum, sub) => sum + (sub.effective_monthly_price || 0), 0) || 0;

        setBillingData({
          subscription: subscription as BillingData['subscription'],
          currentMonth: {
            completedConversations,
            usagePercent,
            overageAmount,
            estimatedOverageCharge,
          },
          organization: {
            activeDomainsCount,
            appliedDiscount: subscription.multi_domain_discount,
            totalMRR,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing data');
      } finally {
        setLoading(false);
      }
    }

    loadBillingData();
  }, [domainId]);

  return { loading, billingData, error };
}
