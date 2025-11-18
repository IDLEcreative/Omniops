/**
 * Dashboard Conversations Service
 *
 * Handles business logic for fetching and processing conversation data
 * for dashboard analytics
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { DashboardConversation } from '@/types/dashboard';
import {
  fetchCount,
  fetchConversations,
  fetchPeakHours,
} from './conversations/query-builder';
import {
  determineStatus,
  extractLanguage,
  transformLanguages,
  transformPeakHours,
  calculateChange,
} from './conversations/data-transformer';

export interface ConversationFilters {
  days: number;
  limit: number;
  cursor?: string | null;
  organizationId: string;
}

export interface ConversationStats {
  total: number;
  change: number;
  statusCounts: Record<'active' | 'waiting' | 'resolved', number>;
  languages: Array<{ language: string; count: number; percentage: number }>;
  peakHours: Array<{ hour: number; label: string; level: string; count: number }>;
  recent: DashboardConversation[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export class ConversationsService {
  /**
   * Fetch conversation statistics and recent conversations
   */
  static async getConversationStats(
    filters: ConversationFilters
  ): Promise<ConversationStats> {
    const { days, limit, cursor, organizationId } = filters;
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return this.getDefaultResponse();
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - days * 2);

    // Fetch counts with organization filter
    const [currentCount, previousCount] = await Promise.all([
      fetchCount(supabase, startDate, undefined, organizationId),
      fetchCount(supabase, previousStartDate, startDate, organizationId),
    ]);

    // Calculate change percentage
    const change = calculateChange(currentCount, previousCount);

    // Fetch conversations with stats and organization filter
    const {
      conversations,
      statusCounts,
      languageCounts,
    } = await fetchConversations(
      supabase,
      { startDate, limit, cursor, organizationId },
      determineStatus,
      extractLanguage
    );

    // Fetch peak hours with organization filter
    const peakHourCounts = await fetchPeakHours(supabase, startDate, organizationId);

    // Transform data
    const languages = transformLanguages(languageCounts, currentCount);
    const peakHours = transformPeakHours(peakHourCounts);
    const nextCursor = conversations.length >= limit && conversations.length > 0
      ? conversations[conversations.length - 1]?.timestamp || null
      : null;

    return {
      total: currentCount,
      change,
      statusCounts,
      languages,
      peakHours,
      recent: conversations,
      pagination: {
        nextCursor,
        hasMore: nextCursor !== null,
        limit,
      },
    };
  }

  private static getDefaultResponse(): ConversationStats {
    return {
      total: 0,
      change: 0,
      statusCounts: { active: 0, waiting: 0, resolved: 0 },
      languages: [],
      peakHours: [],
      recent: [],
      pagination: { nextCursor: null, hasMore: false, limit: 20 },
    };
  }
}
