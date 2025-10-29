"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, Store, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// WooCommerce Components
import { DashboardHeader } from "@/components/dashboard/integrations/woocommerce/DashboardHeader";
import { KPICards } from "@/components/dashboard/integrations/woocommerce/KPICards";
import { RevenueChart } from "@/components/dashboard/integrations/woocommerce/RevenueChart";
import { AbandonedCartsCard } from "@/components/dashboard/integrations/woocommerce/AbandonedCartsCard";
import { LowStockCard } from "@/components/dashboard/integrations/woocommerce/LowStockCard";
import { OperationAnalyticsCard } from "@/components/dashboard/integrations/woocommerce/OperationAnalyticsCard";
import { ErrorState } from "@/components/dashboard/integrations/woocommerce/ErrorState";

interface WooCommerceDashboardData {
  kpis: {
    revenue: {
      today: string;
      yesterday: string;
      change: string;
      currency: string;
      currencySymbol: string;
    };
    abandonedCarts: {
      value: string;
      count: number;
    };
    orders: {
      processing: number;
      completedToday: number;
      total: number;
    };
    conversion: {
      rate: string;
      label: string;
    };
  };
  revenueHistory: Array<{ date: string; revenue: number }>;
  abandonedCarts: Array<{
    orderId: number;
    customerName: string;
    customerEmail: string;
    value: string;
    timeAgo: string;
    items: number;
  }>;
  lowStock: Array<{
    id: number;
    name: string;
    stock: number;
    price: string;
  }>;
}

interface ConnectedPlatforms {
  woocommerce: boolean;
  shopify: boolean;
}

