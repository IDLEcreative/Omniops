/**
 * useRecommendations Hook Tests
 *
 * Tests the React hook for fetching and tracking recommendations
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useRecommendations } from '@/hooks/useRecommendations';

// Mock fetch
global.fetch = jest.fn();

describe('useRecommendations Hook', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const defaultOptions = {
    sessionId: 'test-session',
    conversationId: 'test-conversation',
    domainId: 'test-domain',
    limit: 5,
  };

  const mockRecommendations = [
    {
      productId: 'product-1',
      score: 0.95,
      algorithm: 'hybrid',
      reason: 'Highly recommended',
      metadata: {},
    },
    {
      productId: 'product-2',
      score: 0.85,
      algorithm: 'vector_similarity',
      reason: 'Similar products',
      metadata: {},
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Fetch', () => {
    it('should start with loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      expect(result.current.loading).toBe(true);
      expect(result.current.recommendations).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch recommendations on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recommendations).toEqual(mockRecommendations);
      expect(result.current.error).toBeNull();
    });

    it('should build correct query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: [] },
        }),
      } as Response);

      renderHook(() =>
        useRecommendations({
          ...defaultOptions,
          algorithm: 'collaborative',
          context: 'looking for pumps',
          excludeProductIds: ['exclude-1', 'exclude-2'],
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('sessionId=test-session');
      expect(callUrl).toContain('conversationId=test-conversation');
      expect(callUrl).toContain('domainId=test-domain');
      expect(callUrl).toContain('limit=5');
      expect(callUrl).toContain('algorithm=collaborative');
      expect(callUrl).toContain('context=looking+for+pumps');
      expect(callUrl).toContain('excludeProductIds=exclude-1%2Cexclude-2');
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Network error');
      mockFetch.mockRejectedValue(mockError);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.recommendations).toEqual([]);
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.recommendations).toEqual([]);
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid domain ID',
        }),
      } as Response);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.recommendations).toEqual([]);
    });
  });

  describe('Refetch', () => {
    it('should refetch recommendations when refetch is called', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFetch.mockClear();

      await result.current.refetch();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should set loading state during refetch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refetchPromise = result.current.refetch();

      expect(result.current.loading).toBe(true);

      await refetchPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Auto-Refresh', () => {
    it('should auto-refresh when enabled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      renderHook(() =>
        useRecommendations({
          ...defaultOptions,
          autoRefresh: true,
          refreshInterval: 10000, // 10 seconds
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should use default refresh interval of 30 seconds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      renderHook(() =>
        useRecommendations({
          ...defaultOptions,
          autoRefresh: true,
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should not auto-refresh when disabled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      renderHook(() =>
        useRecommendations({
          ...defaultOptions,
          autoRefresh: false,
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();

      // Fast-forward 60 seconds
      jest.advanceTimersByTime(60000);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Track Click', () => {
    it('should send POST request to track click event', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFetch.mockClear();

      await result.current.trackClick('product-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'product-1',
          eventType: 'click',
          sessionId: 'test-session',
          conversationId: 'test-conversation',
        }),
      });
    });

    it('should handle track click errors silently', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(result.current.trackClick('product-1')).resolves.not.toThrow();
    });
  });

  describe('Track Purchase', () => {
    it('should send POST request to track purchase event', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      const { result } = renderHook(() => useRecommendations(defaultOptions));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFetch.mockClear();

      await result.current.trackPurchase('product-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'product-1',
          eventType: 'purchase',
          sessionId: 'test-session',
          conversationId: 'test-conversation',
        }),
      });
    });
  });

  describe('Dependency Changes', () => {
    it('should refetch when sessionId changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      const { rerender } = renderHook(
        ({ sessionId }) => useRecommendations({ ...defaultOptions, sessionId }),
        { initialProps: { sessionId: 'session-1' } }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();

      rerender({ sessionId: 'session-2' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch when context changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendations: mockRecommendations },
        }),
      } as Response);

      const { rerender } = renderHook(
        ({ context }) => useRecommendations({ ...defaultOptions, context }),
        { initialProps: { context: 'looking for pumps' } }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();

      rerender({ context: 'need hydraulic parts' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
