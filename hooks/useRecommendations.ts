/**
 * useRecommendations Hook
 *
 * React hook for fetching and tracking product recommendations
 */

import { useState, useEffect } from 'react';

export interface UseRecommendationsOptions {
  sessionId?: string;
  conversationId?: string;
  domainId: string;
  userId?: string;
  limit?: number;
  algorithm?: 'collaborative' | 'content_based' | 'hybrid' | 'vector_similarity';
  context?: string;
  excludeProductIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export interface ProductRecommendation {
  productId: string;
  score: number;
  algorithm: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface UseRecommendationsResult {
  recommendations: ProductRecommendation[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  trackClick: (productId: string) => Promise<void>;
  trackPurchase: (productId: string) => Promise<void>;
}

export function useRecommendations(
  options: UseRecommendationsOptions
): UseRecommendationsResult {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (options.sessionId) params.set('sessionId', options.sessionId);
      if (options.conversationId) params.set('conversationId', options.conversationId);
      if (options.domainId) params.set('domainId', options.domainId);
      if (options.userId) params.set('userId', options.userId);
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.algorithm) params.set('algorithm', options.algorithm);
      if (options.context) params.set('context', options.context);
      if (options.excludeProductIds?.length) {
        params.set('excludeProductIds', options.excludeProductIds.join(','));
      }

      // Fetch recommendations
      const response = await fetch(`/api/recommendations?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('[useRecommendations] Fetch error:', err);
      setError(err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (productId: string, eventType: 'click' | 'purchase') => {
    try {
      await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          eventType,
          sessionId: options.sessionId,
          conversationId: options.conversationId,
        }),
      });
    } catch (err) {
      console.error('[useRecommendations] Track event error:', err);
    }
  };

  const trackClick = async (productId: string) => {
    await trackEvent(productId, 'click');
  };

  const trackPurchase = async (productId: string) => {
    await trackEvent(productId, 'purchase');
  };

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchRecommendations();
  }, [
    options.sessionId,
    options.conversationId,
    options.domainId,
    options.context,
    options.limit,
    options.algorithm,
  ]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(
      fetchRecommendations,
      options.refreshInterval || 30000 // Default 30 seconds
    );

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
    trackClick,
    trackPurchase,
  };
}
