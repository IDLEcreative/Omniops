import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Initialize Supabase client inside the function
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user's conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', userId)
      .order('created_at', { ascending: false });

    if (convError) {
      throw convError;
    }

    // Fetch user's messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', userId)
      .order('created_at', { ascending: false });

    if (msgError) {
      throw msgError;
    }

    // Create export data
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      data_retention_days: 30,
      conversations: conversations || [],
      messages: messages || [],
      metadata: {
        total_conversations: conversations?.length || 0,
        total_messages: messages?.length || 0,
        date_range: {
          oldest: messages?.[messages.length - 1]?.created_at || null,
          newest: messages?.[0]?.created_at || null,
        },
      },
    };

    // Log the export request for compliance
    await supabase.from('privacy_requests').insert({
      user_id: userId,
      request_type: 'export',
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="chat-data-export-${userId}-${Date.now()}.json"`,
      },
    });

  } catch (error) {
    console.error('Privacy export error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}