/**
 * Unified Shop Page - Main Component
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useShopData } from "./hooks";
import { NoPlatformsView, WooCommerceDashboard, MultiPlatformView } from "./components";

export default function UnifiedShopPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recoveringCart, setRecoveringCart] = useState<number | null>(null);

  const {
    platforms,
    wooData,
    wooOperationStats,
    isCached,
    cachedAt,
    shopifyData,
    loadWooCommerceData,
    loadWooCommerceAnalytics,
    loadShopifyData
  } = useShopData();

  useEffect(() => {
    loadAllPlatforms();
  }, []);

  const loadAllPlatforms = async (forceRefresh = false) => {
    setIsLoading(true);
    await loadWooCommerceData(forceRefresh);
    if (forceRefresh === false) {
      await loadWooCommerceAnalytics();
    }
    await loadShopifyData();
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllPlatforms(true);
    await loadWooCommerceAnalytics();
    setIsRefreshing(false);
  };

  const handleRecoverCart = useCallback(async (orderId: number) => {
    setRecoveringCart(orderId);
    try {
      const response = await fetch(`/api/woocommerce/abandoned-carts?action=recover&orderId=${orderId}`);
      const result = await response.json();
      if (result.success) {
        await loadWooCommerceData();
      }
    } catch (err) {
      console.error('Failed to recover cart:', err);
    } finally {
      setRecoveringCart(null);
    }
  }, [loadWooCommerceData]);

  const hasAnyPlatform = platforms.woocommerce || platforms.shopify;
  const platformCount = Object.values(platforms).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!hasAnyPlatform) {
    return <NoPlatformsView />;
  }

  if (platformCount === 1 && platforms.woocommerce && wooData) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        <WooCommerceDashboard
          data={wooData}
          operationStats={wooOperationStats}
          isCached={isCached}
          cachedAt={cachedAt}
          isRefreshing={isRefreshing}
          recoveringCart={recoveringCart}
          onBack={() => router.push("/dashboard")}
          onRefresh={handleRefresh}
          onRecoverCart={handleRecoverCart}
        />
      </div>
    );
  }

  return (
    <MultiPlatformView
      platforms={platforms}
      wooData={wooData}
      wooOperationStats={wooOperationStats}
      shopifyData={shopifyData}
      isRefreshing={isRefreshing}
      recoveringCart={recoveringCart}
      onRefresh={handleRefresh}
      onRecoverCart={handleRecoverCart}
    />
  );
}
