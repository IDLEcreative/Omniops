/**
 * Alert History Dashboard Page
 * View and manage triggered alerts
 */

import { Suspense } from 'react';
import { AlertHistoryView } from '@/components/analytics/AlertHistoryView';
import { AlertSettings } from '@/components/analytics/AlertSettings';

export const metadata = {
  title: 'Alert History | Analytics Dashboard',
  description: 'View and manage analytics alert history and thresholds',
};

export default function AlertsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Alert Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure thresholds and view alert history for your analytics metrics
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading settings...</div>}>
        <AlertSettings />
      </Suspense>

      <Suspense fallback={<div className="text-center py-8">Loading history...</div>}>
        <AlertHistoryView />
      </Suspense>
    </div>
  );
}
