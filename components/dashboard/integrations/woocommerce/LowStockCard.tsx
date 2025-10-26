import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  price: string;
}

interface LowStockCardProps {
  products: LowStockProduct[];
  currencySymbol: string;
}

const formatCurrency = (value: string, symbol: string = '£') => {
  return `${symbol}${parseFloat(value).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export function LowStockCard({ products, currencySymbol }: LowStockCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Low Stock Alert</CardTitle>
            <CardDescription>Products running out soon</CardDescription>
          </div>
          <Badge variant="outline">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {products.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(product.price, currencySymbol)} per unit
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
  );
}
