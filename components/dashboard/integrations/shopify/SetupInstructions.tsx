"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ExternalLink } from "lucide-react";

export function SetupInstructions() {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">Setup Instructions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium mb-2">To connect your Shopify store:</p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Log into your Shopify Admin dashboard</li>
            <li>Navigate to <strong>Settings → Apps and sales channels</strong></li>
            <li>Click <strong>Develop apps</strong> (enable custom apps if needed)</li>
            <li>Click <strong>Create an app</strong> and name it "Omniops"</li>
            <li>
              Select API scopes: <code className="text-xs bg-white px-1 py-0.5 rounded">read_products</code>,{" "}
              <code className="text-xs bg-white px-1 py-0.5 rounded">read_orders</code>,{" "}
              <code className="text-xs bg-white px-1 py-0.5 rounded">read_customers</code>
            </li>
            <li>Install the app and reveal your access token</li>
            <li>Copy your shop domain and access token below</li>
          </ol>
        </div>
        <div className="pt-2 border-t">
          <a
            href="https://shopify.dev/docs/api/admin-rest"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
          >
            View Shopify API Documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
