"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/integrations/woocommerce/DashboardHeader";
import { KPICards } from "@/components/dashboard/integrations/woocommerce/KPICards";
import { RevenueChart } from "@/components/dashboard/integrations/woocommerce/RevenueChart";
import { AbandonedCartsCard } from "@/components/dashboard/integrations/woocommerce/AbandonedCartsCard";
import { LowStockCard } from "@/components/dashboard/integrations/woocommerce/LowStockCard";
import { OperationAnalyticsCard } from "@/components/dashboard/integrations/woocommerce/OperationAnalyticsCard";
import { ErrorState } from "@/components/dashboard/integrations/woocommerce/ErrorState";

interface DashboardData {
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

export default function WooCommerceAnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recoveringCart, setRecoveringCart] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [operationStats, setOperationStats] = useState<any>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<string>('Last 7 days');

  useEffect(() => {
    loadDashboard();
    loadOperationAnalytics();
  }, []);

  const loadDashboard = async (forceRefresh = false) => {
    try {
      setError(null);
      const url = forceRefresh
        ? '/api/woocommerce/dashboard?refresh=true'
        : '/api/woocommerce/dashboard';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result);
        setIsCached(result.cached || false);
        setCachedAt(result.cachedAt || null);
      } else if (result.needsConfiguration) {
        setError('WooCommerce is not configured. Please add your WooCommerce credentials in Settings → Integrations.');
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Failed to connect to WooCommerce');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadOperationAnalytics = async (days: number = 7) => {
    try {
      const response = await fetch(`/api/woocommerce/analytics?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setOperationStats(result.data.stats);
        setAnalyticsPeriod(`Last ${days} days`);
      }
    } catch (err) {
      console.error('Failed to load operation analytics:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadDashboard(true),
      loadOperationAnalytics()
    ]);
  };

  const handleRecoverCart = async (orderId: number) => {
    setRecoveringCart(orderId);
    try {
      const response = await fetch(`/api/woocommerce/abandoned-carts?action=recover&orderId=${orderId}`);
      const result = await response.json();

      if (result.success) {
        await loadDashboard();
      }
    } catch (err) {
      console.error('Failed to recover cart:', err);
    } finally {
      setRecoveringCart(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onBack={() => router.push('/dashboard/integrations')}
        onConfigure={() => router.push('/dashboard/settings?tab=integrations')}
        onRetry={() => loadDashboard()}
      />
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto">
      <DashboardHeader
        isCached={isCached}
        cachedAt={cachedAt}
        isRefreshing={isRefreshing}
        onBack={() => router.push("/dashboard/integrations")}
        onRefresh={handleRefresh}
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
          onRecover={handleRecoverCart}
        />

        <LowStockCard
          products={data.lowStock}
          currencySymbol={data.kpis.revenue.currencySymbol}
        />
      </div>

      {/* Operation Analytics */}
      {operationStats && (
        <div className="mt-4">
          <OperationAnalyticsCard
            stats={operationStats}
            period={analyticsPeriod}
          />
        </div>
      )}
    </div>
  );
}
