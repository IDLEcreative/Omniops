"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft,
  ArrowRight, 
  Loader2, 
  ShoppingCart, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Package,
  ShoppingBag,
  Percent
} from "lucide-react";

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

  useEffect(() => {
    loadDashboard();
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard(true); // Force refresh to bypass cache
  };
  
  const formatCacheTime = (cachedAt: string) => {
    const cached = new Date(cachedAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - cached.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const handleRecoverCart = async (orderId: number) => {
    setRecoveringCart(orderId);
    try {
      const response = await fetch(`/api/woocommerce/abandoned-carts?action=recover&orderId=${orderId}`);
      const result = await response.json();
      
      if (result.success) {
        // Refresh data to show updated cart
        await loadDashboard();
      }
    } catch (err) {
      console.error('Failed to recover cart:', err);
    } finally {
      setRecoveringCart(null);
    }
  };

  const formatCurrency = (value: string, symbol: string = '£') => {
    return `${symbol}${parseFloat(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Simple line chart component
  const SimpleLineChart = ({ data }: { data: Array<{ date: string; revenue: number }> }) => {
    if (!data || data.length === 0) return null;
    
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const chartHeight = 120;
    const chartWidth = 100;
    
    return (
      <div className="w-full h-32 mt-4">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * chartWidth;
              const y = chartHeight - ((point.revenue / maxRevenue) * chartHeight * 0.8) - 10;
              return `${x},${y}`;
            }).join(' ')}
          />
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            const y = chartHeight - ((point.revenue / maxRevenue) * chartHeight * 0.8) - 10;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="hsl(var(--primary))"
                className="hover:r-3"
              >
                <title>{`${point.date}: ${formatCurrency(point.revenue.toString(), data[0] ? '£' : '')}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{data[0]?.date.split('-').slice(1).join('/')}</span>
          <span>Last 30 days</span>
          <span>{data[data.length - 1]?.date.split('-').slice(1).join('/')}</span>
        </div>
      </div>
    );
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
    const needsConfiguration = error.includes('not configured');
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/dashboard/integrations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integrations
          </Button>
        </div>
        
        <Alert className="mb-4 border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          {needsConfiguration ? (
            <Button 
              onClick={() => router.push('/dashboard/settings?tab=integrations')}
              className="gap-2"
            >
              Configure WooCommerce
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => loadDashboard()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositiveChange = parseFloat(data.kpis.revenue.change) > 0;

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/integrations")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">WooCommerce Analytics</h1>
              <p className="text-sm text-muted-foreground">
                What matters for your business today
                {isCached && cachedAt && (
                  <span className="ml-2 text-xs">
                    (Cached {formatCacheTime(cachedAt)})
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCached && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="mr-1 h-2.5 w-2.5" />
                Cached
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3 w-3" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Revenue Today</CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.kpis.revenue.today, data.kpis.revenue.currencySymbol)}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {isPositiveChange ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={isPositiveChange ? "text-green-600" : "text-red-600"}>
                {isPositiveChange ? '+' : ''}{data.kpis.revenue.change}%
              </span>
              <span className="text-muted-foreground">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Abandoned Cart Value</CardDescription>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.kpis.abandonedCarts.value, data.kpis.revenue.currencySymbol)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.kpis.abandonedCarts.count} carts to recover
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Orders Processing</CardDescription>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.orders.processing}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.kpis.orders.completedToday} completed today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Conversion Rate</CardDescription>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.conversion.rate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.kpis.conversion.label}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleLineChart data={data.revenueHistory} />
        </CardContent>
      </Card>

      {/* Action Items */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Abandoned Carts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Abandoned Carts</CardTitle>
                <CardDescription>High-value carts to recover</CardDescription>
              </div>
              <Badge variant="destructive">Action Required</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.abandonedCarts.length > 0 ? (
              <div className="space-y-3">
                {data.abandonedCarts.map((cart) => (
                  <div key={cart.orderId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{cart.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(cart.value, data.kpis.revenue.currencySymbol)} • {cart.items} items • {cart.timeAgo} ago
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecoverCart(cart.orderId)}
                      disabled={recoveringCart === cart.orderId}
                    >
                      {recoveringCart === cart.orderId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Recover"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No abandoned carts
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Low Stock Alert</CardTitle>
                <CardDescription>Products running out soon</CardDescription>
              </div>
              <Badge variant="outline">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {data.lowStock.length} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.lowStock.length > 0 ? (
              <div className="space-y-3">
                {data.lowStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(product.price, data.kpis.revenue.currencySymbol)} per unit
                      </div>
                    </div>
                    <Badge variant={product.stock < 5 ? "destructive" : "secondary"}>
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                All products well stocked
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}