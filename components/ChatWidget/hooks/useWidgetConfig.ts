import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatWidgetConfig } from './useChatState';

export interface UseWidgetConfigProps {
  demoConfig?: ChatWidgetConfig | null;
}

export interface WidgetConfigState {
  woocommerceEnabled: boolean;
  storeDomain: string | null;
  setWoocommerceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setStoreDomain: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  error: Error | null;
  retryLoadConfig: () => Promise<void>;
}

/**
 * Manages widget configuration including WooCommerce and domain settings
 *
 * Features:
 * - Loads configuration from demoConfig or API
 * - Handles loading and error states
 * - Prevents race conditions on unmount
 * - Supports retry on failure
 * - Production-safe logging
 *
 * @param demoConfig - Optional demo configuration
 * @returns Widget configuration state and setters
 */
export function useWidgetConfig({ demoConfig }: UseWidgetConfigProps): WidgetConfigState {
  const [woocommerceEnabled, setWoocommerceEnabled] = useState(false);
  const [storeDomain, setStoreDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  // Store last load parameters for retry
  const lastLoadParams = useRef<{ domain: string } | null>(null);

  // Memoized config loading function
  const checkWooCommerceConfig = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // CRITICAL FIX: If config already has domain from parent (embed.js), use it directly
      // This prevents overwriting correct domain with empty string from API
      if (demoConfig?.domain && demoConfig.domain.trim() !== '') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useWidgetConfig] Using domain from demoConfig:', demoConfig.domain);
        }

        if (!isMountedRef.current) return;

        setStoreDomain(demoConfig.domain);
        setWoocommerceEnabled(demoConfig.features?.woocommerce?.enabled || false);

        // Store params for potential retry
        lastLoadParams.current = { domain: demoConfig.domain };
        return; // Don't fetch from API - use parent config
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[useWidgetConfig] No domain in demoConfig, falling back to URL detection');
      }

      const urlParams = new URLSearchParams(window.location.search);
      let domain = urlParams.get('domain') || window.location.hostname;

      const isDemoEnvironment = domain === 'localhost' || domain === '127.0.0.1';

      if (isDemoEnvironment) {
        const DEMO_DOMAIN = process.env.NEXT_PUBLIC_DEMO_DOMAIN || 'demo.example.com';
        domain = DEMO_DOMAIN;
      }

      // Store params for retry
      lastLoadParams.current = { domain };

      // Use public widget config endpoint (no authentication required)
      const response = await fetch(`/api/widget/config?domain=${encodeURIComponent(domain)}`);

      if (!isMountedRef.current) return;

      if (response && response.ok) {
        const data = await response.json();

        if (!isMountedRef.current) return;

        if (data.success && data.config) {
          setWoocommerceEnabled(data.config.woocommerce_enabled || false);
          // Only set storeDomain if API returns non-empty domain
          const apiDomain =
            data.config.domain && data.config.domain.trim() !== '' ? data.config.domain : domain;
          setStoreDomain(apiDomain);
        } else {
          // Response successful but no config - use defaults
          setStoreDomain(domain);
        }
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Failed to load widget config');
      console.error('[useWidgetConfig] Could not load widget config:', error);
      setError(error);

      // Continue with defaults even on error
      if (lastLoadParams.current) {
        setStoreDomain(lastLoadParams.current.domain);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [demoConfig]);

  // Retry function for external use
  const retryLoadConfig = useCallback(async () => {
    if (!lastLoadParams.current) {
      console.warn('[useWidgetConfig] No previous load attempt to retry');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[useWidgetConfig] Retrying config load with:', lastLoadParams.current);
    }

    await checkWooCommerceConfig();
  }, [checkWooCommerceConfig]);

  // Load config on mount or when demoConfig changes
  useEffect(() => {
    checkWooCommerceConfig();

    // Cleanup: mark as unmounted
    return () => {
      isMountedRef.current = false;
    };
  }, [checkWooCommerceConfig]);

  return {
    woocommerceEnabled,
    storeDomain,
    setWoocommerceEnabled,
    setStoreDomain,
    isLoading,
    error,
    retryLoadConfig,
  };
}
