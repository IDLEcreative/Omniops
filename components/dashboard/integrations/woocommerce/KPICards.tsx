import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Percent,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface KPIData {
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
}

interface KPICardsProps {
  kpis: KPIData;
}

const formatCurrency = (value: string, symbol: string = '£') => {
  return `${symbol}${parseFloat(value).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export function KPICards({ kpis }: KPICardsProps) {
  const isPositiveChange = parseFloat(kpis.revenue.change) > 0;

  return (
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
            {formatCurrency(kpis.revenue.today, kpis.revenue.currencySymbol)}
          </div>
          <div className="flex items-center gap-1 text-xs mt-1">
            {isPositiveChange ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={isPositiveChange ? "text-green-600" : "text-red-600"}>
              {isPositiveChange ? '+' : ''}{kpis.revenue.change}%
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
            {formatCurrency(kpis.abandonedCarts.value, kpis.revenue.currencySymbol)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {kpis.abandonedCarts.count} carts to recover
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
          <div className="text-2xl font-bold">{kpis.orders.processing}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {kpis.orders.completedToday} completed today
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
          <div className="text-2xl font-bold">{kpis.conversion.rate}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {kpis.conversion.label}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
