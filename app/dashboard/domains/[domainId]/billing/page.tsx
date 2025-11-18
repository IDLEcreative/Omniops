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

import { use } from 'react';
import { useBillingData } from '@/hooks/billing/use-billing-data';
import { LoadingState } from './components/loading-state';
import { ErrorState } from './components/error-state';
import { CurrentPlanCard } from './components/current-plan-card';
import { UsageCard } from './components/usage-card';
import { OverageChargesCard } from './components/overage-charges-card';
import { OrganizationOverviewCard } from './components/organization-overview-card';
import { BillingPeriodInfo } from './components/billing-period-info';
import { BillingActions } from './components/billing-actions';
import { FeatureListCard } from './components/feature-list-card';

interface BillingPageProps {
  params: Promise<{
    domainId: string;
  }>;
}

export default function BillingPage(props: BillingPageProps) {
  const params = use(props.params);
  const { loading, billingData, error } = useBillingData(params.domainId);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !billingData) {
    return <ErrorState error={error} />;
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

        {/* Current Plan */}
        <CurrentPlanCard subscription={subscription} />

        {/* Usage */}
        <UsageCard currentMonth={currentMonth} tier={tier} />

        {/* Overage Charges */}
        <OverageChargesCard currentMonth={currentMonth} tier={tier} />

        {/* Organization Overview */}
        <OrganizationOverviewCard organization={organization} />

        {/* Billing Period */}
        <BillingPeriodInfo subscription={subscription} />

        {/* Action Buttons */}
        <BillingActions subscription={subscription} />

        {/* Feature List */}
        <FeatureListCard tier={tier} />
      </div>
    </div>
  );
}
