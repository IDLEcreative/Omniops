import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

// CORS headers for cross-origin requests (widget embedding)
function getCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  } as const;
}

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

// Schema for query parameters
const QuerySchema = z.object({
  session_id: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { conversationId } = await params;

    // Validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { session_id, limit } = QuerySchema.parse(searchParams);

    // Create Supabase client
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return new NextResponse(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: corsHeaders }
      );
    }

    // First, verify the conversation exists and optionally check session
    const conversationQuery = supabase
      .from('conversations')
      .select('id, session_id, created_at')
      .eq('id', conversationId);

    // If session_id is provided, verify it matches (for security)
    if (session_id) {
      conversationQuery.eq('session_id', session_id);
    }

    const { data: conversation, error: convError } = await conversationQuery.single();

    if (convError || !conversation) {
      // Don't reveal whether conversation exists or session mismatch
      return new NextResponse(
        JSON.stringify({
          success: false,
          messages: [],
          conversation: null
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch messages for the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, role, content, created_at, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (messagesError) {
      console.error('[Messages API] Error fetching messages:', messagesError);
      return new NextResponse(
        JSON.stringify({
          success: false,
          messages: [],
          error: 'Failed to retrieve messages'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('[Messages API] 🔍 Fetched messages from DB:', {
      count: messages?.length || 0,
      hasMetadata: messages?.some(m => m.metadata && Object.keys(m.metadata).length > 0),
      lastMessageMetadata: messages?.[messages.length - 1]?.metadata,
      allMessagesMetadata: messages?.map(m => ({
        role: m.role,
        hasMetadata: !!m.metadata,
        metadataKeys: m.metadata ? Object.keys(m.metadata) : [],
        shoppingProducts: m.metadata?.shoppingProducts?.length || 0,
        metadata: m.metadata
      }))
    });

    // Log the exact JSON being returned
    const responseBody = {
      success: true,
      conversation: {
        id: conversation.id,
        created_at: conversation.created_at
      },
      messages: messages || [],
      count: messages?.length || 0
    };

    console.log('[Messages API] 📤 Returning response with messages:', {
      messageCount: responseBody.messages.length,
      lastMessage: responseBody.messages[responseBody.messages.length - 1]
    });

    // Return messages and conversation info
    return new NextResponse(
      JSON.stringify(responseBody),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Messages API] Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        messages: [],
        error: 'An unexpected error occurred'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}