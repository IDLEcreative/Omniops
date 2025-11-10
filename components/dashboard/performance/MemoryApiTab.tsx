/**
 * Memory & API Tab Component
 *
 * Displays memory usage, API performance, and bundle loading metrics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MemoryStick, TrendingUp, Activity, Network, Clock, XCircle, Database } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { WidgetMetrics } from '@/hooks/usePerformanceData';

interface MemoryApiTabProps {
  metrics: WidgetMetrics;
}

export function MemoryApiTab({ metrics }: MemoryApiTabProps) {
  return (
    <div className="space-y-4">
      {/* Memory Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Current"
              value={`${metrics.performance.memory.current.mb.toFixed(1)}MB`}
              icon={<MemoryStick className="h-5 w-5" />}
              status={
                metrics.performance.memory.current.mb < 30
                  ? 'good'
                  : metrics.performance.memory.current.mb < 50
                    ? 'warning'
                    : 'bad'
              }
            />
            <MetricCard
              title="Peak"
              value={`${metrics.performance.memory.peak.mb.toFixed(1)}MB`}
              icon={<TrendingUp className="h-5 w-5" />}
              status={
                metrics.performance.memory.peak.mb < 50
                  ? 'good'
                  : metrics.performance.memory.peak.mb < 75
                    ? 'warning'
                    : 'bad'
              }
            />
            <MetricCard
              title="Average"
              value={`${metrics.performance.memory.average.mb.toFixed(1)}MB`}
              icon={<Activity className="h-5 w-5" />}
              status={
                metrics.performance.memory.average.mb < 40 ? 'good' : 'warning'
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle>API Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Calls"
              value={metrics.performance.api.totalCalls.toString()}
              icon={<Network className="h-5 w-5" />}
              status="neutral"
            />
            <MetricCard
              title="Avg Duration"
              value={`${metrics.performance.api.avgDuration.toFixed(0)}ms`}
              icon={<Clock className="h-5 w-5" />}
              status={
                metrics.performance.api.avgDuration < 300
                  ? 'good'
                  : metrics.performance.api.avgDuration < 500
                    ? 'warning'
                    : 'bad'
              }
              subtitle={`P95: ${metrics.performance.api.p95Duration.toFixed(0)}ms`}
            />
            <MetricCard
              title="Error Rate"
              value={`${metrics.performance.api.errorRate.toFixed(1)}%`}
              icon={<XCircle className="h-5 w-5" />}
              status={
                metrics.performance.api.errorRate < 1
                  ? 'good'
                  : metrics.performance.api.errorRate < 5
                    ? 'warning'
                    : 'bad'
              }
            />
          </div>
          <div className="mt-4">
            <MetricCard
              title="Cache Hit Rate"
              value={`${metrics.performance.api.cacheHitRate.toFixed(1)}%`}
              icon={<Database className="h-5 w-5" />}
              status={
                metrics.performance.api.cacheHitRate > 60
                  ? 'good'
                  : metrics.performance.api.cacheHitRate > 40
                    ? 'warning'
                    : 'bad'
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Bundle Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Bundle Loading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Size"
              value={`${metrics.performance.bundles.totalSize.kb.toFixed(0)}KB`}
              icon={<Activity className="h-5 w-5" />}
              status={
                metrics.performance.bundles.totalSize.kb < 500
                  ? 'good'
                  : metrics.performance.bundles.totalSize.kb < 1000
                    ? 'warning'
                    : 'bad'
              }
            />
            <MetricCard
              title="Avg Load Time"
              value={`${metrics.performance.bundles.avgLoadTime.toFixed(0)}ms`}
              icon={<Clock className="h-5 w-5" />}
              status={
                metrics.performance.bundles.avgLoadTime < 500
                  ? 'good'
                  : metrics.performance.bundles.avgLoadTime < 1000
                    ? 'warning'
                    : 'bad'
              }
            />
            <MetricCard
              title="Cache Hit Rate"
              value={`${metrics.performance.bundles.cacheHitRate.toFixed(1)}%`}
              icon={<Database className="h-5 w-5" />}
              status={
                metrics.performance.bundles.cacheHitRate > 70
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
