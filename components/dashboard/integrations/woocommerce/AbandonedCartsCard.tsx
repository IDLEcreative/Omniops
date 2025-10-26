import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface AbandonedCart {
  orderId: number;
  customerName: string;
  customerEmail: string;
  value: string;
  timeAgo: string;
  items: number;
}

interface AbandonedCartsCardProps {
  carts: AbandonedCart[];
  currencySymbol: string;
  recoveringCart: number | null;
  onRecover: (orderId: number) => void;
}

const formatCurrency = (value: string, symbol: string = '£') => {
  return `${symbol}${parseFloat(value).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export function AbandonedCartsCard({
  carts,
  currencySymbol,
  recoveringCart,
  onRecover
}: AbandonedCartsCardProps) {
  return (
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
        {carts.length > 0 ? (
          <div className="space-y-3">
            {carts.map((cart) => (
              <div
                key={cart.orderId}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{cart.customerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(cart.value, currencySymbol)} • {cart.items} items • {cart.timeAgo} ago
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRecover(cart.orderId)}
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
  );
}
