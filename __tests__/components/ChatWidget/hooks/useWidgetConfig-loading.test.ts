/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWidgetConfig } from '@/components/ChatWidget/hooks/useWidgetConfig';
import type { ChatWidgetConfig } from '@/components/ChatWidget/hooks/useChatState';
import { createSuccessResponse, createErrorResponse, mockDemoConfig, mockApiConfig } from './fixtures/useWidgetConfig-fixtures';

/**
 * useWidgetConfig Hook - Loading and Config Tests
 */

// Mock window.location
delete (window as any).location;
window.location = { hostname: 'example.com', search: '' } as any;

describe('useWidgetConfig Hook - Loading', () => {
  let mockFetch: jest.SpyInstance;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    window.location.hostname = 'example.com';
    window.location.search = '';

    mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue(createSuccessResponse(mockApiConfig));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    mockFetch.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Config Loading from demoConfig', () => {
    it('should use domain from demoConfig if provided', async () => {
      const { result } = renderHook(() => useWidgetConfig({ demoConfig: mockDemoConfig }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.storeDomain).toBe('demo-shop.com');
      expect(result.current.woocommerceEnabled).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should use features.woocommerce.enabled from demoConfig', async () => {
      const demoConfig: ChatWidgetConfig = {
        domain: 'test-domain.com',
        features: {
          woocommerce: { enabled: false },
        },
      };

      const { result } = renderHook(() => useWidgetConfig({ demoConfig }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.woocommerceEnabled).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip API call when demoConfig has domain', async () => {
      const demoConfig: ChatWidgetConfig = {
        domain: 'skip-api.com',
      };

      const { result } = renderHook(() => useWidgetConfig({ demoConfig }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.storeDomain).toBe('skip-api.com');
    });

    it('should handle empty domain in demoConfig', async () => {
      const demoConfig: ChatWidgetConfig = {
        domain: '   ',
      };

      const { result } = renderHook(() => useWidgetConfig({ demoConfig }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Config Loading from API', () => {
    it('should load from API when no demoConfig domain', async () => {
      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/widget/config?domain=')
      );
      expect(result.current.storeDomain).toBe('test.com');
    });

    it('should use URL param domain if available', async () => {
      window.location.search = '?domain=url-param.com';

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/widget/config?domain=url-param.com'
      );
    });

    it('should fall back to window.location.hostname', async () => {
      window.location.hostname = 'fallback-domain.com';
      window.location.search = '';

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/widget/config?domain=fallback-domain.com'
      );
    });

    it('should use NEXT_PUBLIC_DEMO_DOMAIN for localhost', async () => {
      window.location.hostname = 'localhost';
      process.env.NEXT_PUBLIC_DEMO_DOMAIN = 'demo.example.com';

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/widget/config?domain=demo.example.com'
      );
    });
  });

  describe('API Response Handling', () => {
    it('should handle successful API response', async () => {
      mockFetch.mockResolvedValue(createSuccessResponse({
        woocommerce_enabled: true,
        domain: 'api-domain.com',
      }));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.storeDomain).toBe('api-domain.com');
      expect(result.current.woocommerceEnabled).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle non-200 status codes', async () => {
      mockFetch.mockResolvedValue(createErrorResponse(404));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should set isLoading true during fetch', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValue(fetchPromise as any);

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      expect(result.current.isLoading).toBe(true);

      resolveFetch!({
        ok: true,
        json: async () => ({ success: true, config: {} }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set isLoading false after success', async () => {
      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('should set isLoading false after error', async () => {
      mockFetch.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Production vs Development Logging', () => {
    it('should log in development mode when using demoConfig', async () => {
      process.env.NODE_ENV = 'development';
      const demoConfig: ChatWidgetConfig = {
        domain: 'dev-domain.com',
      };

      const { result } = renderHook(() => useWidgetConfig({ demoConfig }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useWidgetConfig] Using domain from demoConfig:',
        'dev-domain.com'
      );
    });

    it('should be silent in production mode for normal operations', async () => {
      process.env.NODE_ENV = 'production';
      const demoConfig: ChatWidgetConfig = {
        domain: 'prod-domain.com',
      };

      const { result } = renderHook(() => useWidgetConfig({ demoConfig }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log errors in both production and development', async () => {
      process.env.NODE_ENV = 'production';
      mockFetch.mockRejectedValue(new Error('Production error'));

      const { result } = renderHook(() => useWidgetConfig({ demoConfig: null }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
