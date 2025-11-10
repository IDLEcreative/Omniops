/**
 * Usage Card Component
 *
 * Displays current month conversation usage with progress bar
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

import { PricingTier } from '@/lib/billing/domain-subscriptions';

interface UsageCardProps {
  currentMonth: {
    completedConversations: number;
    usagePercent: number;
    overageAmount: number;
    estimatedOverageCharge: number;
  };
  tier: PricingTier;
}

export function UsageCard({ currentMonth, tier }: UsageCardProps) {
  return (
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
  );
}
