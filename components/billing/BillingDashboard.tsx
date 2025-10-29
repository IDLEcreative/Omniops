'use client';

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionCard } from './SubscriptionCard';
import { InvoiceHistory } from './InvoiceHistory';
import { PlanSelector } from './PlanSelector';

interface Organization {
  id: string;
  name: string;
  planType?: string;
  role: string;
}

interface BillingDashboardProps {
  organizations: Organization[];
}

interface Subscription {
  hasSubscription: boolean;
  subscription?: {
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    planType?: string;
  };
}

export default function BillingDashboard({ organizations }: BillingDashboardProps) {
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stripe/subscription?organizationId=${selectedOrgId}`);
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (selectedOrgId) {
      fetchSubscription();
    }
  }, [selectedOrgId, fetchSubscription]);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const canManageBilling = selectedOrg && ['owner', 'admin'].includes(selectedOrg.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
      </div>

      {/* Organization Selector */}
      {organizations.length > 1 && (
        <div>
          <label className="block text-sm font-medium mb-2">Select Organization</label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full max-w-md px-4 py-2 border rounded-lg"
          >
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.planType || 'No plan'})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading subscription details...</div>
      ) : (
        <>
          {subscription?.hasSubscription ? (
            <SubscriptionCard
              subscription={subscription.subscription!}
              organizationId={selectedOrgId}
              canManage={canManageBilling || false}
              onUpdate={fetchSubscription}
            />
          ) : (
            <PlanSelector
              organizationId={selectedOrgId}
              canManage={canManageBilling || false}
            />
          )}

          {subscription?.hasSubscription && (
            <InvoiceHistory organizationId={selectedOrgId} />
          )}
        </>
      )}
    </div>
  );
}
