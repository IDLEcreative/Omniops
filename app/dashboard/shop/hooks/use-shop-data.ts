/**
 * Shop Data Loading Hook
 */

import { useState, useCallback } from 'react';
import type { WooCommerceDashboardData, ConnectedPlatforms } from '../types';

export function useShopData() {
  const [platforms, setPlatforms] = useState<ConnectedPlatforms>({
    woocommerce: false,
    shopify: false
  });

  // WooCommerce state
  const [wooData, setWooData] = useState<WooCommerceDashboardData | null>(null);
  const [wooError, setWooError] = useState<string | null>(null);
  const [wooOperationStats, setWooOperationStats] = useState<any>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // Shopify state (placeholder for future)
  const [shopifyData, setShopifyData] = useState<any>(null);
  const [shopifyError, setShopifyError] = useState<string | null>(null);

  const loadWooCommerceData = useCallback(async (forceRefresh = false) => {
    try {
      setWooError(null);
      const url = forceRefresh
        ? '/api/woocommerce/dashboard?refresh=true'
        : '/api/woocommerce/dashboard';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setWooData(result);
        setPlatforms(prev => ({ ...prev, woocommerce: true }));
        setIsCached(result.cached || false);
        setCachedAt(result.cachedAt || null);
        return true;
      } else if (result.needsConfiguration) {
        setPlatforms(prev => ({ ...prev, woocommerce: false }));
        return false;
      } else {
        setWooError(result.error || 'Failed to load WooCommerce data');
        return false;
      }
    } catch (err) {
      console.error('WooCommerce load error:', err);
      setPlatforms(prev => ({ ...prev, woocommerce: false }));
      return false;
    }
  }, []);

  const loadWooCommerceAnalytics = useCallback(async (days: number = 7) => {
    try {
      const response = await fetch(`/api/woocommerce/analytics?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setWooOperationStats(result.data.stats);
      }
    } catch (err) {
      console.error('Failed to load WooCommerce analytics:', err);
    }
  }, []);

  const loadShopifyData = useCallback(async () => {
    // Placeholder for Shopify integration
    try {
      setPlatforms(prev => ({ ...prev, shopify: false }));
    } catch (err) {
      console.error('Shopify load error:', err);
      setPlatforms(prev => ({ ...prev, shopify: false }));
    }
  }, []);

  return {
    platforms,
    wooData,
    wooError,
    wooOperationStats,
    isCached,
    cachedAt,
    shopifyData,
    shopifyError,
    loadWooCommerceData,
    loadWooCommerceAnalytics,
    loadShopifyData
  };
}
