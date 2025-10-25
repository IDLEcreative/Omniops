import { useEffect, useState, useCallback } from 'react';
import { useDashboardConversations } from './use-dashboard-conversations';
import type { DashboardConversationsData } from '@/types/dashboard';

interface UseRealtimeConversationsOptions {
  days?: number;
  intervalMs?: number;
  enabled?: boolean;
}

export function useRealtimeConversations({
  days = 7,
  intervalMs = 30000, // 30 seconds default
  enabled = true
}: UseRealtimeConversationsOptions = {}) {
  const { data, loading, error, refresh, loadMore, loadingMore, hasMore } = useDashboardConversations({ days });
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [isLive, setIsLive] = useState(enabled);
  const [newConversationsCount, setNewConversationsCount] = useState(0);
  const [previousData, setPreviousData] = useState<DashboardConversationsData | null>(null);

  // Auto-refresh with polling
  useEffect(() => {
    if (!isLive || loading) return;

    // Pause polling when page is not visible
    const handleVisibilityChange = () => {
      setIsLive(!document.hidden && enabled);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(async () => {
      if (!document.hidden) {
        const oldCount = data?.recent.length || 0;
        await refresh();
        setLastFetch(Date.now());

        // Check for new conversations after refresh completes
        const newCount = data?.recent.length || 0;
        if (newCount > oldCount && data) {
          const newConvs = data.recent.slice(0, newCount - oldCount);
          // Check if these are truly new (by ID) not just re-fetched
          if (previousData) {
            const previousIds = new Set(previousData.recent.map(c => c.id));
            const actuallyNew = newConvs.filter(c => !previousIds.has(c.id));
            if (actuallyNew.length > 0) {
              setNewConversationsCount(prev => prev + actuallyNew.length);
            }
          }
        }
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLive, loading, intervalMs, refresh, data, previousData, enabled]);

  // Update previous data when data changes
  useEffect(() => {
    if (data && !loading) {
      setPreviousData(data);
    }
  }, [data, loading]);

  const toggleLive = useCallback(() => {
    setIsLive(prev => !prev);
  }, []);

  const acknowledgeNew = useCallback(() => {
    setNewConversationsCount(0);
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    loadMore,
    loadingMore,
    hasMore,
    isLive,
    toggleLive,
    lastFetch,
    newConversationsCount,
    acknowledgeNew
  };
}
