/**
 * Analytics Refresh Hook
 *
 * Manages analytics data refresh logic including auto-refresh and realtime updates
 */

import { useEffect } from 'react';

interface UseAnalyticsRefreshProps {
  autoRefresh: boolean;
  activeTab: string;
  latestUpdate: any;
  refreshAnalytics: () => void;
  refreshBI: () => void;
}

export function useAnalyticsRefresh({
  autoRefresh,
  activeTab,
  latestUpdate,
  refreshAnalytics,
  refreshBI,
}: UseAnalyticsRefreshProps) {
  // Handle realtime updates
  useEffect(() => {
    if (latestUpdate) {
      if (activeTab === 'overview') {
        refreshAnalytics();
      } else {
        refreshBI();
      }
    }
  }, [latestUpdate, activeTab, refreshAnalytics, refreshBI]);

  // Handle auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (activeTab === 'overview') {
        refreshAnalytics();
      } else {
        refreshBI();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, refreshAnalytics, refreshBI]);
}
