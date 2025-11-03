import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

// CORS headers for cross-origin requests (widget embedding)
function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': 'true',
  };
  return headers;
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
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
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
      return NextResponse.json(
        {
          success: false,
          messages: [],
          conversation: null
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch messages for the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (messagesError) {
      console.error('[Messages API] Error fetching messages:', messagesError);
      return NextResponse.json(
        {
          success: false,
          messages: [],
          error: 'Failed to retrieve messages'
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Return messages and conversation info
    return NextResponse.json(
      {
        success: true,
        conversation: {
          id: conversation.id,
          created_at: conversation.created_at
        },
        messages: messages || [],
        count: messages?.length || 0
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Messages API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        messages: [],
        error: 'An unexpected error occurred'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}