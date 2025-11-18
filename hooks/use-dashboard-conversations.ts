import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardConversationsData, DashboardConversation } from '@/types/dashboard';

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
  loadMore: () => Promise<void>;
  loadingMore: boolean;
  hasMore: boolean;
}

export function useDashboardConversations(
  options: DashboardConversationsOptions = {}
): UseDashboardConversationsResult {
  const { days = 7, disabled = false } = options;
  const [data, setData] = useState<DashboardConversationsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [allConversations, setAllConversations] = useState<DashboardConversation[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (cursor?: string | null) => {
    if (disabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isLoadingMore = !!cursor;
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        days: days.toString(),
        limit: '20'
      });

      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/dashboard/conversations?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load conversations (${response.status})`);
      }

      const payload = (await response.json()) as DashboardConversationsData;

      if (isLoadingMore) {
        // Append new conversations to existing list
        setAllConversations(prev => [...prev, ...payload.recent]);
        setData(prevData => prevData ? {
          ...prevData,
          recent: [...allConversations, ...payload.recent]
        } : payload);
      } else {
        // Initial load - replace everything
        setAllConversations(payload.recent);
        setData(payload);
      }

      // Update pagination state
      setNextCursor((payload as any).pagination?.nextCursor || null);
      setHasMore((payload as any).pagination?.hasMore || false);

    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err as Error);
      if (!isLoadingMore) {
        setData(null);
        setAllConversations([]);
      }
    } finally {
      if (isLoadingMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [days, disabled, allConversations]);

  useEffect(() => {
    // Reset state when days change
    setAllConversations([]);
    setNextCursor(null);
    setHasMore(false);
    fetchData();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, disabled]);

  const refresh = useCallback(async () => {
    setAllConversations([]);
    setNextCursor(null);
    setHasMore(false);
    await fetchData();
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    await fetchData(nextCursor);
  }, [hasMore, loadingMore, nextCursor, fetchData]);

  return { data, loading, error, refresh, loadMore, loadingMore, hasMore };
}
