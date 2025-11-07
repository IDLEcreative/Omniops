import { useState, useEffect } from 'react';

export interface DashboardAnalytics {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  sentimentScore: number;
  errorRate: number;
  topQueries: Array<{ query: string; count: number }>;
  failedSearches: Array<{ query: string; count: number }>;
}

export function useAnalytics(days: number = 7) {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/analytics?days=${days}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const analytics = await response.json();
      setData(analytics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  return {
    data,
    loading,
    error,
    refresh: fetchAnalytics
  };
}
