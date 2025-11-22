import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

const ExportRequestSchema = z.object({
  session_id: z.string().optional(),
  email: z.string().email().optional(),
  domain: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const { session_id, email, domain } = ExportRequestSchema.parse(body);
    const actorHeader = request.headers.get('x-actor');

    if (!session_id && !email) {
      return NextResponse.json(
        { error: 'Either session_id or email is required' },
        { status: 400 }
      );
    }

    // 3. Create service role client for data export
    const serviceSupabase = await createServiceRoleClient();

    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // 4. Verify user has access to this domain's organization
    const { data: config } = await serviceSupabase
      .from('customer_configs')
      .select('organization_id')
      .eq('domain', domain)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    const { data: membership } = await serviceSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', config.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied - you do not have permission to export data for this domain' },
        { status: 403 }
      );
    }

    // 5. Get all conversations for the user (only from allowed domain)
    let query = serviceSupabase
      .from('conversations')
      .select(`
        id,
        created_at,
        messages (
          role,
          content,
          created_at
        )
      `)
      .eq('domain', domain); // Ensure we only export data from the requested domain

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

    // 6. Format data for export
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

    // 7. Log export request for audit compliance
    await serviceSupabase.from('gdpr_audit_log').insert({
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
