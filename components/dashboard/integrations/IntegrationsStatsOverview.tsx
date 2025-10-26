"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link2, CheckCircle2, Shield, Sparkles } from "lucide-react";

interface IntegrationsStatsOverviewProps {
  totalCount: number;
  connectedCount: number;
  availableCount: number;
}

export function IntegrationsStatsOverview({
  totalCount,
  connectedCount,
  availableCount,
}: IntegrationsStatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
          <Link2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCount}</div>
          <div className="flex items-center mt-1">
            <Progress value={(connectedCount / totalCount) * 100} className="h-2" />
            <span className="ml-2 text-xs text-muted-foreground">{connectedCount} active</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connected</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{connectedCount}</div>
          <p className="text-xs text-muted-foreground">
            Active integrations
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available</CardTitle>
          <Shield className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableCount}</div>
          <p className="text-xs text-muted-foreground">
            Ready to connect
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Coming Soon</CardTitle>
          <Sparkles className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCount - availableCount}</div>
          <p className="text-xs text-muted-foreground">
            In development
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
