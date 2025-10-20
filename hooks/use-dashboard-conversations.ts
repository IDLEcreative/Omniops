import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardConversationsData } from '@/types/dashboard';

export type { DashboardConversation, DashboardConversationsData } from '@/types/dashboard';

interface DashboardConversationsOptions {
  days?: number;
  disabled?: boolean;
}

interface UseDashboardConversationsResult {
  data: DashboardConversationsData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useDashboardConversations(
  options: DashboardConversationsOptions = {}
): UseDashboardConversationsResult {
  const { days = 7, disabled = false } = options;
  const [data, setData] = useState<DashboardConversationsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
      const params = new URLSearchParams({ days: days.toString() });
      const response = await fetch(`/api/dashboard/conversations?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load conversations (${response.status})`);
      }

      const payload = (await response.json()) as DashboardConversationsData;
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
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}
