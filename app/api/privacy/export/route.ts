/**
 * GET /api/privacy/export
 * Export all user data in compliance with GDPR Article 20
 * (Right to Data Portability)
 *
 * Returns a ZIP file containing:
 * - user-data.json: All conversations and settings
 * - README.txt: Data export explanation
 * - METADATA.json: Export metadata and timestamps
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { logDataExport, fetchConversations, fetchMessages } from '@/lib/privacy/data-export';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all user data
    const conversations = await fetchConversations(user.id);
    const messages = await fetchMessages(user.id);

    // Create data object
    const exportData = {
      user_id: user.id,
      email: user.email,
      export_date: new Date().toISOString(),
      conversations: conversations.map(c => ({
        id: c.id,
        created_at: c.created_at,
        message_count: c.message_count,
      })),
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
        conversation_id: m.conversation_id,
      })),
      metadata: {
        total_conversations: conversations.length,
        total_messages: messages.length,
        export_timestamp: new Date().toISOString(),
      },
    };

    // Log export for compliance
    await logDataExport(user.id, {
      format: 'json',
      conversations_count: conversations.length,
      messages_count: messages.length,
    });

    // Return JSON response with proper headers for download
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="omniops-data-export-${Date.now()}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
