"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Search, Users } from "lucide-react";

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

interface ConversationsTabProps {
  failedSearches: string[];
  languageDistribution: LanguageEntry[];
  sentimentSummary: SentimentSummary;
  isLoading: boolean;
}

const formatNumber = (value: number | undefined) =>
  value !== undefined ? value.toLocaleString() : "—";

const getLanguageColor = (color?: string, fallbackIndex = 0) => {
  if (color) return color;
  const palette = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-gray-500"];
  return palette[fallbackIndex % palette.length];
};

export function ConversationsTab({
  failedSearches,
  languageDistribution,
  sentimentSummary,
  isLoading,
}: ConversationsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Failed Searches</CardTitle>
          <CardDescription>Topics that returned no results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-8 w-full rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && failedSearches.length === 0 && (
            <EmptyState
              icon={Search}
              title="No failed searches"
              description="When searches don't return results, they'll be listed here for review"
              variant="compact"
            />
          )}
          {failedSearches.map((query, index) => (
            <div key={`${query}-${index}`} className="rounded-md border bg-card px-3 py-2 text-sm">
              {query}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
          <CardDescription>Share of user messages by language.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-6 w-full rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && languageDistribution.length === 0 && (
            <EmptyState
              icon={Users}
              title="No language data"
              description="Language diversity will be tracked as international users engage"
              variant="compact"
            />
          )}
          {languageDistribution.map((lang, index) => (
            <div key={lang.language} className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${getLanguageColor(lang.color, index)}`} />
              <span className="text-sm flex-1">{lang.language}</span>
              <span className="text-sm font-medium">{lang.percentage}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sentiment Breakdown</CardTitle>
          <CardDescription>Positive vs. negative interactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Positive</span>
            <span className="font-medium">
              {formatNumber(sentimentSummary.positive)} ({sentimentSummary.positiveRate}%)
            </span>
          </div>
          <Progress value={sentimentSummary.positiveRate} className="h-2" />
          <div className="flex justify-between text-sm">
            <span>Negative</span>
            <span className="font-medium">
              {formatNumber(sentimentSummary.negative)} ({sentimentSummary.negativeRate}%)
            </span>
          </div>
          <Progress value={sentimentSummary.negativeRate} className="h-2 bg-red-100" />
          <p className="text-xs text-muted-foreground">
            Based on {formatNumber(sentimentSummary.total)} user messages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
