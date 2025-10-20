import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

const ExportRequestSchema = z.object({
  session_id: z.string().optional(),
  email: z.string().email().optional(),
  domain: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
  const { session_id, email, domain } = ExportRequestSchema.parse(body);
  const actorHeader = request.headers.get('x-actor');

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

    // Get all conversations for the user
    let query = supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        messages (
          role,
          content,
          created_at
        )
      `);

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

    // Format data for export
    const exportData = {
      export_date: new Date().toISOString(),
      domain,
      user_identifier: email || session_id,
      conversations: conversations || [],
      metadata: {
        total_conversations: conversations?.length || 0,
        total_messages: conversations?.reduce((acc, conv) => acc + (conv.messages?.length || 0), 0) || 0,
      },
    };

    await supabase.from('gdpr_audit_log').insert({
      domain,
      request_type: 'export',
      session_id,
      email,
      actor: actorHeader ?? null,
      status: 'completed',
      deleted_count: null,
      message: `Export generated with ${exportData.metadata.total_conversations} conversations.`,
    });

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="chat-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
