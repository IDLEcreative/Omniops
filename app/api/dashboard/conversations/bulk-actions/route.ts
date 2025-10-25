import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

const BulkActionSchema = z.object({
  action: z.enum(['assign_human', 'close', 'mark_resolved', 'delete']),
  conversationIds: z.array(z.string().uuid()).min(1).max(100),
});

interface ActionResult {
  id: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const userSupabase = await createClient();
    if (!userSupabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = BulkActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { action, conversationIds } = validation.data;

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    // Process each conversation
    const results: ActionResult[] = [];

    for (const conversationId of conversationIds) {
      try {
        // Verify conversation exists
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .select('id, domain_id, metadata')
          .eq('id', conversationId)
          .single();

        if (convError || !conv) {
          results.push({
            id: conversationId,
            success: false,
            error: 'Conversation not found'
          });
          continue;
        }

        // Perform action based on type
        if (action === 'assign_human') {
          const updatedMetadata = {
            ...(conv.metadata || {}),
            assigned_to_human: true,
            assigned_at: new Date().toISOString(),
            status: 'waiting'
          };

          const { error } = await supabase
            .from('conversations')
            .update({ metadata: updatedMetadata })
            .eq('id', conversationId);

          results.push({
            id: conversationId,
            success: !error,
            error: error?.message
          });
        } else if (action === 'close' || action === 'mark_resolved') {
          const updatedMetadata = {
            ...(conv.metadata || {}),
            status: 'resolved'
          };

          const { error } = await supabase
            .from('conversations')
            .update({
              ended_at: new Date().toISOString(),
              metadata: updatedMetadata
            })
            .eq('id', conversationId);

          results.push({
            id: conversationId,
            success: !error,
            error: error?.message
          });
        } else if (action === 'delete') {
          // Delete messages first (foreign key should cascade, but be explicit)
          const { error: messagesError } = await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', conversationId);

          if (messagesError) {
            results.push({
              id: conversationId,
              success: false,
              error: `Failed to delete messages: ${messagesError.message}`
            });
            continue;
          }

          // Delete conversation
          const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId);

          results.push({
            id: conversationId,
            success: !error,
            error: error?.message
          });
        }
      } catch (error) {
        results.push({
          id: conversationId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      results
    });
  } catch (error) {
    console.error('[BulkActions] Error:', error);
    return NextResponse.json(
      {
        error: 'Bulk action failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
