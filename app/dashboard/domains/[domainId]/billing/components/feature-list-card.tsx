/**
 * Feature List Card Component
 *
 * Displays included features for the current subscription tier
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

import { PricingTier } from '@/lib/billing/domain-subscriptions';

interface FeatureListCardProps {
  tier: PricingTier;
}

export function FeatureListCard({ tier }: FeatureListCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Included Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(tier.features || {}).map(
          ([feature, included]) =>
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
        )}
      </div>
    </div>
  );
}