export default function UnifiedShopPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [platforms, setPlatforms] = useState<ConnectedPlatforms>({
    woocommerce: false,
    shopify: false
  });

  // WooCommerce state
  const [wooData, setWooData] = useState<WooCommerceDashboardData | null>(null);
  const [wooError, setWooError] = useState<string | null>(null);
  const [wooOperationStats, setWooOperationStats] = useState<any>(null);
  const [recoveringCart, setRecoveringCart] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // Shopify state (placeholder for future)
  const [shopifyData, setShopifyData] = useState<any>(null);
  const [shopifyError, setShopifyError] = useState<string | null>(null);

  useEffect(() => {
    loadAllPlatforms();
  }, []);

  const loadAllPlatforms = async (forceRefresh = false) => {
    setIsLoading(true);

    // Load WooCommerce data
    await loadWooCommerceData(forceRefresh);

    // Load Shopify data (placeholder for future)
    await loadShopifyData();

    setIsLoading(false);
  };

  const loadWooCommerceData = async (forceRefresh = false) => {
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

        // Load operation analytics
        await loadWooCommerceAnalytics();
      } else if (result.needsConfiguration) {
        setPlatforms(prev => ({ ...prev, woocommerce: false }));
      } else {
        setWooError(result.error || 'Failed to load WooCommerce data');
      }
    } catch (err) {
      console.error('WooCommerce load error:', err);
      setPlatforms(prev => ({ ...prev, woocommerce: false }));
    }
  };

  const loadWooCommerceAnalytics = async (days: number = 7) => {
    try {
      const response = await fetch(`/api/woocommerce/analytics?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setWooOperationStats(result.data.stats);
      }
    } catch (err) {
      console.error('Failed to load WooCommerce analytics:', err);
    }
  };

  const loadShopifyData = async () => {
    // Placeholder for Shopify integration
    // TODO: Implement when Shopify dashboard is ready
    try {
      // const response = await fetch('/api/shopify/dashboard');
      // const result = await response.json();
      // if (result.success) {
      //   setShopifyData(result);
      //   setPlatforms(prev => ({ ...prev, shopify: true }));
      // }
      setPlatforms(prev => ({ ...prev, shopify: false }));
    } catch (err) {
      console.error('Shopify load error:', err);
      setPlatforms(prev => ({ ...prev, shopify: false }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllPlatforms(true);
    setIsRefreshing(false);
  };

  const handleRecoverCart = async (orderId: number) => {
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
  };

  // Check if any platform is connected
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

  // No platforms configured
  if (!hasAnyPlatform) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No E-Commerce Platforms Connected</CardTitle>
            <CardDescription>
              Connect WooCommerce or Shopify to see your shop analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button onClick={() => router.push('/dashboard/integrations')}>
              <Store className="mr-2 h-4 w-4" />
              Browse Integrations
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/settings?tab=integrations')}>
              Configure Platforms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single platform view (no tabs needed)
  if (platformCount === 1) {
    if (platforms.woocommerce && wooData) {
      return (
        <div className="flex-1 p-6 max-w-7xl mx-auto">
          <DashboardHeader
            isCached={isCached}
            cachedAt={cachedAt}
            isRefreshing={isRefreshing}
            onBack={() => router.push("/dashboard")}
            onRefresh={handleRefresh}
            title="Shop Analytics"
            subtitle="WooCommerce"
          />

          <KPICards kpis={wooData.kpis} />

          <RevenueChart
            data={wooData.revenueHistory}
            currencySymbol={wooData.kpis.revenue.currencySymbol}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <AbandonedCartsCard
              carts={wooData.abandonedCarts}
              currencySymbol={wooData.kpis.revenue.currencySymbol}
              recoveringCart={recoveringCart}
              onRecover={handleRecoverCart}
            />

            <LowStockCard
              products={wooData.lowStock}
              currencySymbol={wooData.kpis.revenue.currencySymbol}
            />
          </div>

          {wooOperationStats && (
            <div className="mt-4">
              <OperationAnalyticsCard
                stats={wooOperationStats}
                period="Last 7 days"
              />
            </div>
          )}
        </div>
      );
    }

    // Shopify single view (future)
    if (platforms.shopify && shopifyData) {
      return (
        <div className="flex-1 p-6 max-w-7xl mx-auto">
          {/* TODO: Shopify dashboard components */}
          <Card>
            <CardHeader>
              <CardTitle>Shopify Analytics</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }
  }

  // Multiple platforms view (use tabs)
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Shop Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Unified view of all your e-commerce platforms
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TrendingUp className="mr-2 h-4 w-4" />
          )}
          Refresh All
        </Button>
      </div>

      <Tabs defaultValue="woocommerce" className="space-y-4">
        <TabsList>
          {platforms.woocommerce && (
            <TabsTrigger value="woocommerce">
              <Store className="mr-2 h-4 w-4" />
              WooCommerce
            </TabsTrigger>
          )}
          {platforms.shopify && (
            <TabsTrigger value="shopify">
              <Store className="mr-2 h-4 w-4" />
              Shopify
            </TabsTrigger>
          )}
        </TabsList>

        {platforms.woocommerce && wooData && (
          <TabsContent value="woocommerce" className="space-y-4">
            <KPICards kpis={wooData.kpis} />

            <RevenueChart
              data={wooData.revenueHistory}
              currencySymbol={wooData.kpis.revenue.currencySymbol}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <AbandonedCartsCard
                carts={wooData.abandonedCarts}
                currencySymbol={wooData.kpis.revenue.currencySymbol}
                recoveringCart={recoveringCart}
                onRecover={handleRecoverCart}
              />

              <LowStockCard
                products={wooData.lowStock}
                currencySymbol={wooData.kpis.revenue.currencySymbol}
              />
            </div>

            {wooOperationStats && (
              <OperationAnalyticsCard
                stats={wooOperationStats}
                period="Last 7 days"
              />
            )}
          </TabsContent>
        )}

        {platforms.shopify && (
          <TabsContent value="shopify">
            <Card>
              <CardHeader>
                <CardTitle>Shopify Analytics</CardTitle>
                <CardDescription>Coming Soon</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
