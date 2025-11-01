/**
 * Type definitions for dashboard analytics
 */

import type { PostgrestSingleResponse } from '@/types/supabase';

export interface DashboardMessageRecord {
  role: string;
  content: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  conversation_id?: string | null;
  session_id?: string | null;
}

export interface TopQueryStat {
  query: string;
  count: number;
  percentage: number;
}

export interface LanguageDistributionStat {
  language: string;
  percentage: number;
  count: number;
}

export interface DailySentimentStat {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  satisfactionScore: number;
}

export interface MessageAnalytics {
  avgResponseTimeSeconds: number;
  satisfactionScore: number;
  resolutionRate: number;
  topQueries: TopQueryStat[];
  failedSearches: string[];
  languageDistribution: LanguageDistributionStat[];
  totalMessages: number;
  totalUserMessages: number;
  avgMessagesPerDay: number;
  positiveUserMessages: number;
  negativeUserMessages: number;
  dailySentiment: DailySentimentStat[];
}

export type SupabaseResponse<T> = PostgrestSingleResponse<T>;
