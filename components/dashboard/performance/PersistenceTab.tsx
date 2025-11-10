/**
 * Persistence Tab Component
 *
 * Displays persistence operations, session restoration, and navigation metrics
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, RefreshCw, Activity } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { WidgetMetrics } from '@/hooks/usePerformanceData';

interface PersistenceTabProps {
  metrics: WidgetMetrics;
}

export function PersistenceTab({ metrics }: PersistenceTabProps) {
  return (
    <div className="space-y-4">
      {/* Persistence Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Persistence Operations</CardTitle>
          <CardDescription>
            Storage operations and reliability metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Success Rate"
              value={`${metrics.persistence.operations.successRate.toFixed(2)}%`}
              icon={<CheckCircle className="h-5 w-5" />}
              status={
                metrics.persistence.operations.successRate >= 99
                  ? 'good'
                  : metrics.persistence.operations.successRate >= 95
                    ? 'warning'
                    : 'bad'
              }
              subtitle={`${metrics.persistence.operations.successful} / ${metrics.persistence.operations.total} operations`}
            />
            <MetricCard
              title="Avg Duration"
              value={`${metrics.persistence.performance.avgDuration.toFixed(0)}ms`}
              icon={<Clock className="h-5 w-5" />}
              status={
                metrics.persistence.performance.avgDuration < 100
                  ? 'good'
                  : metrics.persistence.performance.avgDuration < 200
                    ? 'warning'
                    : 'bad'
              }
              subtitle={`P95: ${metrics.persistence.performance.p95Duration.toFixed(0)}ms`}
            />
            <MetricCard
              title="Data Loss"
              value={metrics.persistence.reliability.dataLossIncidents.toString()}
              icon={<XCircle className="h-5 w-5" />}
              status={
                metrics.persistence.reliability.dataLossIncidents === 0
                  ? 'good'
                  : 'bad'
              }
              subtitle="incidents"
            />
          </div>
        </CardContent>
      </Card>

      {/* Session Restoration */}
      <Card>
        <CardHeader>
          <CardTitle>Session Restoration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Success Rate"
              value={`${metrics.persistence.restoration.successRate.toFixed(1)}%`}
              icon={<RefreshCw className="h-5 w-5" />}
              status={
                metrics.persistence.restoration.successRate >= 99
                  ? 'good'
                  : 'warning'
              }
              subtitle={`${metrics.persistence.restoration.total} total`}
            />
            <MetricCard
              title="Restore Time"
              value={`${metrics.persistence.restoration.avgDuration.toFixed(0)}ms`}
              icon={<Clock className="h-5 w-5" />}
              status={
                metrics.persistence.restoration.avgDuration < 200
                  ? 'good'
                  : 'warning'
              }
              subtitle="average"
            />
            <MetricCard
              title="Messages Restored"
              value={metrics.persistence.restoration.avgMessagesRestored.toFixed(1)}
              icon={<Activity className="h-5 w-5" />}
              status="good"
              subtitle="per session"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cross-Page Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Page Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Navigations"
              value={metrics.persistence.navigation.total.toString()}
              icon={<Activity className="h-5 w-5" />}
              status="neutral"
            />
            <MetricCard
              title="Data Preserved"
              value={`${metrics.persistence.navigation.dataPreservedCount} / ${metrics.persistence.navigation.total}`}
              icon={<CheckCircle className="h-5 w-5" />}
              status={
                metrics.persistence.navigation.dataLossCount === 0
                  ? 'good'
                  : 'bad'
              }
            />
            <MetricCard
              title="Avg Duration"
              value={`${metrics.persistence.navigation.avgDuration.toFixed(0)}ms`}
              icon={<Clock className="h-5 w-5" />}
              status={
                metrics.persistence.navigation.avgDuration < 100
                  ? 'good'
                  : 'warning'
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
