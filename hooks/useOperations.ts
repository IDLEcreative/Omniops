/**
 * useOperations Hook
 *
 * Fetches and manages autonomous operations data with optional auto-refresh.
 */

import { useState, useEffect, useCallback } from 'react';

export interface Operation {
  id: string;
  organization_id: string;
  user_id: string;
  service: 'woocommerce' | 'shopify' | 'bigcommerce' | 'stripe';
  operation: string;
  status: 'pending' | 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';
  job_id?: string;
  progress?: number;
  result?: any;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  metadata?: {
    config?: any;
    priority?: string;
    steps?: Array<{
      step: string;
      status: string;
      timestamp: string;
      details?: any;
    }>;
  };
}

interface UseOperationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: {
    status?: string;
    service?: string;
  };
}

export function useOperations(options: UseOperationsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 5000, filters } = options;

  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.service) params.set('service', filters.service);

      const response = await fetch(`/api/autonomous/operations?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch operations');
      }

      const data = await response.json();
      setOperations(data.operations || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch operations:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchOperations();
  }, [fetchOperations]);

  // Initial fetch
  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOperations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchOperations]);

  return {
    operations,
    loading,
    error,
    refresh,
  };
}
