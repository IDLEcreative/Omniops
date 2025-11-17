import { useEffect, useState, useCallback } from 'react';
import { useDashboardConversations } from './use-dashboard-conversations';
import type { DashboardConversationsData } from '@/types/dashboard';

interface UseRealtimeConversationsOptions {
  days?: number;
  intervalMs?: number;
}

/**
 * Hook for real-time conversation updates
 *
 * Always-on live updates with automatic pause when tab is hidden.
 * Follows industry best practices (Intercom, Zendesk, Stripe) - live data is the default.
 */
export function useRealtimeConversations({
  days = 7,
  intervalMs = 30000, // 30 seconds default
}: UseRealtimeConversationsOptions = {}) {
  const { data, loading, error, refresh, loadMore, loadingMore, hasMore } = useDashboardConversations({ days });
  const [lastFetch, setLastFetch] = useState<Date | null>(new Date());
  const [newConversationsCount, setNewConversationsCount] = useState(0);
  const [previousData, setPreviousData] = useState<DashboardConversationsData | null>(null);

  // Always-on auto-refresh with smart pausing
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(async () => {
      // Only refresh when tab is visible (automatic resource optimization)
      if (!document.hidden) {
        const oldCount = data?.recent.length || 0;
        await refresh();
        setLastFetch(new Date());

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
    };
  }, [loading, intervalMs, refresh, data, previousData]);

  // Update previous data when data changes
  useEffect(() => {
    if (data && !loading) {
      setPreviousData(data);
    }
  }, [data, loading]);

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
    lastFetch,
    newConversationsCount,
    acknowledgeNew
  };
}
