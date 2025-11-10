/**
 * Billing Actions Component
 *
 * Displays action buttons for managing subscription
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

import { DomainSubscription } from '@/lib/billing/domain-subscriptions';

interface BillingActionsProps {
  subscription: Pick<DomainSubscription, 'cancel_at_period_end' | 'status'>;
}

export function BillingActions({ subscription }: BillingActionsProps) {
  return (
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
  );
}
