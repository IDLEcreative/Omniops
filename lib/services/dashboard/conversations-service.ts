/**
 * Dashboard Conversations Service
 *
 * Handles business logic for fetching and processing conversation data
 * for dashboard analytics
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { DashboardConversation } from '@/types/dashboard';

export interface ConversationFilters {
  days: number;
  limit: number;
  cursor?: string | null;
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
    const { days, limit, cursor } = filters;
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return this.getDefaultResponse();
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - days * 2);

    // Fetch counts
    const [currentCount, previousCount] = await Promise.all([
      this.fetchCount(supabase, startDate),
      this.fetchCount(supabase, previousStartDate, startDate),
    ]);

    // Calculate change percentage
    const change = previousCount > 0
      ? ((currentCount - previousCount) / previousCount) * 100
      : 0;

    // Fetch conversations with stats
    const {
      conversations,
      statusCounts,
      languageCounts,
    } = await this.fetchConversations(supabase, {
      startDate,
      limit,
      cursor,
    });

    // Fetch peak hours
    const peakHourCounts = await this.fetchPeakHours(supabase, startDate);

    // Transform data
    const languages = this.transformLanguages(languageCounts, currentCount);
    const peakHours = this.transformPeakHours(peakHourCounts);
    const nextCursor = conversations.length >= limit && conversations.length > 0
      ? conversations[conversations.length - 1]?.timestamp || null
      : null;

    return {
      total: currentCount,
      change: Math.round(change * 10) / 10,
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

  private static async fetchCount(
    supabase: any,
    startDate: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      let query = supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (endDate) {
        query = query.lt('created_at', endDate.toISOString());
      }

      const { count, error } = await query;

      if (error) {
        console.warn('[ConversationsService] Error fetching count:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[ConversationsService] Exception fetching count:', error);
      return 0;
    }
  }

  private static async fetchConversations(
    supabase: any,
    options: {
      startDate: Date;
      limit: number;
      cursor?: string | null;
    }
  ) {
    const { startDate, limit, cursor } = options;
    const conversations: DashboardConversation[] = [];
    const statusCounts: Record<'active' | 'waiting' | 'resolved', number> = {
      active: 0,
      waiting: 0,
      resolved: 0,
    };
    const languageCounts: Record<string, number> = {};

    try {
      let conversationsQuery = supabase
        .from('conversations')
        .select('id, created_at, ended_at, metadata')
        .order('created_at', { ascending: false })
        .gte('created_at', startDate.toISOString());

      if (cursor) {
        conversationsQuery = conversationsQuery.lt('created_at', cursor);
      }

      conversationsQuery = conversationsQuery.limit(limit + 1);

      const { data: recentConversations, error } = await conversationsQuery;

      if (!error && recentConversations) {
        const hasMore = recentConversations.length > limit;
        const conversationsToProcess = hasMore
          ? recentConversations.slice(0, limit)
          : recentConversations;

        // Batch fetch all messages
        const conversationIds = conversationsToProcess.map((c: any) => c.id);
        const { data: allMessages } = await supabase
          .from('messages')
          .select('conversation_id, content, role, created_at')
          .in('conversation_id', conversationIds)
          .eq('role', 'user')
          .order('created_at', { ascending: false });

        // Group messages by conversation_id
        const messagesByConversation = new Map<
          string,
          Array<{
            conversation_id: string;
            content: string;
            role: string;
            created_at: string;
          }>
        >();

        allMessages?.forEach((msg: any) => {
          if (!messagesByConversation.has(msg.conversation_id)) {
            messagesByConversation.set(msg.conversation_id, []);
          }
          messagesByConversation.get(msg.conversation_id)!.push(msg);
        });

        // Process conversations
        for (const conv of conversationsToProcess) {
          const metadata = conv.metadata || {};
          const status = this.determineStatus(metadata, conv.ended_at);

          // Only count stats if first page
          if (!cursor) {
            statusCounts[status] += 1;
            const language = this.extractLanguage(metadata);
            languageCounts[language] = (languageCounts[language] || 0) + 1;
          }

          const messages = messagesByConversation.get(conv.id) || [];
          const firstUserMessage = messages[0];
          const language = this.extractLanguage(metadata);

          conversations.push({
            id: conv.id,
            message: firstUserMessage?.content?.substring(0, 100) || 'No message',
            timestamp: firstUserMessage?.created_at || conv.created_at,
            status,
            customerName:
              (metadata.customer && typeof metadata.customer.name === 'string'
                ? metadata.customer.name
                : metadata.customer_name) || null,
            metadata: { language },
          });
        }
      }
    } catch (error) {
      console.warn('[ConversationsService] Error fetching conversations:', error);
    }

    return { conversations, statusCounts, languageCounts };
  }

  private static async fetchPeakHours(
    supabase: any,
    startDate: Date
  ): Promise<Record<number, number>> {
    const peakHourCounts: Record<number, number> = {};

    try {
      const { data: messageTimes } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', new Date().toISOString())
        .limit(5000);

      if (messageTimes) {
        for (const message of messageTimes) {
          const created = new Date(message.created_at);
          const hour = created.getUTCHours();
          peakHourCounts[hour] = (peakHourCounts[hour] || 0) + 1;
        }
      }
    } catch (error) {
      console.warn('[ConversationsService] Error calculating peak hours:', error);
    }

    return peakHourCounts;
  }

  private static determineStatus(
    metadata: any,
    endedAt: string | null
  ): 'active' | 'waiting' | 'resolved' {
    const metadataStatus =
      typeof metadata.status === 'string' ? metadata.status.toLowerCase() : '';

    if (metadataStatus.includes('wait') || metadataStatus.includes('pending')) {
      return 'waiting';
    }
    if (metadataStatus.includes('resolve') || endedAt) {
      return 'resolved';
    }
    return 'active';
  }

  private static extractLanguage(metadata: any): string {
    const metadataLanguage =
      typeof metadata.language === 'string'
        ? metadata.language
        : metadata.customer?.language || metadata.customerLanguage;
    return metadataLanguage ? String(metadataLanguage).trim() : 'Unknown';
  }

  private static transformLanguages(
    languageCounts: Record<string, number>,
    total: number
  ) {
    return Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([language, count]) => ({
        language,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }

  private static transformPeakHours(peakHourCounts: Record<number, number>) {
    return Object.entries(peakHourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hourString, count], index) => {
        const hour = Number(hourString);
        const start = new Date();
        start.setUTCHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setUTCHours(hour + 1);

        const level = index === 0 ? 'high' : index === 1 ? 'high' : 'medium';

        return {
          hour,
          label: `${start.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })} - ${end.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          level,
          count,
        };
      });
  }
}
