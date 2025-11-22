/**
 * Request Human Help API Route
 *
 * @purpose Allows end-users to request human assistance from the chat widget
 * @flow User clicks "Request Human Help" → API validates → Updates conversation metadata → Triggers notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Zod schema for request validation
const RequestHumanSchema = z.object({
  reason: z.string().optional(),
  lastUserMessage: z.string().optional(),
});

// Zod schema for conversation ID validation
const ConversationIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid conversation ID format. Must be a valid UUID.' })
});

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: conversationId } = await params;

    // Validate conversation ID format
    const idValidation = ConversationIdSchema.safeParse({ id: conversationId });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid conversation ID format',
          details: idValidation.error.errors[0]?.message || 'Conversation ID must be a valid UUID'
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = RequestHumanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.errors[0]?.message || 'Invalid request parameters'
        },
        { status: 400 }
      );
    }

    const { reason, lastUserMessage } = validation.data;

    // Create service role client for data access (no auth required for widget users)
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[RequestHuman] Failed to create Supabase client');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, domain_id, metadata, session_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[RequestHuman] Conversation not found:', convError?.message);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if human already requested
    if (conversation.metadata?.assigned_to_human) {
      return NextResponse.json(
        {
          success: true,
          message: 'Human agent already requested',
          data: {
            conversationId,
            requestedAt: conversation.metadata.requested_human_at || conversation.metadata.assigned_at,
            status: 'waiting',
            alreadyRequested: true
          }
        }
      );
    }

    // Update conversation metadata with human request
    const requestedAt = new Date().toISOString();
    const metadata = {
      ...(conversation.metadata || {}),
      assigned_to_human: true,
      requested_human_at: requestedAt,
      human_request_reason: reason,
      human_request_last_message: lastUserMessage,
      status: 'waiting',
    };

    const { error: updateError } = await supabase
      .from('conversations')
      .update({ metadata })
      .eq('id', conversationId);

    if (updateError) {
      console.error('[RequestHuman] Failed to update conversation:', updateError.message);
      return NextResponse.json(
        { error: 'Failed to request human assistance' },
        { status: 500 }
      );
    }

    // TODO: Trigger notification to support team (Phase 3)
    // await notifyHumanRequest({ conversationId, domain_id: conversation.domain_id, reason });

    console.log(`[RequestHuman] Human help requested for conversation ${conversationId}`);

    return NextResponse.json({
      success: true,
      message: 'Human agent requested successfully',
      data: {
        conversationId,
        requestedAt,
        status: 'waiting'
      }
    });

  } catch (error) {
    console.error('[RequestHuman] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
