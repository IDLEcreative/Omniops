"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Insight {
  title: string;
  body: string;
  tone: "positive" | "neutral" | "caution";
}

interface InsightsTabProps {
  insights: Insight[];
}

export function InsightsTab({ insights }: InsightsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
        <CardDescription>Generated from current analytics snapshot.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`rounded-lg border p-4 ${
              insight.tone === "positive"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : insight.tone === "caution"
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}
          >
            <h4 className="text-sm font-medium">{insight.title}</h4>
            <p className="text-sm text-muted-foreground mt-2">{insight.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
