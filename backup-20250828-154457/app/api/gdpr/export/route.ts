import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
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

    if (!session_id && !email) {
      return NextResponse.json(
        { error: 'Either session_id or email is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

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

    const { data: conversations, error } = await query;

    if (error) {
      throw error;
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

    // Return as JSON (could also generate CSV or PDF)
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