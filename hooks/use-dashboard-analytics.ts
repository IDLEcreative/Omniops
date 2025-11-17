import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardAnalyticsData } from '@/types/dashboard';

export type { DashboardAnalyticsData } from '@/types/dashboard';

interface DashboardAnalyticsOptions {
  days?: number;
  startDate?: Date;
  endDate?: Date;
  disabled?: boolean;
  compare?: boolean;
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
  const { days, startDate, endDate, disabled = false, compare = false } = options;
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
      const params = new URLSearchParams();

      // Use startDate/endDate if provided, otherwise fall back to days
      if (startDate && endDate) {
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      } else if (days !== undefined) {
        params.append('days', days.toString());
      } else {
        // Default to 7 days
        params.append('days', '7');
      }

      // Add comparison flag if enabled
      if (compare) {
        params.append('compare', 'true');
      }

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
  }, [days, startDate, endDate, disabled, compare]);

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
