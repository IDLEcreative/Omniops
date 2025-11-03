'use client';

/**
 * Domain Billing Dashboard
 *
 * Displays:
 * - Current pricing tier
 * - Included conversations usage
 * - Overage charges
 * - Multi-domain discount details
 * - Upgrade/downgrade buttons
 * - Billing history
 *
 * Path: /dashboard/domains/[domainId]/billing
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { PricingTier, DomainSubscription } from '@/lib/billing/domain-subscriptions';

interface BillingPageProps {
  params: {
    domainId: string;
  };
}

interface BillingData {
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

export default function BillingPage({ params }: BillingPageProps) {
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
          .eq('domain_id', params.domainId)
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
          .eq('domain_id', params.domainId)
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
  }, [params.domainId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error || !billingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Billing Data</h2>
          <p className="text-red-700">{error || 'Unable to load billing information'}</p>
        </div>
      </div>
    );
  }

  const { subscription, currentMonth, organization } = billingData;
  const tier = subscription.pricing_tier;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your domain subscription and view usage details</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{tier.display_name}</h2>
              <p className="text-gray-600 mt-1">£{subscription.effective_monthly_price}/month</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : subscription.status === 'canceled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Base vs Effective Price */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Base Monthly Price</p>
              <p className="text-lg font-semibold text-gray-900">£{tier.monthly_price}</p>
            </div>
            {subscription.multi_domain_discount > 0 && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Multi-Domain Discount</p>
                  <p className="text-lg font-semibold text-green-600">
                    -{(subscription.multi_domain_discount * 100).toFixed(0)}%
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Usage Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Month Usage</h3>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                {currentMonth.completedConversations.toLocaleString()} /{' '}
                {tier.included_completions.toLocaleString()} conversations
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {currentMonth.usagePercent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentMonth.usagePercent <= 75
                    ? 'bg-blue-500'
                    : currentMonth.usagePercent <= 100
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(currentMonth.usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {currentMonth.usagePercent >= 90 && (
            <div
              className={`p-3 rounded-lg ${
                currentMonth.usagePercent >= 100
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <p
                className={`text-sm ${
                  currentMonth.usagePercent >= 100 ? 'text-red-700' : 'text-yellow-700'
                }`}
              >
                {currentMonth.usagePercent >= 100
                  ? `You have exceeded your included limit by ${currentMonth.overageAmount.toLocaleString()} conversations`
                  : 'You are approaching your usage limit'}
              </p>
            </div>
          )}
        </div>

        {/* Overage Charges */}
        {currentMonth.overageAmount > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overage Charges</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Overage Conversations</span>
                <span className="font-semibold text-gray-900">
                  {currentMonth.overageAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rate per Conversation</span>
                <span className="font-semibold text-gray-900">
                  £{tier.overage_rate.toFixed(2)}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Estimated Overage Charge</span>
                <span className="text-lg font-bold text-red-600">
                  £{currentMonth.estimatedOverageCharge.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Organization Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Overview</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Active Domains</p>
              <p className="text-2xl font-bold text-gray-900">
                {organization.activeDomainsCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Multi-Domain Discount</p>
              <p className="text-2xl font-bold text-green-600">
                {(organization.appliedDiscount * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">£{organization.totalMRR.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Period Info */}
        {subscription.current_period_start && subscription.current_period_end && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Current Billing Period:</span>{' '}
              {new Date(subscription.current_period_start).toLocaleDateString()} -{' '}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Change Plan
          </button>
          <button className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
            View Invoices
          </button>
          {!subscription.cancel_at_period_end && subscription.status === 'active' && (
            <button className="flex-1 px-4 py-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors">
              Cancel Subscription
            </button>
          )}
        </div>

        {/* Feature List */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Included Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(tier.features || {}).map(([feature, included]) => (
              included && (
                <div key={feature} className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{feature.replace(/_/g, ' ')}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
