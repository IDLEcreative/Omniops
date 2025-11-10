/**
 * Billing Period Info Component
 *
 * Displays current billing period dates
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

import { DomainSubscription } from '@/lib/billing/domain-subscriptions';

interface BillingPeriodInfoProps {
  subscription: Pick<DomainSubscription, 'current_period_start' | 'current_period_end'>;
}

export function BillingPeriodInfo({ subscription }: BillingPeriodInfoProps) {
  if (!subscription.current_period_start || !subscription.current_period_end) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <p className="text-sm text-gray-600">
        <span className="font-semibold">Current Billing Period:</span>{' '}
        {new Date(subscription.current_period_start).toLocaleDateString()} -{' '}
        {new Date(subscription.current_period_end).toLocaleDateString()}
      </p>
    </div>
  );
}
