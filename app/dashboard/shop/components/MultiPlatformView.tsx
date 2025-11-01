/**
 * Multi-Platform Tabbed View
 */

import { ShoppingBag, Store, TrendingUp, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICards } from "@/components/dashboard/integrations/woocommerce/KPICards";
import { RevenueChart } from "@/components/dashboard/integrations/woocommerce/RevenueChart";
import { AbandonedCartsCard } from "@/components/dashboard/integrations/woocommerce/AbandonedCartsCard";
import { LowStockCard } from "@/components/dashboard/integrations/woocommerce/LowStockCard";
import { OperationAnalyticsCard } from "@/components/dashboard/integrations/woocommerce/OperationAnalyticsCard";
import type { WooCommerceDashboardData, ConnectedPlatforms } from "../types";

interface MultiPlatformViewProps {
  platforms: ConnectedPlatforms;
  wooData: WooCommerceDashboardData | null;
  wooOperationStats: any;
  shopifyData: any;
  isRefreshing: boolean;
  recoveringCart: number | null;
  onRefresh: () => void;
  onRecoverCart: (orderId: number) => void;
}

export function MultiPlatformView({
  platforms,
  wooData,
  wooOperationStats,
  shopifyData,
  isRefreshing,
  recoveringCart,
  onRefresh,
  onRecoverCart
}: MultiPlatformViewProps) {
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
        <Button onClick={onRefresh} disabled={isRefreshing}>
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
                onRecover={onRecoverCart}
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
