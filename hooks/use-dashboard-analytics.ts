import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardAnalyticsData } from '@/types/dashboard';

export type { DashboardAnalyticsData } from '@/types/dashboard';

interface DashboardAnalyticsOptions {
  days?: number;
  disabled?: boolean;
}

interface UseDashboardAnalyticsResult {
  data: DashboardAnalyticsData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useDashboardAnalytics(
  options: DashboardAnalyticsOptions = {},
): UseDashboardAnalyticsResult {
  const { days = 7, disabled = false } = options;
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (disabled) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ days: days.toString() });
      const response = await fetch(`/api/dashboard/analytics?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load analytics (${response.status})`);
      }

      const payload = (await response.json()) as DashboardAnalyticsData;
      setData(payload);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err as Error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, disabled]);

  useEffect(() => {
    fetchAnalytics();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchAnalytics]);

  const refresh = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, refresh };
}
