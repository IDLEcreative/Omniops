import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * DEBUG ENDPOINT - Development use only
 * Shows configuration and usage statistics for a domain
 *
 * SECURITY: Protected by middleware in production
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  // Additional layer of protection (middleware is primary)
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  try {
    const resolvedParams = await params;
    const domain = resolvedParams.domain;
    const supabase = await createServiceRoleClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }
    
    // Get configuration
    const { data: config, error: configError } = await supabase
      .from('customer_configs')
      .select('domain, woocommerce_enabled, created_at, updated_at')
      .eq('domain', domain)
      .single();

    // Get scraped pages count
    const { count: pageCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .like('url', `%${domain}%`);

    // Get conversation count
    const { count: conversationCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Get recent messages count (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    const status = {
      domain,
      configured: !!config,
      configuration: config || null,
      content: {
        scraped_pages: pageCount || 0,
        has_content: (pageCount || 0) > 0,
      },
      usage: {
        total_conversations: conversationCount || 0,
        messages_last_24h: recentMessages || 0,
      },
      services: {
        database: !configError ? 'connected' : 'error',
        woocommerce: config?.woocommerce_enabled ? 'enabled' : 'disabled',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug information' },
      { status: 500 }
    );
  }
}
