"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const features = [
  {
    title: "Product Search",
    description: "Search and display product information in chat",
  },
  {
    title: "Order Lookup",
    description: "Check order status by ID or customer email",
  },
  {
    title: "Stock Checking",
    description: "Real-time inventory availability",
  },
  {
    title: "Customer Support",
    description: "Answer customer questions about products and orders",
  },
];

export function FeaturesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What you can do with Shopify integration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
