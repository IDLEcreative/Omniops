/**
 * useQueueStats Hook
 *
 * Fetches queue statistics and health status with optional auto-refresh.
 */

import { useState, useEffect, useCallback } from 'react';

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueHealth {
  healthy: boolean;
  redisConnected: boolean;
  queueName: string;
  stats?: QueueStats;
  lastCheck?: string;
}

interface UseQueueStatsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useQueueStats(options: UseQueueStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 5000 } = options;

  const [stats, setStats] = useState<QueueStats | null>(null);
  const [health, setHealth] = useState<QueueHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/autonomous/operations/queue/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch queue stats');
      }

      const data = await response.json();
      setStats(data.stats || null);
      setHealth(data.health || null);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch queue stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStats]);

  return {
    stats,
    health,
    loading,
    error,
    refresh,
  };
}
