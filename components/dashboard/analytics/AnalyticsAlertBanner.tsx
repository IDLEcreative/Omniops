/**
 * Analytics Alert Banner Component
 *
 * Displays critical or warning alerts for analytics issues
 * (e.g., high response times, low engagement, performance degradation).
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { AnalyticsAlert } from '@/types/analytics';

interface AnalyticsAlertBannerProps {
  alert: AnalyticsAlert;
}

export function AnalyticsAlertBanner({ alert }: AnalyticsAlertBannerProps) {
  const variant = alert.type === 'critical' ? 'destructive' : 'default';

  return (
    <Alert variant={variant}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <span className="font-medium">{alert.category}:</span> {alert.message}
        {alert.value && alert.threshold && (
          <span className="ml-2 text-xs">
            (Current: {alert.value}, Threshold: {alert.threshold})
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
