/**
 * Active Alerts Card Component
 *
 * Displays active alerts with severity badges
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { WidgetMetrics } from '@/hooks/usePerformanceData';

interface ActiveAlertsCardProps {
  metrics: WidgetMetrics;
}

export function ActiveAlertsCard({ metrics }: ActiveAlertsCardProps) {
  if (metrics.alerts.active.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Active Alerts ({metrics.alerts.active.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {metrics.alerts.active.slice(0, 5).map((alert) => (
            <Alert key={alert.id} variant="default">
              <div className="flex items-start gap-2">
                <Badge
                  variant={
                    alert.severity === 'critical'
                      ? 'destructive'
                      : alert.severity === 'error'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {alert.severity}
                </Badge>
                <div className="flex-1">
                  <AlertTitle className="text-sm font-semibold">
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {alert.message}
                  </AlertDescription>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
