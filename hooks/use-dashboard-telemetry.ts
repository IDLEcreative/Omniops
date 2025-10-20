import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardTelemetryData } from '@/types/dashboard';

export type {
  DashboardTelemetryData,
  DashboardTelemetryDomainBreakdown,
  DashboardTelemetryHourlyPoint,
  DashboardTelemetryModelUsage,
} from '@/types/dashboard';

export interface DashboardTelemetryOptions {
  days?: number;
  domain?: string;
  disabled?: boolean;
}

interface UseDashboardTelemetryResult {
  data: DashboardTelemetryData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useDashboardTelemetry(
  options: DashboardTelemetryOptions = {}
): UseDashboardTelemetryResult {
  const { days = 7, domain, disabled = false } = options;
  const [data, setData] = useState<DashboardTelemetryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (disabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        days: days.toString(),
      });
      if (domain) {
        params.set('domain', domain);
      }

      const response = await fetch(`/api/dashboard/telemetry?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load telemetry (${response.status})`);
      }

      const payload = (await response.json()) as DashboardTelemetryData;
      setData(payload);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err as Error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, domain, disabled]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}
