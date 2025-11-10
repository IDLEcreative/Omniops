'use client';

import React, { useState, useMemo } from 'react';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LiveMetricsChart } from '@/components/dashboard/LiveMetricsChart';
import {
  Users,
  MessageSquare,
  Zap,
  Activity,
  RefreshCw,
  WifiOff,
  Wifi
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChartData {
  sessions: { timestamp: number; value: number }[];
  messages: { timestamp: number; value: number }[];
}

export default function RealtimeAnalyticsDashboard() {
  const {
    metrics,
    deltas,
    isConnected,
    isConnecting,
    error,
    reconnect
  } = useRealtimeAnalytics();

  const [chartData, setChartData] = useState<ChartData>({
    sessions: [],
    messages: []
  });

  // Update chart data when metrics change
  React.useEffect(() => {
    if (metrics) {
      setChartData(prev => ({
        sessions: [...prev.sessions, {
          timestamp: metrics.timestamp,
          value: metrics.activeSessions
        }].slice(-20), // Keep last 20 points
        messages: [...prev.messages, {
          timestamp: metrics.timestamp,
          value: metrics.messagesPerMinute
        }].slice(-20)
      }));
    }
  }, [metrics]);

  // Format duration from milliseconds to readable string
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Determine trends based on deltas
  const getTrend = (delta?: number): 'up' | 'down' | 'neutral' => {
    if (!delta) return 'neutral';
    if (delta > 0) return 'up';
    if (delta < 0) return 'down';
    return 'neutral';
  };

  const formatTrendValue = (delta?: number): string => {
    if (!delta) return '0';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Real-Time Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Live metrics updated every 2 seconds
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
              isConnected
                ? 'bg-green-100 text-green-800'
                : isConnecting
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            )}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Connected</span>
                </>
              ) : isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Disconnected</span>
                </>
              )}
            </div>

            {/* Reconnect Button */}
            {!isConnected && !isConnecting && (
              <button
                onClick={reconnect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                         transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Active Sessions"
            value={metrics?.activeSessions || 0}
            subtitle="Users currently chatting"
            trend={getTrend(deltas?.activeSessions)}
            trendValue={formatTrendValue(deltas?.activeSessions)}
            loading={!metrics && isConnecting}
            icon={<Users className="w-8 h-8 text-blue-600" />}
            color="default"
          />

          <MetricCard
            title="Messages/min"
            value={metrics?.messagesPerMinute || 0}
            subtitle="Current message rate"
            trend={getTrend(deltas?.messagesPerMinute)}
            trendValue={formatTrendValue(deltas?.messagesPerMinute)}
            loading={!metrics && isConnecting}
            icon={<MessageSquare className="w-8 h-8 text-green-600" />}
            color="success"
          />

          <MetricCard
            title="P50 Response Time"
            value={formatDuration(metrics?.responseTimes?.p50 || 0)}
            subtitle={`P95: ${formatDuration(metrics?.responseTimes?.p95 || 0)}`}
            loading={!metrics && isConnecting}
            icon={<Zap className="w-8 h-8 text-yellow-600" />}
            color={metrics?.responseTimes?.p50 && metrics.responseTimes.p50 > 2000 ? 'warning' : 'default'}
          />

          <MetricCard
            title="Avg Session Duration"
            value={formatDuration(metrics?.engagement?.avgDuration || 0)}
            subtitle={`${metrics?.engagement?.avgMessageCount?.toFixed(1) || 0} messages avg`}
            loading={!metrics && isConnecting}
            icon={<Activity className="w-8 h-8 text-purple-600" />}
            color="default"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <LiveMetricsChart
            data={chartData.sessions}
            title="Active Sessions Over Time"
            loading={!metrics && isConnecting}
            color="#3B82F6"
            showArea={true}
            yAxisLabel="Sessions"
            formatValue={(v) => v.toString()}
          />

          <LiveMetricsChart
            data={chartData.messages}
            title="Message Rate Over Time"
            loading={!metrics && isConnecting}
            color="#10B981"
            showArea={true}
            yAxisLabel="Messages/min"
            formatValue={(v) => v.toString()}
          />
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          {metrics?.activityFeed && metrics.activityFeed.length > 0 ? (
            <div className="space-y-2">
              {metrics.activityFeed.slice(0, 10).map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      activity.event_type === 'session_started' ? 'bg-green-500' :
                      activity.event_type === 'session_ended' ? 'bg-red-500' :
                      activity.event_type === 'message_sent' ? 'bg-blue-500' :
                      'bg-gray-500'
                    )} />
                    <span className="text-sm font-medium text-gray-700">
                      {activity.event_type?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'HH:mm:ss')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}