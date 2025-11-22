import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient } from '@/lib/supabase-server';
import { verifySignature, getSigningSecret } from '@/lib/security/request-signing';
import { logSecurityEvent } from '@/lib/security/event-logger';
import { z } from 'zod';

const DeleteRequestSchema = z.object({
  session_id: z.string().optional(),
  email: z.string().email().optional(),
  domain: z.string(),
  confirm: z.boolean(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify request signature to prevent tampering
    const secret = getSigningSecret();
    const verification = verifySignature(body, secret);

    if (!verification.valid) {
      // Log invalid signature attempt
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                       request.headers.get('x-real-ip') ||
                       'unknown';

      await logSecurityEvent({
        type: 'invalid_signature',
        severity: 'critical',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
        endpoint: '/api/gdpr/delete',
        metadata: {
          error: verification.error,
          domain: body.payload?.domain || body.domain || 'unknown'
        },
      });

      return NextResponse.json(
        { error: verification.error || 'Invalid request signature' },
        { status: 401 }
      );
    }

    // Extract payload from signed request
    const requestData = body.payload || body;

    // Validate request body
    const validationResult = DeleteRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { session_id, email, domain, confirm } = validationResult.data;
    const actorHeader = request.headers.get('x-actor');

    if (!confirm) {
      return NextResponse.json(
        { error: 'Deletion must be confirmed' },
        { status: 400 }
      );
    }

    if (!session_id && !email) {
      return NextResponse.json(
        { error: 'Either session_id or email is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Get conversations to delete
    let query = supabase
      .from('conversations')
      .select('id, session_id');

    if (session_id) {
      query = query.eq('session_id', session_id);
    }
    if (email) {
      query = query.eq('user_email', email);
    }

    const { data: conversations, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!conversations || conversations.length === 0) {
      await supabase.from('gdpr_audit_log').insert({
        domain,
        request_type: 'delete',
        session_id,
        email,
        actor: actorHeader ?? null,
        status: 'completed',
        deleted_count: 0,
        message: 'No data found to delete',
      });

      return NextResponse.json({
        message: 'No data found to delete',
        deleted_count: 0,
      });
    }

    const conversationIds = conversations.map(c => c.id);

    // Delete from ALL user-related tables
    const deletionResults = await Promise.allSettled([
      // 1. Delete conversations (messages and conversation_funnel will cascade delete)
      supabase
        .from('conversations')
        .delete()
        .in('id', conversationIds),

      // 2. Delete chat telemetry by session_id
      session_id
        ? supabase
            .from('chat_telemetry')
            .delete()
            .eq('session_id', session_id)
        : Promise.resolve({ error: null }),

      // 3. Delete chat telemetry by conversation_id
      supabase
        .from('chat_telemetry')
        .delete()
        .in('conversation_id', conversationIds),

      // 4. Delete purchase attributions by customer_email
      email
        ? supabase
            .from('purchase_attributions')
            .delete()
            .eq('customer_email', email)
        : Promise.resolve({ error: null }),

      // 5. Delete purchase attributions by conversation_id (for session-based deletion)
      supabase
        .from('purchase_attributions')
        .delete()
        .in('conversation_id', conversationIds),

      // 6. Delete customer sessions by email
      email
        ? supabase
            .from('customer_sessions')
            .delete()
            .eq('customer_email', email)
        : Promise.resolve({ error: null }),

      // 7. Delete customer sessions by session_id
      session_id
        ? supabase
            .from('customer_sessions')
            .delete()
            .eq('session_id', session_id)
        : Promise.resolve({ error: null }),
    ]);

    // Check for deletion errors
    const errors = deletionResults
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    const deleteErrors = deletionResults
      .filter((result): result is PromiseFulfilledResult<{ error: any }> =>
        result.status === 'fulfilled' && result.value.error !== null
      )
      .map(result => result.value.error);

    if (errors.length > 0 || deleteErrors.length > 0) {
      console.error('GDPR deletion errors:', { errors, deleteErrors });
      throw new Error('Failed to complete deletion');
    }

    // Verify complete deletion
    const verificationResults = await Promise.all([
      supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('id', conversationIds),
      session_id
        ? supabase
            .from('chat_telemetry')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session_id)
        : Promise.resolve({ count: 0 }),
      email
        ? supabase
            .from('purchase_attributions')
            .select('*', { count: 'exact', head: true })
            .eq('customer_email', email)
        : Promise.resolve({ count: 0 }),
      session_id
        ? supabase
            .from('customer_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session_id)
        : Promise.resolve({ count: 0 }),
      email
        ? supabase
            .from('customer_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('customer_email', email)
        : Promise.resolve({ count: 0 }),
    ]);

    const remainingConversations = verificationResults[0].count || 0;
    const remainingTelemetry = verificationResults[1].count || 0;
    const remainingAttributions = verificationResults[2].count || 0;
    const remainingSessions1 = verificationResults[3].count || 0;
    const remainingSessions2 = verificationResults[4].count || 0;
    const remainingSessions = remainingSessions1 + remainingSessions2;

    if (remainingConversations > 0 || remainingTelemetry > 0 || remainingAttributions > 0 || remainingSessions > 0) {
      console.error('[GDPR] Incomplete deletion', {
        remainingConversations,
        remainingTelemetry,
        remainingAttributions,
        remainingSessions,
        session_id,
        email,
      });
    }

    await supabase.from('gdpr_audit_log').insert({
      domain,
      request_type: 'delete',
      session_id,
      email,
      actor: actorHeader ?? null,
      status: 'completed',
      deleted_count: conversationIds.length,
      message: `Deleted ${conversationIds.length} conversation(s) and related data.`,
    });

    // Log successful GDPR deletion for security audit
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    await logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      ip: clientIP,
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint: '/api/gdpr/delete',
      metadata: {
        domain,
        session_id,
        email,
        deleted_count: conversationIds.length,
        actor: actorHeader,
      },
    });

    return NextResponse.json({
      message: 'Data successfully deleted',
      deleted_count: conversationIds.length,
      verification: {
        complete: remainingConversations === 0 && remainingTelemetry === 0 && remainingAttributions === 0 && remainingSessions === 0,
        remainingConversations,
        remainingTelemetry,
        remainingAttributions,
        remainingSessions,
      },
    });
  } catch (error) {
    console.error('GDPR deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
