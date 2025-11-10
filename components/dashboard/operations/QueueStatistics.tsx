/**
 * Queue Statistics Component
 *
 * Displays real-time queue health and job statistics.
 */

'use client';

import { QueueStats, QueueHealth } from '@/hooks/useQueueStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle,
  PauseCircle,
  Timer,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface QueueStatisticsProps {
  stats: QueueStats | null;
  health: QueueHealth | null;
  loading: boolean;
}

export function QueueStatistics({ stats, health, loading }: QueueStatisticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Waiting',
      value: stats?.waiting || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Active',
      value: stats?.active || 0,
      icon: PlayCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Failed',
      value: stats?.failed || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Delayed',
      value: stats?.delayed || 0,
      icon: Timer,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Paused',
      value: stats?.paused || 0,
      icon: PauseCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  const successRate = stats
    ? stats.completed + stats.failed > 0
      ? ((stats.completed / (stats.completed + stats.failed)) * 100).toFixed(1)
      : '0.0'
    : '0.0';

  return (
    <div className="space-y-4">
      {/* Health Status Banner */}
      {health && (
        <Card className={health.healthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {health.healthy ? (
                <Activity className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${health.healthy ? 'text-green-900' : 'text-red-900'}`}>
                  {health.healthy ? 'Queue System Healthy' : 'Queue System Unhealthy'}
                </p>
                <p className={`text-sm ${health.healthy ? 'text-green-700' : 'text-red-700'}`}>
                  Redis: {health.redisConnected ? 'Connected' : 'Disconnected'} • Queue: {health.queueName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
