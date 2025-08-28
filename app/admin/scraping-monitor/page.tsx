'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Cpu, Database, Users, Activity, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Type definitions for dashboard data
 */
interface DashboardData {
  overview: {
    systemStatus: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    lastUpdated: string;
  };
  queue: {
    activeJobs: number;
    waitingJobs: number;
    failedJobs: number;
    completedJobs: number;
    totalJobs: number;
    throughput: number;
    avgProcessingTime: number;
  };
  workers: {
    totalWorkers: number;
    activeWorkers: number;
    idleWorkers: number;
    failedWorkers: number;
    workerDetails: WorkerInfo[];
  };
  performance: {
    successRate: number;
    avgResponseTime: number;
    memoryUsage: number;
    redisStatus: 'connected' | 'disconnected' | 'degraded';
  };
  recentActivity: {
    completedJobs: JobActivity[];
    failedJobs: JobActivity[];
    alerts: AlertInfo[];
  };
  statistics: {
    today: DayStats;
    yesterday: DayStats;
  };
}

interface WorkerInfo {
  id: string;
  status: 'active' | 'idle' | 'failed' | 'unknown';
  currentJob?: string;
  processedJobs: number;
  errors: number;
  uptime: number;
}

interface JobActivity {
  id: string;
  type: string;
  url: string;
  status: 'completed' | 'failed';
  duration: number;
  timestamp: string;
  error?: string;
}

interface AlertInfo {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: Date;
}

interface DayStats {
  jobsProcessed: number;
  jobsSucceeded: number;
  jobsFailed: number;
  successRate: number;
}

/**
 * Main scraping monitor dashboard component
 */
export default function ScrapingMonitorPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch monitoring data from API
   */
  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setRefreshing(true);
      
      const response = await fetch('/api/monitoring/scraping');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch monitoring data');
      }
      
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching monitoring data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Manual refresh handler
   */
  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  /**
   * Toggle auto-refresh
   */
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  /**
   * Format uptime duration
   */
  const formatUptime = (uptimeMs: number) => {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  /**
   * Format duration in milliseconds
   */
  const formatDuration = (durationMs: number) => {
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${Math.round(durationMs / 100) / 10}s`;
    return `${Math.round(durationMs / 6000) / 10}min`;
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  /**
   * Get alert icon
   */
  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading scraping monitor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load monitoring data: {error}
            <Button variant="outline" className="ml-2" onClick={handleRefresh}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>No monitoring data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scraping System Monitor</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of the web scraping system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAutoRefresh}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(data.overview.systemStatus)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{data.overview.systemStatus}</div>
            <p className="text-xs text-muted-foreground">
              Uptime: {formatUptime(data.overview.uptime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.queue.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              {data.queue.waitingJobs} waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.workers.activeWorkers}</div>
            <p className="text-xs text-muted-foreground">
              of {data.workers.totalWorkers} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Queue Status
          </CardTitle>
          <CardDescription>Current state of the job queue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.queue.activeJobs}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.queue.waitingJobs}</div>
              <div className="text-sm text-muted-foreground">Waiting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.queue.completedJobs}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.queue.failedJobs}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.queue.totalJobs}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Throughput:</span>
              <span>{data.queue.throughput.toFixed(1)} jobs/min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Processing Time:</span>
              <span>{formatDuration(data.queue.avgProcessingTime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Cpu className="w-5 h-5 mr-2" />
              Worker Status
            </CardTitle>
            <CardDescription>Health and status of worker processes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">{data.workers.activeWorkers}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">{data.workers.idleWorkers}</div>
                  <div className="text-sm text-muted-foreground">Idle</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{data.workers.failedWorkers}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              {data.workers.workerDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Worker Details</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {data.workers.workerDetails.slice(0, 5).map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(worker.status)}`} />
                          <span>{worker.id}</span>
                        </div>
                        <div className="text-right">
                          <div>{worker.processedJobs} jobs</div>
                          <div className="text-xs text-muted-foreground">
                            {formatUptime(worker.uptime)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Performance Metrics
            </CardTitle>
            <CardDescription>System performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>{data.performance.memoryUsage.toFixed(1)}%</span>
                </div>
                <Progress value={data.performance.memoryUsage} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="text-lg font-semibold">{formatDuration(data.performance.avgResponseTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Redis Status</div>
                  <Badge className={`${getStatusColor(data.performance.redisStatus)} text-white`}>
                    {data.performance.redisStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {data.recentActivity.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Active Alerts
            </CardTitle>
            <CardDescription>Current system alerts and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentActivity.alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getAlertIcon(alert.level)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{alert.component}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{alert.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Recent Completions
            </CardTitle>
            <CardDescription>Latest successfully completed jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.completedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent completions</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.recentActivity.completedJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">{job.url}</div>
                      <div className="text-xs text-muted-foreground">{job.type}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div>{formatDuration(job.duration)}</div>
                      <div className="text-muted-foreground">
                        {new Date(job.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="w-5 h-5 mr-2 text-red-500" />
              Recent Failures
            </CardTitle>
            <CardDescription>Latest failed jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.failedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent failures</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.recentActivity.failedJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">{job.url}</div>
                      <div className="text-xs text-red-600 truncate">{job.error}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div>{formatDuration(job.duration)}</div>
                      <div className="text-muted-foreground">
                        {new Date(job.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Statistics
          </CardTitle>
          <CardDescription>Daily performance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Today</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Jobs Processed:</span>
                  <span className="text-sm font-medium">{data.statistics.today.jobsProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate:</span>
                  <span className="text-sm font-medium">{data.statistics.today.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Succeeded:</span>
                  <span className="text-sm font-medium text-green-600">{data.statistics.today.jobsSucceeded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Failed:</span>
                  <span className="text-sm font-medium text-red-600">{data.statistics.today.jobsFailed}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Yesterday</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Jobs Processed:</span>
                  <span className="text-sm font-medium">{data.statistics.yesterday.jobsProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate:</span>
                  <span className="text-sm font-medium">{data.statistics.yesterday.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Succeeded:</span>
                  <span className="text-sm font-medium text-green-600">{data.statistics.yesterday.jobsSucceeded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Failed:</span>
                  <span className="text-sm font-medium text-red-600">{data.statistics.yesterday.jobsFailed}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(data.overview.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}