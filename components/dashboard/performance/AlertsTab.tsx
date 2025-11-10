/**
 * Alerts Tab Component
 *
 * Displays alert statistics and active alerts list
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import type { WidgetMetrics } from '@/hooks/usePerformanceData';

interface AlertsTabProps {
  metrics: WidgetMetrics;
}

export function AlertsTab({ metrics }: AlertsTabProps) {
  return (
    <div className="space-y-4">
      {/* Alert Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{metrics.alerts.stats.total}</p>
              <p className="text-sm text-gray-500">Total Alerts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {metrics.alerts.stats.unresolved}
              </p>
              <p className="text-sm text-gray-500">Unresolved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {metrics.alerts.stats.bySeverity.critical || 0}
              </p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {metrics.alerts.stats.bySeverity.error || 0}
              </p>
              <p className="text-sm text-gray-500">Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Most recent unresolved alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.alerts.active.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No active alerts</p>
              <p className="text-sm">All systems operational</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.alerts.active.map((alert) => (
                <Alert key={alert.id}>
                  <div className="flex items-start gap-3">
                    <Badge
                      variant={
                        alert.severity === 'critical' || alert.severity === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="mt-1"
                    >
                      {alert.severity}
                    </Badge>
                    <div className="flex-1">
                      <AlertTitle className="font-semibold">
                        {alert.title}
                      </AlertTitle>
                      <AlertDescription className="text-sm mt-1">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Category: {alert.category}</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
