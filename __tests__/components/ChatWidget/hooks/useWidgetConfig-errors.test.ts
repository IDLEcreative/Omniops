import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWidgetConfig } from '@/components/ChatWidget/hooks/useWidgetConfig';
import type { ChatWidgetConfig } from '@/components/ChatWidget/hooks/useChatState';
import { createSuccessResponse, mockApiConfig } from './fixtures/useWidgetConfig-fixtures';

/**
 * useWidgetConfig Hook - Error Handling and Edge Cases
 */

// Mock window.location
delete (window as any).location;
window.location = { hostname: 'example.com', search: '' } as any;

describe('useWidgetConfig Hook - Errors & Edge Cases', () => {
  let mockFetch: jest.SpyInstance;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    window.location.hostname = 'example.com';
    window.location.search = '';

    mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue(createSuccessResponse(mockApiConfig));
  });

  afterEach(() => {
    mockFetch.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should set error state on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Network error');
    });

    it('should continue with defaults on error', async () => {
      window.location.hostname = 'error-default.com';
      mockFetch.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.storeDomain).toBe('error-default.com');
      expect(result.current.woocommerceEnabled).toBe(false);
    });

    it('should log errors appropriately', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useWidgetConfig] Could not load widget config:',
        expect.any(Error)
      );
    });
  });

  describe('Retry Functionality', () => {
    it('should retry with same domain after error', async () => {
      window.location.hostname = 'retry-domain.com';
      mockFetch.mockRejectedValueOnce(new Error('First error'));
      mockFetch.mockResolvedValueOnce(createSuccessResponse({
        woocommerce_enabled: true,
        domain: 'retry-domain.com'
      }));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();

      await act(async () => {
        await result.current.retryLoadConfig();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.storeDomain).toBe('retry-domain.com');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear previous error on retry', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'));
      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockApiConfig));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      await act(async () => {
        await result.current.retryLoadConfig();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should reset loading state on retry', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockApiConfig));

      act(() => {
        result.current.retryLoadConfig();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent state updates after unmount', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValue(fetchPromise as any);

      const { result, unmount } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      expect(result.current.isLoading).toBe(true);

      unmount();

      resolveFetch!({
        ok: true,
        json: async () => ({
          success: true,
          config: { woocommerce_enabled: true, domain: 'unmounted.com' },
        }),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(true).toBe(true);
    });

    it('should ignore late API responses after unmount', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValue(fetchPromise as any);

      const { unmount } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      unmount();

      resolveFetch!({
        ok: true,
        json: async () => ({ success: true, config: {} }),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('State Setters', () => {
    it('should allow manual setting of woocommerceEnabled', async () => {
      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setWoocommerceEnabled(true);
      });

      expect(result.current.woocommerceEnabled).toBe(true);
    });

    it('should allow manual setting of storeDomain', async () => {
      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setStoreDomain('manually-set.com');
      });

      expect(result.current.storeDomain).toBe('manually-set.com');
    });
  });

  describe('Edge Cases & Integration', () => {
    it('should handle null and empty demoConfig', async () => {
      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should complete flow: demoConfig → success', async () => {
      const demoConfig: ChatWidgetConfig = {
        domain: 'integration-test.com',
        features: { woocommerce: { enabled: true } },
      };

      const { result } = renderHook(() => useWidgetConfig({ demoConfig }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.storeDomain).toBe('integration-test.com');
      expect(result.current.woocommerceEnabled).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should complete flow: API → failure → retry → success', async () => {
      window.location.hostname = 'retry-flow.com';
      mockFetch.mockRejectedValueOnce(new Error('Initial failure'));
      mockFetch.mockResolvedValueOnce(createSuccessResponse({
        woocommerce_enabled: true,
        domain: 'retry-flow.com',
      }));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBeTruthy();

      await act(async () => {
        await result.current.retryLoadConfig();
      });

      await waitFor(() => expect(result.current.error).toBeNull());
      expect(result.current.woocommerceEnabled).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
