'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  TrendingUp,
  Zap
} from 'lucide-react';

interface PerformanceMonitorCardProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface PerformanceData {
  timestamp: string;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
  errorRate: number;
}

export function PerformanceMonitorCard({
  autoRefresh = true,
  refreshInterval = 30000
}: PerformanceMonitorCardProps) {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/metrics?format=json');
      const result = await response.json();

      if (result.operations) {
        // Transform data for charts
        const chartData = result.operations.map((op: any) => ({
          timestamp: new Date().toLocaleTimeString(),
          operation: op.operation,
          p50: op.p50,
          p95: op.p95,
          p99: op.p99,
          throughput: op.throughput,
          errorRate: (1 - op.successRate) * 100,
          count: op.count
        }));

        setData(prev => {
          const newData = [...prev, ...chartData];
          // Keep only last 20 data points for real-time chart
          return newData.slice(-20);
        });

        // Calculate summary statistics
        const avgP95 = result.operations.reduce((acc: number, op: any) => acc + op.p95, 0) / result.operations.length;
        const totalThroughput = result.operations.reduce((acc: number, op: any) => acc + op.throughput, 0);
        const avgErrorRate = result.operations.reduce((acc: number, op: any) => acc + (1 - op.successRate), 0) / result.operations.length * 100;

        setSummary({
          avgP95,
          totalThroughput,
          avgErrorRate,
          healthScore: calculateHealthScore(avgP95, avgErrorRate),
          operations: result.operations
        });

        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchMetrics, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  const calculateHealthScore = (avgP95: number, errorRate: number): number => {
    let score = 100;

    // Deduct points for high latency
    if (avgP95 > 1000) score -= 20;
    else if (avgP95 > 500) score -= 10;
    else if (avgP95 > 200) score -= 5;

    // Deduct points for errors
    score -= errorRate * 10;

    return Math.max(0, Math.min(100, score));
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', icon: CheckCircle };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600', icon: Activity };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600', icon: AlertTriangle };
    return { label: 'Poor', color: 'text-red-600', icon: AlertTriangle };
  };

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardContent>
      </Card>
    );
  }

  const healthStatus = summary ? getHealthStatus(summary.healthScore) : null;
  const HealthIcon = healthStatus?.icon || Activity;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <CardDescription>
              Real-time system performance metrics
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {autoRefresh && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="h-3 w-3 animate-pulse" />
                Live
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Score Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <HealthIcon className={`h-5 w-5 ${healthStatus?.color}`} />
                  <Badge variant="outline">{healthStatus?.label}</Badge>
                </div>
                <p className="text-2xl font-bold">{summary.healthScore.toFixed(0)}</p>
                <p className="text-xs text-gray-500">Health Score</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{summary.avgP95.toFixed(0)}ms</p>
                <p className="text-xs text-gray-500">Avg P95 Latency</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold">{summary.totalThroughput.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Req/sec</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold">{summary.avgErrorRate.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">Error Rate</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Latency Chart */}
        {data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Latency Percentiles (Real-time)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height="200">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="p50Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="p95Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="p99Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ffc658" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `${value}ms`} />
                  <Legend />
                  <ReferenceLine y={1000} label="SLA Limit" stroke="red" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="p50" stroke="#8884d8" fill="url(#p50Gradient)" />
                  <Area type="monotone" dataKey="p95" stroke="#82ca9d" fill="url(#p95Gradient)" />
                  <Area type="monotone" dataKey="p99" stroke="#ffc658" fill="url(#p99Gradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Operation Breakdown */}
        {summary?.operations && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Operation Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.operations.slice(0, 5).map((op: any) => (
                  <div key={op.operation} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{op.operation}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {op.count} calls
                        </Badge>
                        <Badge
                          variant={op.successRate > 0.95 ? "outline" : "destructive"}
                          className="text-xs"
                        >
                          {(op.successRate * 100).toFixed(1)}% success
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>P50: {op.p50}ms</span>
                      <span>P95: {op.p95}ms</span>
                      <span>P99: {op.p99}ms</span>
                      <span>Throughput: {op.throughput.toFixed(2)}/s</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {summary && summary.avgErrorRate > 5 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              High error rate detected ({summary.avgErrorRate.toFixed(2)}%).
              Review failed operations and system logs.
            </AlertDescription>
          </Alert>
        )}

        {summary && summary.avgP95 > 1000 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              P95 latency exceeds 1 second ({summary.avgP95.toFixed(0)}ms).
              Consider performance optimization.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}