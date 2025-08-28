import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient } from '@/lib/supabase-server';
import { refreshDomainContent } from '@/lib/content-refresh';

// This endpoint can be called by a cron service to refresh content
export async function GET(request: NextRequest) {
  // Verify the request is authorized (add your own auth method)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const supabase = await createServiceRoleClient();
  
  try {
    // Get all domains that need refresh
    const hoursThreshold = 24; // Refresh content older than 24 hours
    
    const { data: domains, error } = await supabase
      .from('domains')
      .select('id, domain, last_content_refresh')
      .or(`last_content_refresh.is.null,last_content_refresh.lt.${new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString()}`);
    
    if (error) throw error;
    
    const results = [];
    
    // Process each domain
    for (const domain of domains || []) {
      try {
        console.log(`Refreshing content for domain: ${domain.domain}`);
        
        const stats = await refreshDomainContent(domain.id, {
          forceRefresh: false,
          maxPages: 50, // Limit per domain to prevent long-running jobs
        });
        
        results.push({
          domainId: domain.id,
          domain: domain.domain,
          success: true,
          stats,
        });
      } catch (error) {
        console.error(`Failed to refresh ${domain.domain}:`, error);
        results.push({
          domainId: domain.id,
          domain: domain.domain,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron refresh error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint with domain filtering
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainIds, forceRefresh = false } = body;
    
    const supabase = await createServiceRoleClient();
    
    // Get domains to refresh
    let query = supabase.from('domains').select('id, domain');
    
    if (domainIds && domainIds.length > 0) {
      query = query.in('id', domainIds);
    }
    
    const { data: domains, error } = await query;
    
    if (error) throw error;
    
    const results = [];
    
    for (const domain of domains || []) {
      try {
        const stats = await refreshDomainContent(domain.id, {
          forceRefresh,
          maxPages: 100,
        });
        
        results.push({
          domainId: domain.id,
          domain: domain.domain,
          success: true,
          stats,
        });
      } catch (error) {
        results.push({
          domainId: domain.id,
          domain: domain.domain,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
