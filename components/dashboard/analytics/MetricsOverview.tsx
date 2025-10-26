"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export interface MetricCard {
  title: string;
  icon: LucideIcon;
  value: string;
  descriptor: string;
}

interface MetricsOverviewProps {
  metrics: MetricCard[];
  isLoading: boolean;
}

export function MetricsOverview({ metrics, isLoading }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-block h-6 w-24 bg-muted animate-pulse rounded" />
              ) : (
                card.value
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{card.descriptor}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
