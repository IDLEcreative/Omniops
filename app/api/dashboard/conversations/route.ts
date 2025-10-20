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
    
    // Fetch recent conversations and status/language data
    const recent: Array<{
      id: string;
      message: string;
      timestamp: string;
      status: 'active' | 'waiting' | 'resolved';
      customerName: string | null;
    }> = [];

    const statusCounts: Record<'active' | 'waiting' | 'resolved', number> = {
      active: 0,
      waiting: 0,
      resolved: 0
    };

    const languageCounts: Record<string, number> = {};
    const peakHourCounts: Record<number, number> = {};

    try {
      const { data: recentConversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          ended_at,
          metadata
        `)
        .order('created_at', { ascending: false })
        .gte('created_at', startDate.toISOString())
        .limit(100);
      
      if (!error && recentConversations) {
        // Try to get messages for each conversation
        for (const conv of recentConversations) {
          const metadata = conv.metadata || {};

          // Determine status
          let status: 'active' | 'waiting' | 'resolved' = 'active';
          const metadataStatus = typeof metadata.status === 'string' ? metadata.status.toLowerCase() : '';
          if (metadataStatus.includes('wait') || metadataStatus.includes('pending')) {
            status = 'waiting';
          } else if (metadataStatus.includes('resolve') || conv.ended_at) {
            status = 'resolved';
          }
          statusCounts[status] += 1;

          // Determine language
          const metadataLanguage =
            typeof metadata.language === 'string'
              ? metadata.language
              : metadata.customer?.language || metadata.customerLanguage;
          const language = metadataLanguage
            ? String(metadataLanguage).trim()
            : 'Unknown';
          languageCounts[language] = (languageCounts[language] || 0) + 1;

          try {
            const { data: messages } = await supabase
              .from('messages')
              .select('content, role, created_at')
              .eq('conversation_id', conv.id)
              .eq('role', 'user')
              .order('created_at', { ascending: false })
              .limit(1);
            
            const firstUserMessage = messages?.[0];
            recent.push({
              id: conv.id,
              message: firstUserMessage?.content?.substring(0, 100) || 'No message',
              timestamp: firstUserMessage?.created_at || conv.created_at,
              status,
              customerName:
                (metadata.customer && typeof metadata.customer.name === 'string'
                  ? metadata.customer.name
                  : metadata.customer_name) || null
            });
          } catch (msgError) {
            console.warn('[Dashboard] Failed to load last message preview', msgError);
            // If we can't get messages, use conversation metadata
            recent.push({
              id: conv.id,
              message: 'Conversation started',
              timestamp: conv.created_at,
              status,
              customerName:
                (metadata.customer && typeof metadata.customer.name === 'string'
                  ? metadata.customer.name
                  : metadata.customer_name) || null
            });
          }
        }
      }
    } catch (error) {
      console.warn('[Dashboard] Error fetching recent conversations:', error);
      // Continue with empty recent array
    }

    // Peak hours calculation based on messages within range
    try {
      const { data: messageTimes } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', new Date().toISOString())
        .limit(5000);

      if (messageTimes) {
        for (const message of messageTimes) {
          const created = new Date(message.created_at);
          const hour = created.getUTCHours();
          peakHourCounts[hour] = (peakHourCounts[hour] || 0) + 1;
        }
      }
    } catch (error) {
      console.warn('[Dashboard] Error calculating peak hours:', error);
    }

    const languages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([language, count]) => ({
        language,
        count,
        percentage:
          currentCount > 0 ? Math.round((count / currentCount) * 100) : 0
      }));

    const peakHours = Object.entries(peakHourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hourString, count], index) => {
        const hour = Number(hourString);
        const start = new Date();
        start.setUTCHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setUTCHours(hour + 1);

        const level = index === 0 ? 'high' : index === 1 ? 'high' : 'medium';

        return {
          hour,
          label: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          level,
          count
        };
      });
    
    // Return the response with whatever data we managed to collect
    return NextResponse.json({
      total: currentCount,
      change: Math.round(change * 10) / 10,
      statusCounts,
      languages,
      peakHours,
      recent: recent.slice(0, 15)
    });
    
  } catch (error) {
    // Catch-all error handler
    console.error('[Dashboard] Unexpected error in conversations endpoint:', error);
    return NextResponse.json({
      total: 0,
      change: 0,
      statusCounts: {
        active: 0,
        waiting: 0,
        resolved: 0,
      },
      languages: [],
      peakHours: [],
      recent: []
    });
  }
}
