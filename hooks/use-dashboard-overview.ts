import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardOverview } from '@/types/dashboard';

export type { DashboardOverview } from '@/types/dashboard';

interface UseDashboardOverviewOptions {
  days?: number;
  disabled?: boolean;
}

interface UseDashboardOverviewResult {
  data: DashboardOverview | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const DEFAULT_OVERVIEW: DashboardOverview = {
  summary: {
    totalConversations: 0,
    conversationChange: 0,
    activeUsers: 0,
    activeUsersChange: 0,
    avgResponseTime: 0,
    avgResponseTimeChange: 0,
    resolutionRate: 0,
    resolutionRateChange: 0,
    satisfactionScore: 3
  },
  trend: [],
  recentConversations: [],
  languageDistribution: [],
  quickStats: {
    satisfaction: 3,
    avgResponseTime: 0,
    conversationsToday: 0,
    successRate: 100,
    totalTokens: 0,
    totalCostUSD: 0,
    avgSearchesPerRequest: 0
  },
  telemetry: {
    totalRequests: 0,
    successfulRequests: 0,
    successRate: 100,
    avgSearchesPerRequest: 0,
    totalTokens: 0,
    totalCostUSD: 0
  },
  botStatus: {
    online: false,
    uptimePercent: 0,
    primaryModel: 'gpt-5-mini',
    lastTrainingAt: null
  }
};

export function useDashboardOverview(
  options: UseDashboardOverviewOptions = {}
): UseDashboardOverviewResult {
  const { days = 7, disabled = false } = options;
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortController = useRef<AbortController | null>(null);

  const fetchOverview = useCallback(async () => {
    if (disabled) return;

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ days: days.toString() });
      const response = await fetch(`/api/dashboard/overview?${params.toString()}`, {
        method: 'GET',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to load dashboard overview (${response.status})`);
      }

      const payload = (await response.json()) as DashboardOverview;
      setData(payload);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      console.error('[Dashboard] Failed to fetch overview:', err);
      setError(err as Error);
      setData(DEFAULT_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, [days, disabled]);

  useEffect(() => {
    fetchOverview();

    return () => {
      abortController.current?.abort();
    };
  }, [fetchOverview]);

  const refresh = useCallback(async () => {
    await fetchOverview();
  }, [fetchOverview]);

  return { data, loading, error, refresh };
}
