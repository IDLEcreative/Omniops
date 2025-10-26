"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Download, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDashboardOverview } from "@/hooks/use-dashboard-overview";
import { StatsCards } from "@/components/dashboard/overview/StatsCards";
import { ChartSection } from "@/components/dashboard/overview/ChartSection";
import { ActivityFeed } from "@/components/dashboard/overview/ActivityFeed";
import { QuickActions } from "@/components/dashboard/overview/QuickActions";
import {
  PERIOD_OPTIONS,
  PERIOD_TO_DAYS,
  EMPTY_OVERVIEW,
  isValidPeriod,
} from "@/lib/dashboard/overview-utils";

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    (typeof PERIOD_OPTIONS)[number]["value"]
  >("7d");
  const days = PERIOD_TO_DAYS[selectedPeriod] ?? 7;

  const { data, loading, error, refresh } = useDashboardOverview({ days });
  const overview = data ?? EMPTY_OVERVIEW;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            End-to-end visibility into your AI agent performance and customer operations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedPeriod}
            onValueChange={(value) => {
              if (isValidPeriod(value)) {
                setSelectedPeriod(value);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="default" asChild>
            <a href="/dashboard/analytics">
              <Download className="mr-2 h-4 w-4" />
              Export
            </a>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            We couldn&apos;t refresh dashboard data. Showing the most recent cached snapshot.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <StatsCards overview={overview} />

      {/* Main Content Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Left Column */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          <ChartSection overview={overview} days={days} loading={loading} onRefresh={refresh} />
          <ActivityFeed overview={overview} />
        </div>

        {/* Right Column */}
        <QuickActions overview={overview} />
      </div>
    </div>
  );
}
