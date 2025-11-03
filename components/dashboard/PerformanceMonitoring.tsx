'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Gauge,
  MemoryStick,
  Network,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
  XCircle,
} from 'lucide-react';

interface WidgetMetrics {
  timestamp: string;
  timeWindow: number;
  health: {
    overall: number;
    scores: {
      persistence: number;
      performance: number;
      memory: number;
      api: number;
    };
    status: 'healthy' | 'degraded' | 'unhealthy';
  };
  persistence: {
    operations: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    };
    performance: {
      avgDuration: number;
      p50Duration: number;
      p95Duration: number;
      p99Duration: number;
    };
    reliability: {
      dataLossIncidents: number;
      errorsByType: Record<string, number>;
    };
    restoration: {
      total: number;
      successRate: number;
      avgDuration: number;
      avgMessagesRestored: number;
      errorsByType: Record<string, number>;
    };
    navigation: {
      total: number;
      successCount: number;
      dataPreservedCount: number;
      dataLossCount: number;
      avgDuration: number;
    };
  };
  performance: {
    renders: {
      count: number;
      avgTime: number;
      p95Time: number;
      slowRenders: number;
      slowRenderRate: number;
    };
    scroll: {
      avgFps: number;
      minFps: number;
      jankPercentage: number;
    };
    memory: {
      current: { bytes: number; mb: number };
      peak: { bytes: number; mb: number };
      average: { bytes: number; mb: number };
    };
    tabSync: {
      operations: number;
      avgLatency: number;
      p95Latency: number;
      failures: number;
      failureRate: number;
    };
    api: {
      totalCalls: number;
      avgDuration: number;
      p95Duration: number;
      errorRate: number;
      cacheHitRate: number;
    };
    bundles: {
      totalLoaded: number;
      totalSize: { bytes: number; kb: number; mb: number };
      avgLoadTime: number;
      cacheHitRate: number;
    };
  };
  alerts: {
    active: Array<{
      id: string;
      severity: 'info' | 'warning' | 'error' | 'critical';
      category: string;
      title: string;
      message: string;
      timestamp: string;
    }>;
    stats: {
      total: number;
      unresolved: number;
      bySeverity: Record<string, number>;
      byCategory: Record<string, number>;
    };
  };
}

export default function PerformanceMonitoring() {
  const [metrics, setMetrics] = useState<WidgetMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/widget?window=300000');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Metrics</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Widget Performance</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time monitoring of chat widget performance and reliability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-sm rounded-md ${
              autoRefresh
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
          </button>
          <button
            onClick={fetchMetrics}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overall Health</CardTitle>
              <CardDescription>
                Last updated: {new Date(metrics.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Badge
              variant={
                metrics.health.status === 'healthy'
                  ? 'default'
                  : metrics.health.status === 'degraded'
                    ? 'secondary'
                    : 'destructive'
              }
              className="text-lg px-4 py-2"
            >
              {metrics.health.overall}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <HealthScore
              label="Persistence"
              score={metrics.health.scores.persistence}
              icon={<Database className="h-5 w-5" />}
              target={99}
            />
            <HealthScore
              label="Performance"
              score={metrics.health.scores.performance}
              icon={<Zap className="h-5 w-5" />}
              target={90}
            />
            <HealthScore
              label="Memory"
              score={metrics.health.scores.memory}
              icon={<MemoryStick className="h-5 w-5" />}
              target={85}
            />
            <HealthScore
              label="API"
              score={metrics.health.scores.api}
              icon={<Network className="h-5 w-5" />}
              target={95}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {metrics.alerts.active.length > 0 && (
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
      )}

      {/* Detailed Metrics */}
      <Tabs defaultValue="persistence" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="persistence">Persistence</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="memory">Memory & API</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Persistence Tab */}
        <TabsContent value="persistence" className="space-y-4">
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
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
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
        </TabsContent>

        {/* Memory & API Tab */}
        <TabsContent value="memory" className="space-y-4">
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
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
interface HealthScoreProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  target: number;
}

function HealthScore({ label, score, icon, target }: HealthScoreProps) {
  const status = score >= target ? 'good' : score >= target - 10 ? 'warning' : 'bad';
  const color =
    status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="text-center">
      <div className={`flex items-center justify-center mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold">{score}%</p>
      <p className="text-sm text-gray-500">{label}</p>
      <Progress value={score} className="mt-2 h-2" />
      <p className="text-xs text-gray-400 mt-1">Target: {target}%</p>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'bad' | 'neutral';
  subtitle?: string;
}

function MetricCard({ title, value, icon, status = 'neutral', subtitle }: MetricCardProps) {
  const statusColor =
    status === 'good'
      ? 'text-green-600'
      : status === 'warning'
        ? 'text-yellow-600'
        : status === 'bad'
          ? 'text-red-600'
          : 'text-gray-600';

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={statusColor}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
