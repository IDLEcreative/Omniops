'use client';

/**
 * Search Telemetry Dashboard Component
 * Displays real-time metrics for provider health, retry patterns, and domain lookup effectiveness
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ProviderHealthMetric {
  platform: string;
  successRate: number;
  avgDuration: number;
  totalAttempts: number;
}

interface RetryPatterns {
  avgRetries: number;
  successRate: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
}

interface DomainLookup {
  methodDistribution: Record<string, number>;
  avgDuration: number;
  successRate: number;
}

interface CircuitBreaker {
  openEvents: number;
  halfOpenEvents: number;
  avgFailuresBeforeOpen: number;
}

interface TelemetryData {
  providerHealth: ProviderHealthMetric[];
  retryPatterns: RetryPatterns;
  domainLookup: DomainLookup;
  circuitBreaker: CircuitBreaker;
}

interface Props {
  timePeriodHours?: number;
  autoRefreshSeconds?: number;
}

export function SearchTelemetryDashboard({
  timePeriodHours = 24,
  autoRefreshSeconds = 30
}: Props) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/search-telemetry?metric=all&hours=${timePeriodHours}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch telemetry: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[Telemetry Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timePeriodHours]);

  useEffect(() => {
    fetchTelemetry();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchTelemetry();
    }, autoRefreshSeconds * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshSeconds, fetchTelemetry]);

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatDuration = (ms: number) => `${ms.toFixed(0)}ms`;
  const formatNumber = (value: number) => value.toFixed(2);

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 0.95) return <Badge className="bg-green-500">Excellent</Badge>;
    if (rate >= 0.85) return <Badge className="bg-yellow-500">Good</Badge>;
    if (rate >= 0.70) return <Badge className="bg-orange-500">Fair</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-muted-foreground">Loading telemetry data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No telemetry data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Search Telemetry Dashboard</h2>
          <p className="text-muted-foreground">
            Last {timePeriodHours} hours
            {lastRefresh && (
              <span className="ml-2 text-sm">
                (Updated {lastRefresh.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchTelemetry} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Provider Health */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Health</CardTitle>
          <CardDescription>Success rates and performance by platform</CardDescription>
        </CardHeader>
        <CardContent>
          {data.providerHealth.length === 0 ? (
            <p className="text-muted-foreground">No provider resolution attempts recorded</p>
          ) : (
            <div className="space-y-4">
              {data.providerHealth.map((metric) => (
                <div key={metric.platform} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="font-medium capitalize">{metric.platform || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">
                      {metric.totalAttempts} attempts
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <div className="font-medium">{formatPercentage(metric.successRate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Avg Duration</div>
                      <div className="font-medium">{formatDuration(metric.avgDuration)}</div>
                    </div>
                    {getSuccessRateBadge(metric.successRate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retry Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Retry Patterns</CardTitle>
          <CardDescription>Retry effectiveness and latency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Avg Retries</div>
              <div className="text-2xl font-bold">{formatNumber(data.retryPatterns.avgRetries)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <div className="text-2xl font-bold">
                {formatPercentage(data.retryPatterns.successRate)}
              </div>
              {getSuccessRateBadge(data.retryPatterns.successRate)}
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">P50 Duration</div>
              <div className="text-2xl font-bold">
                {formatDuration(data.retryPatterns.p50Duration)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">P95 Duration</div>
              <div className="text-2xl font-bold">
                {formatDuration(data.retryPatterns.p95Duration)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">P99 Duration</div>
              <div className="text-2xl font-bold">
                {formatDuration(data.retryPatterns.p99Duration)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Lookup Effectiveness</CardTitle>
          <CardDescription>Cache performance and fallback methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="text-2xl font-bold">
                  {formatPercentage(data.domainLookup.successRate)}
                </div>
                {getSuccessRateBadge(data.domainLookup.successRate)}
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Avg Duration</div>
                <div className="text-2xl font-bold">
                  {formatDuration(data.domainLookup.avgDuration)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Method Distribution</h4>
              <div className="space-y-2">
                {Object.entries(data.domainLookup.methodDistribution).map(([method, count]) => {
                  const total = Object.values(data.domainLookup.methodDistribution).reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = (count / total) * 100;
                  return (
                    <div key={method} className="flex items-center gap-2">
                      <div className="w-32 text-sm capitalize">{method.replace(/-/g, ' ')}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-20 text-right text-sm font-medium">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Circuit Breaker */}
      <Card>
        <CardHeader>
          <CardTitle>Circuit Breaker Status</CardTitle>
          <CardDescription>Failure protection and circuit state transitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Open Events</div>
              <div className="text-2xl font-bold">{data.circuitBreaker.openEvents}</div>
              {data.circuitBreaker.openEvents === 0 ? (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Healthy
                </Badge>
              ) : (
                <Badge className="bg-yellow-500">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Has Issues
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Half-Open Events</div>
              <div className="text-2xl font-bold">{data.circuitBreaker.halfOpenEvents}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Avg Failures Before Open</div>
              <div className="text-2xl font-bold">
                {formatNumber(data.circuitBreaker.avgFailuresBeforeOpen)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
