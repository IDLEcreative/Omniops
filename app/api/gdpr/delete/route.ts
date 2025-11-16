import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient } from '@/lib/supabase-server';
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

    // Validate request body
    const validationResult = DeleteRequestSchema.safeParse(body);
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
      .select('id');

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

    // Delete conversations (messages will cascade delete)
    const conversationIds = conversations.map(c => c.id);
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .in('id', conversationIds);

    if (deleteError) {
      throw deleteError;
    }

    await supabase.from('gdpr_audit_log').insert({
      domain,
      request_type: 'delete',
      session_id,
      email,
      actor: actorHeader ?? null,
      status: 'completed',
      deleted_count: conversationIds.length,
      message: `Deleted ${conversationIds.length} conversation(s).`,
    });

    return NextResponse.json({
      message: 'Data successfully deleted',
      deleted_count: conversationIds.length,
    });
  } catch (error) {
    console.error('GDPR deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
