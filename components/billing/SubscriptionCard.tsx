'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SubscriptionCardProps {
  subscription: {
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    planType?: string;
  };
  organizationId: string;
  canManage: boolean;
  onUpdate: () => void;
}

export function SubscriptionCard({ subscription, organizationId, canManage, onUpdate }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel? Your subscription will remain active until the end of the billing period.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      if (response.ok) {
        alert('Subscription will be canceled at the end of the billing period');
        onUpdate();
      } else {
        throw new Error('Failed to cancel');
      }
    } catch (error) {
      console.error('Error canceling:', error);
      alert('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      past_due: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
    };
    return colors[subscription.status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">Current Subscription</h2>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge()}`}>
              {subscription.status}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold capitalize">
              {subscription.planType || 'Active'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Current period start</p>
            <p className="font-medium">{new Date(subscription.currentPeriodStart).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current period end</p>
            <p className="font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-800">
              Your subscription will be canceled on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        )}

        {canManage && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
            </button>
            {!subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
