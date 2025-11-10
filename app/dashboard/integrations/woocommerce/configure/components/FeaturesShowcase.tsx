"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, Users, TrendingUp } from "lucide-react";

export function FeaturesShowcase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What You'll Get</CardTitle>
        <CardDescription>Features enabled with this integration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Product Search</h4>
              <p className="text-xs text-muted-foreground">
                AI can search and recommend products from your catalog
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Order Tracking</h4>
              <p className="text-xs text-muted-foreground">
                Help customers track and lookup their order status
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Stock Information</h4>
              <p className="text-xs text-muted-foreground">
                Provide real-time inventory and availability updates
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Customer Support</h4>
              <p className="text-xs text-muted-foreground">
                Enhanced customer service with order and product context
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
