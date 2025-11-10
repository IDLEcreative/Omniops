/**
 * Custom hook for fetching and managing performance metrics data
 *
 * Handles:
 * - Fetching metrics from monitoring API
 * - Auto-refresh functionality
 * - Loading and error states
 * - Polling interval management
 */

import { useEffect, useState, useCallback } from 'react';

export interface WidgetMetrics {
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

export interface UsePerformanceDataResult {
  metrics: WidgetMetrics | null;
  loading: boolean;
  error: string | null;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  refresh: () => Promise<void>;
}

const REFRESH_INTERVAL_MS = 30000; // 30 seconds
const API_ENDPOINT = '/api/monitoring/widget?window=300000';

/**
 * Hook for managing performance metrics data fetching
 */
export function usePerformanceData(): UsePerformanceDataResult {
  const [metrics, setMetrics] = useState<WidgetMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    autoRefresh,
    setAutoRefresh,
    refresh: fetchMetrics,
  };
}
