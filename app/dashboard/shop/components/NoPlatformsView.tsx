/**
 * No Platforms Connected View
 */

import { useRouter } from "next/navigation";
import { ShoppingBag, Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NoPlatformsView() {
  const router = useRouter();

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
