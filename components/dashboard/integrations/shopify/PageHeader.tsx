"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { useRouter } from "next/navigation";

export function PageHeader() {
  const router = useRouter();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/integrations")}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Shopify Integration</h1>
            <p className="text-sm text-muted-foreground">
              Connect your Shopify store to enable product search and order management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
