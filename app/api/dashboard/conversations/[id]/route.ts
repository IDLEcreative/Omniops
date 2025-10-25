import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { ConversationTranscript, ConversationMessage } from '@/types/dashboard';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Transcript] Failed to create Supabase client');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Fetch conversation metadata
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, metadata, domain_id, created_at')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[Transcript] Conversation not found:', convError?.message);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch all messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, metadata, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('[Transcript] Error fetching messages:', msgError.message);
      return NextResponse.json(
        { error: 'Failed to load messages' },
        { status: 500 }
      );
    }

    // Format messages
    const formattedMessages: ConversationMessage[] = (messages || []).map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      metadata: msg.metadata || undefined,
      created_at: msg.created_at,
    }));

    // Build transcript response
    const transcript: ConversationTranscript = {
      conversationId: conversation.id,
      messages: formattedMessages,
      metadata: {
        customerName: conversation.metadata?.customer?.name || conversation.metadata?.customer_name || null,
        status: determineStatus(conversation),
        language: conversation.metadata?.language || conversation.metadata?.customer?.language || 'Unknown',
        ...conversation.metadata,
      },
    };

    return NextResponse.json(transcript);
  } catch (error) {
    console.error('[Transcript] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to determine conversation status
function determineStatus(conversation: {
  metadata?: Record<string, unknown>;
  ended_at?: string | null;
}): 'active' | 'waiting' | 'resolved' {
  const metadata = conversation.metadata || {};
  const metadataStatus = typeof metadata.status === 'string' ? metadata.status.toLowerCase() : '';

  if (metadataStatus.includes('wait') || metadataStatus.includes('pending')) {
    return 'waiting';
  }

  if (metadataStatus.includes('resolve') || conversation.ended_at) {
    return 'resolved';
  }

  return 'active';
}
