import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

const ExportRequestSchema = z.object({
  format: z.enum(['csv', 'json']),
  conversationIds: z.array(z.string().uuid()).optional(),
  filters: z.object({
    status: z.enum(['all', 'active', 'waiting', 'resolved']).optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    searchTerm: z.string().optional(),
  }).optional(),
});

interface ConversationWithMessages {
  id: string;
  created_at: string;
  ended_at: string | null;
  metadata: Record<string, unknown> | null;
  messages: Array<{
    role: string;
    content: string;
    created_at: string;
  }> | null;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const userSupabase = await createClient();
    if (!userSupabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const { format, conversationIds, filters } = ExportRequestSchema.parse(body);

    // Use service role client for data fetching
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Build query
    let query = supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        ended_at,
        metadata,
        messages (
          role,
          content,
          created_at
        )
      `);

    // Apply conversation ID filter
    if (conversationIds && conversationIds.length > 0) {
      query = query.in('id', conversationIds);
    }

    // Apply date range filter
    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    // Apply status filter through metadata
    if (filters?.status && filters.status !== 'all') {
      // Status is stored in metadata.status
      query = query.contains('metadata', { status: filters.status });
    }

    // Execute query with limit
    const { data: conversations, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(1000);

    if (fetchError) {
      console.error('[Export] Database error:', fetchError);
      throw new Error('Failed to fetch conversations');
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ error: 'No conversations found' }, { status: 404 });
    }

    // Apply search term filter in-memory (can't do this efficiently in Postgres)
    let filteredConversations: ConversationWithMessages[] = conversations;
    if (filters?.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      filteredConversations = conversations.filter((conv) => {
        const customerName = (conv.metadata?.customer_name as string || '').toLowerCase();
        const hasMessageMatch = conv.messages?.some(
          (msg) => msg.content.toLowerCase().includes(term)
        );
        return customerName.includes(term) || hasMessageMatch;
      });
    }

    // Format and return based on requested format
    if (format === 'csv') {
      const csv = convertToCSV(filteredConversations);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="conversations-${Date.now()}.csv"`,
        },
      });
    } else {
      // JSON format
      const exportData = {
        export_date: new Date().toISOString(),
        exported_by: user.email,
        total_conversations: filteredConversations.length,
        conversations: filteredConversations.map((conv) => {
          // Safely extract customer name from metadata
          let customerName = 'Unknown';
          if (conv.metadata?.customer_name && typeof conv.metadata.customer_name === 'string') {
            customerName = conv.metadata.customer_name;
          } else if (
            conv.metadata?.customer &&
            typeof conv.metadata.customer === 'object' &&
            conv.metadata.customer !== null &&
            'name' in conv.metadata.customer &&
            typeof (conv.metadata.customer as { name?: unknown }).name === 'string'
          ) {
            customerName = (conv.metadata.customer as { name: string }).name;
          }

          return {
            id: conv.id,
            created_at: conv.created_at,
            ended_at: conv.ended_at,
            status: conv.metadata?.status || (conv.ended_at ? 'resolved' : 'active'),
            customer_name: customerName,
            message_count: conv.messages?.length || 0,
            messages: conv.messages || [],
            metadata: conv.metadata,
          };
        }),
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="conversations-${Date.now()}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('[Export] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

function convertToCSV(conversations: ConversationWithMessages[]): string {
  const headers = [
    'ID',
    'Customer Name',
    'Status',
    'Message Count',
    'Created At',
    'Last Activity',
    'Duration (minutes)',
    'First Message Preview'
  ];

  const rows = conversations.map((conv) => {
    // Safely extract customer name from metadata
    let customerName = 'Unknown';
    if (conv.metadata?.customer_name && typeof conv.metadata.customer_name === 'string') {
      customerName = conv.metadata.customer_name;
    } else if (
      conv.metadata?.customer &&
      typeof conv.metadata.customer === 'object' &&
      conv.metadata.customer !== null &&
      'name' in conv.metadata.customer &&
      typeof (conv.metadata.customer as { name?: unknown }).name === 'string'
    ) {
      customerName = (conv.metadata.customer as { name: string }).name;
    }

    const status = conv.metadata?.status || (conv.ended_at ? 'resolved' : 'active');
    const messageCount = conv.messages?.length || 0;
    const createdAt = new Date(conv.created_at).toISOString();
    const lastActivity = conv.messages && conv.messages.length > 0
      ? new Date(conv.messages[conv.messages.length - 1]?.created_at || conv.created_at).toISOString()
      : createdAt;

    // Calculate duration in minutes
    const duration = conv.ended_at
      ? Math.round((new Date(conv.ended_at).getTime() - new Date(conv.created_at).getTime()) / 60000)
      : 'Ongoing';

    // Get first user message as preview
    const firstMessage = conv.messages?.find(msg => msg.role === 'user')?.content || '';
    const messagePreview = firstMessage.substring(0, 100).replace(/"/g, '""'); // Escape quotes

    return [
      conv.id,
      String(customerName).replace(/"/g, '""'),
      String(status),
      messageCount,
      createdAt,
      lastActivity,
      duration,
      messagePreview
    ];
  });

  // Combine headers and rows, properly escaping CSV values
  const csvLines = [headers, ...rows].map(row =>
    row.map(cell => `"${cell}"`).join(',')
  );

  return csvLines.join('\n');
}
