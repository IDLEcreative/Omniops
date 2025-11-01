/**
 * WooCommerce Dashboard View
 */

import { DashboardHeader } from "@/components/dashboard/integrations/woocommerce/DashboardHeader";
import { KPICards } from "@/components/dashboard/integrations/woocommerce/KPICards";
import { RevenueChart } from "@/components/dashboard/integrations/woocommerce/RevenueChart";
import { AbandonedCartsCard } from "@/components/dashboard/integrations/woocommerce/AbandonedCartsCard";
import { LowStockCard } from "@/components/dashboard/integrations/woocommerce/LowStockCard";
import { OperationAnalyticsCard } from "@/components/dashboard/integrations/woocommerce/OperationAnalyticsCard";
import type { WooCommerceDashboardData } from "../types";

interface WooCommerceDashboardProps {
  data: WooCommerceDashboardData;
  operationStats: any;
  isCached: boolean;
  cachedAt: string | null;
  isRefreshing: boolean;
  recoveringCart: number | null;
  onBack: () => void;
  onRefresh: () => void;
  onRecoverCart: (orderId: number) => void;
}

export function WooCommerceDashboard({
  data,
  operationStats,
  isCached,
  cachedAt,
  isRefreshing,
  recoveringCart,
  onBack,
  onRefresh,
  onRecoverCart
}: WooCommerceDashboardProps) {
  return (
    <>
      <DashboardHeader
        isCached={isCached}
        cachedAt={cachedAt}
        isRefreshing={isRefreshing}
        onBack={onBack}
        onRefresh={onRefresh}
        title="Shop Analytics"
        subtitle="WooCommerce"
      />

      <KPICards kpis={data.kpis} />

      <RevenueChart
        data={data.revenueHistory}
        currencySymbol={data.kpis.revenue.currencySymbol}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AbandonedCartsCard
          carts={data.abandonedCarts}
          currencySymbol={data.kpis.revenue.currencySymbol}
          recoveringCart={recoveringCart}
          onRecover={onRecoverCart}
        />

        <LowStockCard
          products={data.lowStock}
          currencySymbol={data.kpis.revenue.currencySymbol}
        />
      </div>

      {operationStats && (
        <div className="mt-4">
          <OperationAnalyticsCard
            stats={operationStats}
            period="Last 7 days"
          />
        </div>
      )}
    </>
  );
}
