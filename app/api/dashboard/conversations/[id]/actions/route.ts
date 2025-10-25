import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Zod schema for action validation
const ActionSchema = z.object({
  action: z.enum(['assign_human', 'close'], {
    errorMap: () => ({ message: 'Action must be either "assign_human" or "close"' })
  }),
  assignedTo: z.string().optional(),
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
    const validation = ActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.errors[0]?.message || 'Invalid action parameters'
        },
        { status: 400 }
      );
    }

    const { action, assignedTo } = validation.data;

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
        { error: 'Unauthorized. Please log in to perform this action.' },
        { status: 401 }
      );
    }

    // Create service role client for data access
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Actions] Failed to create Supabase client');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Verify conversation exists and user has access
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, domain_id, metadata')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[Actions] Conversation not found:', convError?.message);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // AUTHORIZATION: Verify user has access to this conversation's domain
    if (conversation.domain_id) {
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

      const { data: customerConfig, error: configError } = await supabase
        .from('customer_configs')
        .select('id')
        .eq('organization_id', membership.organization_id)
        .eq('id', conversation.domain_id)
        .single();

      if (configError || !customerConfig) {
        console.error('[Actions] Domain access check failed:', configError?.message);
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this conversation.' },
          { status: 403 }
        );
      }
    }

    // Perform the action
    if (action === 'assign_human') {
      const metadata = {
        ...(conversation.metadata || {}),
        assigned_to_human: true,
        assigned_at: new Date().toISOString(),
        assigned_by: user.id,
        ...(assignedTo && { assigned_to: assignedTo }),
        status: 'waiting', // Set status to waiting when assigned to human
      };

      const { error } = await supabase
        .from('conversations')
        .update({ metadata })
        .eq('id', conversationId);

      if (error) {
        console.error('[Actions] Failed to assign conversation:', error.message);
        return NextResponse.json(
          { error: 'Failed to assign conversation to human agent' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Conversation assigned to human agent',
        data: { conversationId, action, assignedAt: metadata.assigned_at }
      });
    }

    if (action === 'close') {
      const metadata = {
        ...(conversation.metadata || {}),
        status: 'resolved',
        closed_at: new Date().toISOString(),
        closed_by: user.id,
      };

      const { error } = await supabase
        .from('conversations')
        .update({
          ended_at: new Date().toISOString(),
          metadata,
        })
        .eq('id', conversationId);

      if (error) {
        console.error('[Actions] Failed to close conversation:', error.message);
        return NextResponse.json(
          { error: 'Failed to close conversation' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Conversation closed successfully',
        data: { conversationId, action, closedAt: metadata.closed_at }
      });
    }

    // This should never happen due to Zod validation, but TypeScript requires it
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Actions] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
