"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export function ConfigureHeader() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/dashboard/integrations")}
        className="h-8 w-8"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">WooCommerce Integration</h1>
          <p className="text-sm text-muted-foreground">
            Connect your WooCommerce store for product and order support
          </p>
        </div>
      </div>
    </div>
  );
}
