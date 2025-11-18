import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
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

    // ✅ SECURITY FIX: Require authentication for GDPR export
    // This prevents unauthorized access to user conversation data
    const authClient = await createClient();

    if (!authClient) {
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required to export data' },
        { status: 401 }
      );
    }

    // Verify user has access to this domain via organization membership
    const { data: membership, error: membershipError } = await authClient
      .from('organization_members')
      .select('organization_id, organizations(customer_configs(domain))')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden - No organization access' },
        { status: 403 }
      );
    }

    // Check if the requested domain belongs to user's organization
    const orgDomains = (membership.organizations as any)?.customer_configs || [];
    const hasAccess = orgDomains.some((config: any) => config.domain === domain);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - No access to this domain' },
        { status: 403 }
      );
    }

    // TODO: Implement email verification before export for additional security
    // Send verification email and require confirmation before proceeding

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
