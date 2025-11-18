/**
 * Conversations Query Builder
 *
 * Handles all database query construction for conversation data fetching
 */

import type { DashboardConversation } from '@/types/dashboard';

export interface QueryOptions {
  startDate: Date;
  limit: number;
  cursor?: string | null;
  organizationId: string;
}

export interface ConversationQueryResult {
  conversations: DashboardConversation[];
  statusCounts: Record<'active' | 'waiting' | 'resolved', number>;
  languageCounts: Record<string, number>;
}

/**
 * Fetch total count of conversations within a date range for an organization
 */
export async function fetchCount(
  supabase: any,
  startDate: Date,
  endDate?: Date,
  organizationId?: string
): Promise<number> {
  try {
    // Join with customer_configs to filter by organization
    let query = supabase
      .from('conversations')
      .select('*, customer_configs!inner(organization_id)', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (endDate) {
      query = query.lt('created_at', endDate.toISOString());
    }

    if (organizationId) {
      query = query.eq('customer_configs.organization_id', organizationId);
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

/**
 * Fetch conversations with messages and aggregate stats
 */
export async function fetchConversations(
  supabase: any,
  options: QueryOptions,
  statusDeterminer: (metadata: any, endedAt: string | null) => 'active' | 'waiting' | 'resolved',
  languageExtractor: (metadata: any) => string
): Promise<ConversationQueryResult> {
  const { startDate, limit, cursor, organizationId } = options;
  const conversations: DashboardConversation[] = [];
  const statusCounts: Record<'active' | 'waiting' | 'resolved', number> = {
    active: 0,
    waiting: 0,
    resolved: 0,
  };
  const languageCounts: Record<string, number> = {};

  try {
    // Join with customer_configs to filter by organization
    let conversationsQuery = supabase
      .from('conversations')
      .select('id, created_at, ended_at, metadata, customer_configs!inner(organization_id)')
      .eq('customer_configs.organization_id', organizationId)
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
        const status = statusDeterminer(metadata, conv.ended_at);

        // Only count stats if first page
        if (!cursor) {
          statusCounts[status] += 1;
          const language = languageExtractor(metadata);
          languageCounts[language] = (languageCounts[language] || 0) + 1;
        }

        const messages = messagesByConversation.get(conv.id) || [];
        const firstUserMessage = messages[0];
        const language = languageExtractor(metadata);

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

/**
 * Fetch message counts grouped by hour to identify peak activity times for an organization
 */
export async function fetchPeakHours(
  supabase: any,
  startDate: Date,
  organizationId: string
): Promise<Record<number, number>> {
  const peakHourCounts: Record<number, number> = {};

  try {
    // Join through conversations to customer_configs to filter by organization
    const { data: messageTimes } = await supabase
      .from('messages')
      .select('created_at, conversations!inner(domain_id, customer_configs!inner(organization_id))')
      .eq('conversations.customer_configs.organization_id', organizationId)
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
