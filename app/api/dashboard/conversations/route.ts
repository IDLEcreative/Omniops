import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get date range from query params (default to last 7 days)
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Create previous period date for comparison
    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2));
    
    // Initialize default response
    const defaultResponse = {
      total: 0,
      change: 0,
      recent: []
    };
    
    // Try to create Supabase client
    let supabase;
    try {
      supabase = await createServiceRoleClient();
      if (!supabase) {
        console.warn('[Dashboard] Supabase client is null, returning defaults');
        return NextResponse.json(defaultResponse);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to create Supabase client:', error);
      return NextResponse.json(defaultResponse);
    }
    
    // Fetch current period count
    let currentCount = 0;
    try {
      const { count, error } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());
      
      if (error) {
        console.warn('[Dashboard] Error fetching current count:', error.message);
      } else {
        currentCount = count || 0;
      }
    } catch (error) {
      console.error('[Dashboard] Exception fetching current count:', error);
    }
    
    // Fetch previous period count for comparison
    let previousCount = 0;
    try {
      const { count, error } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());
      
      if (error) {
        console.warn('[Dashboard] Error fetching previous count:', error.message);
      } else {
        previousCount = count || 0;
      }
    } catch (error) {
      console.error('[Dashboard] Exception fetching previous count:', error);
    }
    
    // Calculate change percentage
    const change = previousCount > 0 
      ? ((currentCount - previousCount) / previousCount) * 100 
      : 0;
    
    // Fetch recent conversations (optional - don't fail if this errors)
    let recent = [];
    try {
      const { data: recentConversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          metadata
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && recentConversations) {
        // Try to get messages for each conversation
        for (const conv of recentConversations) {
          try {
            const { data: messages } = await supabase
              .from('messages')
              .select('content, role')
              .eq('conversation_id', conv.id)
              .eq('role', 'user')
              .order('created_at', { ascending: false })
              .limit(1);
            
            const firstUserMessage = messages?.[0];
            recent.push({
              id: conv.id,
              message: firstUserMessage?.content?.substring(0, 100) || 'No message',
              timestamp: conv.created_at
            });
          } catch (msgError) {
            // If we can't get messages, use conversation metadata
            recent.push({
              id: conv.id,
              message: 'Conversation started',
              timestamp: conv.created_at
            });
          }
        }
      }
    } catch (error) {
      console.warn('[Dashboard] Error fetching recent conversations:', error);
      // Continue with empty recent array
    }
    
    // Return the response with whatever data we managed to collect
    return NextResponse.json({
      total: currentCount,
      change: Math.round(change * 10) / 10,
      recent: recent.slice(0, 10) // Ensure we don't return too many
    });
    
  } catch (error) {
    // Catch-all error handler
    console.error('[Dashboard] Unexpected error in conversations endpoint:', error);
    return NextResponse.json({
      total: 0,
      change: 0,
      recent: []
    });
  }
}