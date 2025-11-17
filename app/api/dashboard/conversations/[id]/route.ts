import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import type { ConversationTranscript, ConversationMessage } from '@/types/dashboard';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Zod schema for conversation ID validation
const ConversationIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid conversation ID format. Must be a valid UUID.' })
});

// Type guard for message role validation
function isValidMessageRole(role: unknown): role is 'user' | 'assistant' | 'system' {
  return typeof role === 'string' && ['user', 'assistant', 'system'].includes(role);
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: conversationId } = await params;

    // Validate conversation ID format using Zod
    const validationResult = ConversationIdSchema.safeParse({ id: conversationId });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid conversation ID format',
          details: validationResult.error.errors[0]?.message || 'Conversation ID must be a valid UUID'
        },
        { status: 400 }
      );
    }

    // AUTHENTICATION: Create user-context Supabase client
    const userSupabase = await createClient();
    if (!userSupabase) {
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to access conversation transcripts.' },
        { status: 401 }
      );
    }

    // Create service role client for data access
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

    // AUTHORIZATION: Verify user has access to this conversation's domain
    if (conversation.domain_id) {
      // Get user's organization membership
      const { data: membership, error: membershipError } = await userSupabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this conversation.' },
          { status: 403 }
        );
      }

      // Get the organization's customer config to verify domain access
      const { data: customerConfig, error: configError } = await supabase
        .from('customer_configs')
        .select('id, domain')
        .eq('organization_id', membership.organization_id)
        .eq('id', conversation.domain_id)
        .single();

      if (configError || !customerConfig) {
        console.error('[Transcript] Domain access check failed:', configError?.message);
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this conversation.' },
          { status: 403 }
        );
      }
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

    // Format messages with runtime validation for role field
    const formattedMessages: ConversationMessage[] = (messages || []).map((msg) => {
      // Validate role using type guard
      let validatedRole: 'user' | 'assistant' | 'system' = 'system';

      if (isValidMessageRole(msg.role)) {
        validatedRole = msg.role;
      } else {
        // Log warning when invalid role is detected
        console.warn('[Transcript] Invalid message role detected:', {
          messageId: msg.id,
          invalidRole: msg.role,
          defaultingTo: 'system'
        });
      }

      return {
        id: msg.id,
        role: validatedRole,
        content: msg.content,
        timestamp: msg.created_at,
        metadata: msg.metadata || undefined,
      };
    });

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
