/**
 * Performance Tab Component
 *
 * Displays render performance, scroll performance, and tab synchronization metrics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Activity, TrendingDown, Gauge, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { WidgetMetrics } from '@/hooks/usePerformanceData';

interface PerformanceTabProps {
  metrics: WidgetMetrics;
}

export function PerformanceTab({ metrics }: PerformanceTabProps) {
  return (
    <div className="space-y-4">
      {/* Render Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Render Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Avg Render Time"
              value={`${metrics.performance.renders.avgTime.toFixed(1)}ms`}
              icon={<Zap className="h-5 w-5" />}
              status={
                metrics.performance.renders.avgTime < 16
                  ? 'good'
                  : metrics.performance.renders.avgTime < 32
                    ? 'warning'
                    : 'bad'
              }
              subtitle={`P95: ${metrics.performance.renders.p95Time.toFixed(1)}ms`}
            />
            <MetricCard
              title="Total Renders"
              value={metrics.performance.renders.count.toString()}
              icon={<Activity className="h-5 w-5" />}
              status="neutral"
            />
            <MetricCard
              title="Slow Renders"
              value={`${metrics.performance.renders.slowRenderRate.toFixed(1)}%`}
              icon={<TrendingDown className="h-5 w-5" />}
              status={
                metrics.performance.renders.slowRenderRate < 5
                  ? 'good'
                  : metrics.performance.renders.slowRenderRate < 15
                    ? 'warning'
                    : 'bad'
              }
              subtitle={`${metrics.performance.renders.slowRenders} > 16ms`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scroll Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Scroll Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Average FPS"
              value={metrics.performance.scroll.avgFps.toFixed(1)}
              icon={<Gauge className="h-5 w-5" />}
              status={
                metrics.performance.scroll.avgFps >= 55
                  ? 'good'
                  : metrics.performance.scroll.avgFps >= 45
                    ? 'warning'
                    : 'bad'
              }
              subtitle="frames per second"
            />
            <MetricCard
              title="Min FPS"
              value={metrics.performance.scroll.minFps.toFixed(1)}
              icon={<TrendingDown className="h-5 w-5" />}
              status={
                metrics.performance.scroll.minFps >= 50 ? 'good' : 'warning'
              }
            />
            <MetricCard
              title="Jank"
              value={`${metrics.performance.scroll.jankPercentage.toFixed(1)}%`}
              icon={<AlertTriangle className="h-5 w-5" />}
              status={
                metrics.performance.scroll.jankPercentage < 5
                  ? 'good'
                  : metrics.performance.scroll.jankPercentage < 10
                    ? 'warning'
                    : 'bad'
              }
              subtitle="frames > 16ms"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab Synchronization */}
      <Card>
        <CardHeader>
          <CardTitle>Tab Synchronization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Operations"
              value={metrics.performance.tabSync.operations.toString()}
              icon={<Activity className="h-5 w-5" />}
              status="neutral"
            />
            <MetricCard
              title="Avg Latency"
              value={`${metrics.performance.tabSync.avgLatency.toFixed(0)}ms`}
              icon={<Clock className="h-5 w-5" />}
              status={
                metrics.performance.tabSync.avgLatency < 50
                  ? 'good'
                  : metrics.performance.tabSync.avgLatency < 100
                    ? 'warning'
                    : 'bad'
              }
              subtitle={`P95: ${metrics.performance.tabSync.p95Latency.toFixed(0)}ms`}
            />
            <MetricCard
              title="Failure Rate"
              value={`${metrics.performance.tabSync.failureRate.toFixed(1)}%`}
              icon={<XCircle className="h-5 w-5" />}
              status={
                metrics.performance.tabSync.failureRate < 1
                  ? 'good'
                  : metrics.performance.tabSync.failureRate < 5
                    ? 'warning'
                    : 'bad'
              }
              subtitle={`${metrics.performance.tabSync.failures} failures`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
