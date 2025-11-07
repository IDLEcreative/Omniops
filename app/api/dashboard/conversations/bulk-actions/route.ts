import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';
import pLimit from 'p-limit';
import { ConversationCache } from '@/lib/cache/conversation-cache';
import { checkDashboardRateLimit } from '@/lib/middleware/dashboard-rate-limit';

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

    // Apply rate limiting for bulk actions
    const rateLimitResponse = await checkDashboardRateLimit(user, 'bulkActions');
    if (rateLimitResponse) {
      return rateLimitResponse; // Rate limit exceeded
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

    // BATCHED VALIDATION: Fetch all conversations in a single query instead of N queries
    // This eliminates the N+1 pattern for conversation verification
    const { data: conversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id, domain_id, metadata')
      .in('id', conversationIds);

    if (fetchError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch conversations',
          message: fetchError.message
        },
        { status: 500 }
      );
    }

    const results: ActionResult[] = [];
    const foundConversations = new Map(conversations?.map(c => [c.id, c]) || []);

    // Track which conversations don't exist
    const validConversationIds: string[] = [];
    for (const id of conversationIds) {
      if (!foundConversations.has(id)) {
        results.push({
          id,
          success: false,
          error: 'Conversation not found'
        });
      } else {
        validConversationIds.push(id);
      }
    }

    // BATCHED OPERATIONS: Execute actions in bulk instead of individual queries
    if (validConversationIds.length === 0) {
      // All conversations not found, return early
      return NextResponse.json({
        success: true,
        successCount: 0,
        failureCount: results.length,
        results
      });
    }

    try {
      // FIXED: Add concurrency limiting to prevent overwhelming database
      const limit = pLimit(10); // Limit to 10 concurrent operations

      if (action === 'assign_human') {
        // Use Promise.allSettled with concurrency limiting
        // This prevents overwhelming the database with 100 concurrent updates
        const assignmentTimestamp = new Date().toISOString();

        const updatePromises = validConversationIds.map((id) => limit(async () => {
          const conv = foundConversations.get(id)!;
          const updatedMetadata = {
            ...(conv.metadata as Record<string, unknown> || {}),
            assigned_to_human: true,
            assigned_at: assignmentTimestamp,
            status: 'waiting'
          };

          const { error } = await supabase
            .from('conversations')
            .update({ metadata: updatedMetadata })
            .eq('id', id);

          return { id, error };
        }));

        const updateResults = await Promise.allSettled(updatePromises);

        updateResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push({
              id: result.value.id,
              success: !result.value.error,
              error: result.value.error?.message
            });
          } else {
            results.push({
              id: 'unknown',
              success: false,
              error: result.reason
            });
          }
        });
      } else if (action === 'close' || action === 'mark_resolved') {
        // Batch update all conversations to resolved status
        const timestamp = new Date().toISOString();

        // Use Promise.allSettled with concurrency limiting
        // This prevents overwhelming the database with 100 concurrent updates
        const updatePromises = validConversationIds.map((id) => limit(async () => {
          const conv = foundConversations.get(id)!;
          const updatedMetadata = {
            ...(conv.metadata as Record<string, unknown> || {}),
            status: 'resolved'
          };

          const { error } = await supabase
            .from('conversations')
            .update({
              ended_at: timestamp,
              metadata: updatedMetadata
            })
            .eq('id', id);

          return { id, error };
        }));

        const updateResults = await Promise.allSettled(updatePromises);

        updateResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push({
              id: result.value.id,
              success: !result.value.error,
              error: result.value.error?.message
            });
          } else {
            results.push({
              id: 'unknown',
              success: false,
              error: result.reason
            });
          }
        });
      } else if (action === 'delete') {
        // BATCHED DELETE: Delete all messages in a single query
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .in('conversation_id', validConversationIds);

        if (messagesError) {
          // If message deletion fails, mark all as failed
          validConversationIds.forEach(id => {
            results.push({
              id,
              success: false,
              error: `Failed to delete messages: ${messagesError.message}`
            });
          });
        } else {
          // BATCHED DELETE: Delete all conversations in a single query
          const { error: conversationsError } = await supabase
            .from('conversations')
            .delete()
            .in('id', validConversationIds);

          if (conversationsError) {
            validConversationIds.forEach(id => {
              results.push({
                id,
                success: false,
                error: conversationsError.message
              });
            });
          } else {
            // Mark all as successful
            validConversationIds.forEach(id => {
              results.push({ id, success: true });
            });
          }
        }
      }
    } catch (error) {
      // Handle unexpected errors
      validConversationIds.forEach(id => {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    // Invalidate caches for all affected conversations
    // Extract domain ID from first conversation (they should all be same domain)
    if (validConversationIds.length > 0 && conversations && conversations.length > 0) {
      const domainId = conversations[0]?.domain_id || 'default';

      // Invalidate caches asynchronously (don't wait)
      ConversationCache.invalidateConversations(validConversationIds, domainId)
        .catch(err => console.error('[BulkActions] Failed to invalidate caches:', err));

      console.log('[BulkActions] Invalidated caches for domain:', domainId, 'conversations:', validConversationIds.length);
    }

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
