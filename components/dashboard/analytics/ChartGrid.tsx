"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./OverviewTab";
import { ConversationsTab } from "./ConversationsTab";
import { PerformanceTab } from "./PerformanceTab";
import { InsightsTab } from "./InsightsTab";

interface DailySentimentEntry {
  date: string;
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  satisfactionScore: number;
}

interface TopQueryEntry {
  query: string;
  count: number;
  percentage: number;
}

interface LanguageEntry {
  language: string;
  percentage: number;
  color?: string;
}

interface SentimentSummary {
  positive: number;
  negative: number;
  total: number;
  positiveRate: number;
  negativeRate: number;
}

interface Insight {
  title: string;
  body: string;
  tone: "positive" | "neutral" | "caution";
}

interface AnalyticsMetrics {
  responseTime?: number;
  satisfactionScore?: number;
  resolutionRate?: number;
  totalMessages?: number;
  userMessages?: number;
  positiveMessages?: number;
  negativeMessages?: number;
  avgMessagesPerDay?: number;
}

interface ChartGridProps {
  dailySentiment: DailySentimentEntry[];
  topQueries: TopQueryEntry[];
  languageDistribution: LanguageEntry[];
  failedSearches: string[];
  sentimentSummary: SentimentSummary;
  insights: Insight[];
  metrics?: AnalyticsMetrics;
  isLoading: boolean;
}

export function ChartGrid({
  dailySentiment,
  topQueries,
  languageDistribution,
  failedSearches,
  sentimentSummary,
  insights,
  metrics,
  isLoading,
}: ChartGridProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="conversations">Conversations</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab
          dailySentiment={dailySentiment}
          topQueries={topQueries}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="conversations" className="space-y-6">
        <ConversationsTab
          failedSearches={failedSearches}
          languageDistribution={languageDistribution}
          sentimentSummary={sentimentSummary}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="performance" className="space-y-6">
        <PerformanceTab metrics={metrics} />
      </TabsContent>

      <TabsContent value="ai-insights" className="space-y-6">
        <InsightsTab insights={insights} />
      </TabsContent>
    </Tabs>
  );
}
