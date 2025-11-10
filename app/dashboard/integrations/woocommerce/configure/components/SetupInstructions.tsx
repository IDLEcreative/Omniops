"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export function SetupInstructions() {
  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="text-base">Setup Instructions</CardTitle>
        <CardDescription>Follow these steps to connect your WooCommerce store</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">1.</span>
            <span>Log into your WooCommerce Admin dashboard</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">2.</span>
            <span>Navigate to <strong>WooCommerce → Settings → Advanced → REST API</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">3.</span>
            <span>Click <strong>"Add key"</strong> to create new API credentials</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">4.</span>
            <span>Set <strong>Description</strong> to "Omniops"</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">5.</span>
            <span>Set <strong>Permissions</strong> to "Read" (read-only access)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">6.</span>
            <span>Click <strong>"Generate API key"</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">7.</span>
            <span>Copy the <strong>Consumer key</strong> and <strong>Consumer secret</strong> below</span>
          </li>
        </ol>
        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="h-3.5 w-3.5" />
          <a
            href="https://woocommerce.com/document/woocommerce-rest-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline"
          >
            WooCommerce REST API Documentation
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
