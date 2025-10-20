import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { analyseMessages } from '@/lib/dashboard/analytics';

interface ConversationRecord {
  id: string;
  session_id: string | null;
  customer_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ended_at: string | null;
}

interface ConversationMetadata {
  status?: string;
  customer?: { name?: string | null };
  customer_name?: string | null;
}

interface RecentConversationEntry {
  id: string;
  createdAt: string;
  status: 'active' | 'waiting' | 'resolved';
  lastMessagePreview: string;
  lastMessageAt: string;
  customerName: string | null;
}

interface TelemetryRow {
  success: boolean | null;
  cost_usd: number | null;
  search_count: number | null;
  total_tokens: number | null;
  model: string | null;
  created_at: string;
}

const formatChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
};

const toDateKey = (isoDate: string) => new Date(isoDate).toISOString().slice(0, 10);

const parseConversationMetadata = (
  metadata: Record<string, unknown> | null
): ConversationMetadata => {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return metadata as ConversationMetadata;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    const searchParams = request.nextUrl.searchParams;
    const days = Math.max(1, parseInt(searchParams.get('days') || '7', 10));

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const previousEndDate = new Date(startDate);

    // Fetch conversations for current & previous periods
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, session_id, customer_id, metadata, created_at, ended_at')
      .gte('created_at', previousStartDate.toISOString())
      .order('created_at', { ascending: false });

    if (conversationsError) {
      throw conversationsError;
    }

    const conversationsList = conversations as ConversationRecord[] | null;
    const currentConversations = (conversationsList || []).filter(
      (item) => new Date(item.created_at) >= startDate
    );
    const previousConversations = (conversationsList || []).filter(
      (item) =>
        new Date(item.created_at) >= previousStartDate &&
        new Date(item.created_at) < previousEndDate
    );

    const currentConversationCount = currentConversations.length;
    const previousConversationCount = previousConversations.length;
    const conversationChange = formatChange(currentConversationCount, previousConversationCount);

    // Active users derived from unique session IDs (fallback to conversation id)
    const currentSessions = new Set<string>();
    const previousSessions = new Set<string>();

    currentConversations.forEach((conv) => {
      currentSessions.add(conv.session_id || conv.id);
    });
    previousConversations.forEach((conv) => {
      previousSessions.add(conv.session_id || conv.id);
    });

    const activeUsersChange = formatChange(currentSessions.size, previousSessions.size);

    // Trend data (conversation count per day)
    const conversationCountByDate = new Map<string, number>();
    currentConversations.forEach((conv) => {
      const key = toDateKey(conv.created_at);
      conversationCountByDate.set(key, (conversationCountByDate.get(key) || 0) + 1);
    });

    // Fetch messages for analytics
    const { data: currentMessages, error: currentMessagesError } = await supabase
      .from('messages')
      .select('conversation_id, role, content, created_at, metadata')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (currentMessagesError) {
      throw currentMessagesError;
    }

    const { data: previousMessages, error: previousMessagesError } = await supabase
      .from('messages')
      .select('conversation_id, role, content, created_at, metadata')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', previousEndDate.toISOString())
      .order('created_at', { ascending: true });

    if (previousMessagesError) {
      throw previousMessagesError;
    }

    const analyticsCurrent = analyseMessages(currentMessages || [], { days });
    const analyticsPrevious = analyseMessages(previousMessages || [], { days });

    const avgResponseChange = formatChange(
      analyticsCurrent.avgResponseTimeSeconds,
      analyticsPrevious.avgResponseTimeSeconds
    );
    const resolutionChange = formatChange(
      analyticsCurrent.resolutionRate,
      analyticsPrevious.resolutionRate
    );

    // Merge daily sentiment with conversation trend
    const trend: Array<{ date: string; conversations: number; satisfactionScore: number }> = [];
    const satisfactionByDate = new Map<string, number>();
    analyticsCurrent.dailySentiment.forEach((item) => {
      satisfactionByDate.set(item.date, item.satisfactionScore);
    });

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const dateKey = day.toISOString().slice(0, 10);

      trend.push({
        date: dateKey,
        conversations: conversationCountByDate.get(dateKey) || 0,
        satisfactionScore:
          satisfactionByDate.get(dateKey) ?? analyticsCurrent.satisfactionScore
      });
    }

    // Recent conversations
    const recentConversationsRaw = (conversationsList || []).slice(0, 10);
    const recentIds = recentConversationsRaw.map((conv) => conv.id);

    const { data: recentMessagesRaw, error: recentMessagesError } = await supabase
      .from('messages')
      .select('conversation_id, role, content, created_at')
      .in('conversation_id', recentIds.length > 0 ? recentIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false });

    if (recentMessagesError) {
      throw recentMessagesError;
    }

    const recentMessagesByConversation = new Map<string, { content: string; created_at: string }>();
    (recentMessagesRaw || []).forEach((message) => {
      if (message.role === 'user' && !recentMessagesByConversation.has(message.conversation_id)) {
        recentMessagesByConversation.set(message.conversation_id, {
          content: message.content,
          created_at: message.created_at
        });
      }
    });

    const recentConversations: RecentConversationEntry[] = recentConversationsRaw.map((conv) => {
      const metadata = parseConversationMetadata(conv.metadata);
      const userMessage = recentMessagesByConversation.get(conv.id);
      const statusFromMetadata = typeof metadata.status === 'string' ? metadata.status : undefined;
      let status: 'active' | 'waiting' | 'resolved' = 'active';

      if (statusFromMetadata === 'waiting') {
        status = 'waiting';
      } else if (conv.ended_at) {
        status = 'resolved';
      }

      return {
        id: conv.id,
        createdAt: conv.created_at,
        status,
        lastMessagePreview: userMessage?.content?.slice(0, 140) || 'Conversation started',
        lastMessageAt: userMessage?.created_at || conv.created_at,
        customerName:
          (metadata.customer?.name as string | undefined) ??
          (metadata.customer_name as string | undefined) ??
          null
      };
    });

    // Telemetry stats
    const { data: telemetryRowsRaw, error: telemetryError } = await supabase
      .from('chat_telemetry')
      .select('success, cost_usd, search_count, total_tokens, model, created_at')
      .gte('created_at', startDate.toISOString());

    if (telemetryError) {
      throw telemetryError;
    }

    const telemetryRows = (telemetryRowsRaw ?? []) as TelemetryRow[];

    const totalRequests = telemetryRows?.length ?? 0;
    const successfulRequests =
      telemetryRows?.filter((row) => row.success).length ?? 0;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    const totalSearches =
      telemetryRows?.reduce((sum, row) => sum + (row.search_count || 0), 0) ?? 0;
    const avgSearchesPerRequest =
      totalRequests > 0 ? totalSearches / totalRequests : 0;
    const totalCostUSD =
      telemetryRows?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) ?? 0;
    const totalTokens =
      telemetryRows?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) ?? 0;

    const activeToday = telemetryRows?.some((row) => {
      const created = new Date(row.created_at);
      return now.getTime() - created.getTime() < 60 * 60 * 1000; // last hour
    });

    const primaryModel =
      telemetryRows.length > 0 && telemetryRows[0]?.model
        ? telemetryRows[0].model
        : 'gpt-5-mini';

    const { data: lastTrainingRow } = await supabase
      .from('training_data')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const overview = {
      summary: {
        totalConversations: currentConversationCount,
        conversationChange: parseFloat(conversationChange.toFixed(2)),
        activeUsers: currentSessions.size,
        activeUsersChange: parseFloat(activeUsersChange.toFixed(2)),
        avgResponseTime: analyticsCurrent.avgResponseTimeSeconds,
        avgResponseTimeChange: parseFloat(avgResponseChange.toFixed(2)),
        resolutionRate: analyticsCurrent.resolutionRate,
        resolutionRateChange: parseFloat(resolutionChange.toFixed(2)),
        satisfactionScore: analyticsCurrent.satisfactionScore
      },
      trend,
      recentConversations,
      languageDistribution: analyticsCurrent.languageDistribution,
      quickStats: {
        satisfaction: analyticsCurrent.satisfactionScore,
        avgResponseTime: analyticsCurrent.avgResponseTimeSeconds,
        conversationsToday:
          conversationCountByDate.get(new Date().toISOString().slice(0, 10)) || 0,
        successRate: parseFloat(successRate.toFixed(2)),
        totalTokens,
        totalCostUSD: parseFloat(totalCostUSD.toFixed(4)),
        avgSearchesPerRequest: parseFloat(avgSearchesPerRequest.toFixed(2))
      },
      telemetry: {
        totalRequests,
        successfulRequests,
        successRate: parseFloat(successRate.toFixed(2)),
        avgSearchesPerRequest: parseFloat(avgSearchesPerRequest.toFixed(2)),
        totalTokens,
        totalCostUSD: parseFloat(totalCostUSD.toFixed(4))
      },
      botStatus: {
        online: activeToday || totalRequests > 0,
        uptimePercent: parseFloat(successRate.toFixed(2)),
        primaryModel: primaryModel ?? 'gpt-5-mini',
        lastTrainingAt: lastTrainingRow?.created_at || null
      }
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error('[Dashboard] Error building overview:', error);
    return NextResponse.json(
      {
        summary: {
          totalConversations: 0,
          conversationChange: 0,
          activeUsers: 0,
          activeUsersChange: 0,
          avgResponseTime: 0,
          avgResponseTimeChange: 0,
          resolutionRate: 0,
          resolutionRateChange: 0,
          satisfactionScore: 3
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
          avgSearchesPerRequest: 0
        },
        telemetry: {
          totalRequests: 0,
          successfulRequests: 0,
          successRate: 100,
          avgSearchesPerRequest: 0,
          totalTokens: 0,
          totalCostUSD: 0
        },
        botStatus: {
          online: false,
          uptimePercent: 0,
          primaryModel: 'gpt-5-mini',
          lastTrainingAt: null
        }
      },
      { status: 200 }
    );
  }
}
