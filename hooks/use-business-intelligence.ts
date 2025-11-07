import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CustomerJourneyMetrics,
  ContentGapAnalysis,
  PeakUsagePattern,
  ConversionFunnel
} from '@/lib/analytics/business-intelligence-types';

interface BusinessIntelligenceData {
  timeRange: {
    start: string;
    end: string;
  };
  customerJourney?: CustomerJourneyMetrics;
  contentGaps?: ContentGapAnalysis;
  peakUsage?: PeakUsagePattern;
  conversionFunnel?: ConversionFunnel;
  summary?: {
    totalInsights: number;
    criticalCount: number;
    highCount: number;
    insights: Array<{
      type: 'warning' | 'info' | 'success';
      metric: string;
      message: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      details?: any;
    }>;
  };
}

interface UseBusinessIntelligenceOptions {
  days?: number;
  domain?: string;
  metric?: 'journey' | 'content-gaps' | 'peak-usage' | 'conversion-funnel' | 'all';
  disabled?: boolean;
}

interface UseBusinessIntelligenceResult {
  data: BusinessIntelligenceData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useBusinessIntelligence(
  options: UseBusinessIntelligenceOptions = {},
): UseBusinessIntelligenceResult {
  const { days = 30, domain, metric = 'all', disabled = false } = options;
  const [data, setData] = useState<BusinessIntelligenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchIntelligence = useCallback(async () => {
    if (disabled) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        days: days.toString(),
        metric
      });

      if (domain) {
        params.append('domain', domain);
      }

      const response = await fetch(`/api/analytics/intelligence?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to access analytics');
        }
        throw new Error(`Failed to load business intelligence (${response.status})`);
      }

      const payload = (await response.json()) as BusinessIntelligenceData;
      setData(payload);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err as Error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, domain, metric, disabled]);

  useEffect(() => {
    fetchIntelligence();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchIntelligence]);

  const refresh = useCallback(async () => {
    await fetchIntelligence();
  }, [fetchIntelligence]);

  return { data, loading, error, refresh };
}
