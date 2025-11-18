import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }
    
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
    
    // Get domain statistics with pagination
    // ✅ Optimized: Uses pagination to prevent OOM on large datasets
    // ✅ Optimized: Only fetches domain column
    const uniqueDomains = new Set<string>();
    let offset = 0;
    const batchSize = 5000;
    let hasMore = true;

    while (hasMore) {
      const { data: domainBatch, error: domainError } = await supabase
        .from('scraped_pages')
        .select('domain')
        .not('domain', 'is', null)
        .range(offset, offset + batchSize - 1);

      if (domainError) throw domainError;

      if (domainBatch && domainBatch.length > 0) {
        domainBatch.forEach(d => {
          if (d.domain) uniqueDomains.add(d.domain);
        });
        offset += batchSize;

        if (domainBatch.length < batchSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    // Get embeddings statistics
    const { count: totalEmbeddings, error: embeddingsError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    if (embeddingsError) {
      console.warn('Could not fetch embeddings count:', embeddingsError);
    }
    
    // Get content statistics with pagination
    // ✅ Optimized: Uses pagination to prevent OOM on large datasets
    // ✅ Optimized: Only fetches content_length column
    const contentLengths: number[] = [];
    offset = 0;
    hasMore = true;

    while (hasMore) {
      const { data: contentBatch, error: contentError } = await supabase
        .from('scraped_pages')
        .select('content_length')
        .not('content_length', 'is', null)
        .range(offset, offset + batchSize - 1);

      if (contentError) {
        console.warn('Could not fetch content stats:', contentError);
        break;
      }

      if (contentBatch && contentBatch.length > 0) {
        contentBatch.forEach(item => {
          if (item.content_length) contentLengths.push(item.content_length);
        });
        offset += batchSize;

        if (contentBatch.length < batchSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    let avgContentLength = 0;
    if (contentLengths.length > 0) {
      const totalLength = contentLengths.reduce((sum, len) => sum + len, 0);
      avgContentLength = Math.round(totalLength / contentLengths.length);
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
        embeddingCoverage: totalPages && totalPages > 0 
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
        domains: [],
        error: 'Failed to fetch scraped data'
      },
      { status: 500 }
    );
  }
}