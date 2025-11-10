/**
 * Overage Charges Card Component
 *
 * Displays overage conversation charges when usage exceeds included limit
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

import { PricingTier } from '@/lib/billing/domain-subscriptions';

interface OverageChargesCardProps {
  currentMonth: {
    completedConversations: number;
    usagePercent: number;
    overageAmount: number;
    estimatedOverageCharge: number;
  };
  tier: PricingTier;
}

export function OverageChargesCard({ currentMonth, tier }: OverageChargesCardProps) {
  if (currentMonth.overageAmount <= 0) {
    return null;
  }

  return (
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
          <span className="font-semibold text-gray-900">£{tier.overage_rate.toFixed(2)}</span>
        </div>
        <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
          <span className="font-semibold text-gray-900">Estimated Overage Charge</span>
          <span className="text-lg font-bold text-red-600">
            £{currentMonth.estimatedOverageCharge.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
