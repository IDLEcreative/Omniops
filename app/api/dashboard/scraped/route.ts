import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    // Count total scraped pages
    const { count: totalPages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    if (pagesError) throw pagesError;
    
    // Get last update time
    const { data: lastUpdatedData, error: lastUpdateError } = await supabase
      .from('scraped_pages')
      .select('scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1);
    
    if (lastUpdateError) throw lastUpdateError;
    
    // Count queued scraping jobs
    const { count: queuedJobs, error: jobsError } = await supabase
      .from('scrape_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing']);
    
    if (jobsError) {
      console.warn('Could not fetch scrape jobs:', jobsError);
    }
    
    // Get domain statistics
    const { data: domainStats, error: domainError } = await supabase
      .from('scraped_pages')
      .select('domain')
      .not('domain', 'is', null);
    
    if (domainError) throw domainError;
    
    // Count unique domains
    const uniqueDomains = new Set(domainStats?.map(d => d.domain) || []);
    
    // Get embeddings statistics
    const { count: totalEmbeddings, error: embeddingsError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    if (embeddingsError) {
      console.warn('Could not fetch embeddings count:', embeddingsError);
    }
    
    // Get content statistics
    const { data: contentStats, error: contentError } = await supabase
      .from('scraped_pages')
      .select('content_length')
      .not('content_length', 'is', null);
    
    let avgContentLength = 0;
    if (!contentError && contentStats && contentStats.length > 0) {
      const totalLength = contentStats.reduce((sum, item) => sum + (item.content_length || 0), 0);
      avgContentLength = Math.round(totalLength / contentStats.length);
    }
    
    const lastUpdated = lastUpdatedData && lastUpdatedData[0]
      ? lastUpdatedData[0].scraped_at
      : new Date().toISOString();
    
    return NextResponse.json({
      totalPages: totalPages || 0,
      lastUpdated,
      queuedJobs: queuedJobs || 0,
      statistics: {
        uniqueDomains: uniqueDomains.size,
        totalEmbeddings: totalEmbeddings || 0,
        avgContentLength,
        embeddingCoverage: totalPages > 0 
          ? Math.round(((totalEmbeddings || 0) / totalPages) * 100) 
          : 0
      },
      domains: Array.from(uniqueDomains).slice(0, 5) // Top 5 domains
    });
    
  } catch (error) {
    console.error('[Dashboard] Error fetching scraped data:', error);
    return NextResponse.json(
      { 
        totalPages: 0,
        lastUpdated: new Date().toISOString(),
        queuedJobs: 0,
        statistics: {
          uniqueDomains: 0,
          totalEmbeddings: 0,
          avgContentLength: 0,
          embeddingCoverage: 0
        },
        domains: []
      },
      { status: 200 }
    );
  }
}