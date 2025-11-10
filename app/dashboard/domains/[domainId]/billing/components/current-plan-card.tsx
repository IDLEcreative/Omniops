/**
 * Current Plan Card Component
 *
 * Displays subscription tier, pricing, and discount details
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

import { PricingTier, DomainSubscription } from '@/lib/billing/domain-subscriptions';

interface CurrentPlanCardProps {
  subscription: DomainSubscription & { pricing_tier: PricingTier };
}

export function CurrentPlanCard({ subscription }: CurrentPlanCardProps) {
  const tier = subscription.pricing_tier;

  return (
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
  );
}
