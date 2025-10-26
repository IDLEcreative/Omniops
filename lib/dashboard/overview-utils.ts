/**
 * Dashboard overview utilities - Formatting and helper functions
 * Extracted from app/dashboard/page.tsx
 */

import type { DashboardOverview } from "@/hooks/use-dashboard-overview";

// ============================================================================
// CONSTANTS
// ============================================================================

export const PERIOD_OPTIONS = [
  { value: "24h", label: "Last 24 hours", days: 1 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
] as const;

export const PERIOD_TO_DAYS = PERIOD_OPTIONS.reduce<Record<string, number>>((acc, option) => {
  acc[option.value] = option.days;
  return acc;
}, {});

export const LANGUAGE_COLORS: Record<string, string> = {
  english: "bg-blue-500",
  spanish: "bg-green-500",
  french: "bg-yellow-500",
  german: "bg-purple-500",
  other: "bg-gray-500",
};

export const INSIGHT_TONE_STYLES: Record<
  "positive" | "caution" | "info" | "neutral",
  string
> = {
  positive: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
  caution: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
  info: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
  neutral: "bg-muted/40 border border-muted",
};

export const EMPTY_OVERVIEW: DashboardOverview = {
  summary: {
    totalConversations: 0,
    conversationChange: 0,
    activeUsers: 0,
    activeUsersChange: 0,
    avgResponseTime: 0,
    avgResponseTimeChange: 0,
    resolutionRate: 0,
    resolutionRateChange: 0,
    satisfactionScore: 3,
  },
  trend: [],
  recentConversations: [],
  languageDistribution: [],
  quickStats: {
    satisfaction: 3,
    avgResponseTime: 0,
    conversationsToday: 0,
    successRate: 100,
    totalTokens: 0,
    totalCostUSD: 0,
    avgSearchesPerRequest: 0,
  },
  telemetry: {
    totalRequests: 0,
    successfulRequests: 0,
    successRate: 100,
    avgSearchesPerRequest: 0,
    totalTokens: 0,
    totalCostUSD: 0,
  },
  botStatus: {
    online: false,
    uptimePercent: 0,
    primaryModel: "gpt-5-mini",
    lastTrainingAt: null,
  },
};

// ============================================================================
// FORMATTERS
// ============================================================================

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

const costFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export const formatNumber = (value: number) => numberFormatter.format(value ?? 0);

export const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) return "0%";
  const formatted = percentageFormatter.format(value);
  return `${value >= 0 ? "+" : ""}${formatted}%`;
};

export const formatPercentageNoSign = (value: number) => {
  if (!Number.isFinite(value)) return "0%";
  return `${percentageFormatter.format(value)}%`;
};

export const formatSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0.0s";
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${percentageFormatter.format(remainingSeconds)}s`;
  }
  return `${percentageFormatter.format(seconds)}s`;
};

export const formatRelativeTime = (isoDate: string | null) => {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, "day");
};

export const formatShortDay = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString(undefined, { weekday: "short" });

export const formatCost = (value: number) => costFormatter.format(value);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const isValidPeriod = (value: string): value is (typeof PERIOD_OPTIONS)[number]["value"] =>
  Object.prototype.hasOwnProperty.call(PERIOD_TO_DAYS, value);

export const getLanguageColor = (language: string) => {
  const key = language.toLowerCase();
  return LANGUAGE_COLORS[key] || LANGUAGE_COLORS.other;
};

export const getStatusBadgeVariant = (status: "active" | "waiting" | "resolved") => {
  switch (status) {
    case "resolved":
      return "default";
    case "active":
      return "secondary";
    default:
      return "outline";
  }
};

export const getInitials = (name: string | null) => {
  if (!name) return "??";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
  if (!first) return "??";
  if (!last) return first.slice(0, 2).toUpperCase();
  return `${first[0]?.toUpperCase() ?? ""}${last[0]?.toUpperCase() ?? ""}` || "??";
};
