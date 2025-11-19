import { NextResponse } from 'next/server';
import { scrapePage, checkCrawlStatus, getHealthStatus } from '@/lib/scraper-api';
import { crawlWebsiteWithCleanup } from '@/lib/scraper-with-cleanup';
import {
  generateEmbeddings,
  splitIntoChunks,
  clearChunkCache,
  enrichContent
} from './services';
import { processCrawlResults } from './crawl-processor';
import type { ScrapeRequest } from './validators';
import { logger } from '@/lib/logger';

/**
 * Handle single page scraping
 */
export async function handleSinglePageScrape(
  request: ScrapeRequest,
  supabase: any,
  organizationId?: string,
  userId?: string
): Promise<NextResponse> {
  const { url, turbo } = request;

  console.log('[DEBUG FLOW] 7. Starting handleSinglePageScrape', {
    url,
    turbo,
    organizationId,
    userId
  });

  // Single page scrape
  console.log('[DEBUG FLOW] 8. Calling scrapePage...');
  const pageData = await scrapePage(url, { turboMode: turbo });
  console.log('[DEBUG FLOW] 9. Scraped page data received:', {
    url: pageData.url,
    title: pageData.title,
    contentLength: pageData.content?.length,
    metadataKeys: Object.keys(pageData.metadata || {})
  });

  // Get or create domain
  const domain = new URL(url).hostname.replace('www.', '');
  console.log('[DEBUG FLOW] 10. Extracted domain:', domain);

  // First try to get existing domain
  let domainData;
  console.log('[DEBUG FLOW] 11. Querying for existing domain...');
  const { data: existing } = await supabase
    .from('domains')
    .select('*')
    .eq('domain', domain)
    .maybeSingle();

  console.log('[DEBUG FLOW] 12. Existing domain query result:', {
    found: !!existing,
    domainId: existing?.id,
    existingUserId: existing?.user_id,
    existingOrgId: existing?.organization_id
  });

  if (existing) {
    // Update existing domain with user_id if not already set
    if (!existing.user_id && userId) {
      console.log('[DEBUG FLOW] 13. Updating existing domain with user_id:', userId);
      const { data: updated, error: updateError } = await supabase
        .from('domains')
        .update({ user_id: userId })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('[DEBUG FLOW] ERROR: Failed to update domain:', updateError);
      } else {
        console.log('[DEBUG FLOW] 14. Successfully updated domain:', {
          domainId: updated?.id,
          userId: updated?.user_id
        });
      }
      domainData = updated || existing;
    } else {
      console.log('[DEBUG FLOW] 13. Using existing domain (no update needed)');
      domainData = existing;
    }
  } else {
    // Create new domain if it doesn't exist
    console.log('[DEBUG FLOW] 13. Creating new domain:', {
      domain,
      organizationId,
      userId
    });
    const { data: created, error: createError } = await supabase
      .from('domains')
      .insert({
        domain,
        organization_id: organizationId,
        user_id: userId  // Always set user_id for domain ownership
      })
      .select()
      .single();

    if (createError) {
      console.error('[DEBUG FLOW] ERROR: Failed to create domain:', createError);
      logger.error('Failed to create domain', createError, { domain });
      throw new Error(`Failed to create domain ${domain}: ${createError.message}`);
    }
    console.log('[DEBUG FLOW] 14. Successfully created domain:', {
      domainId: created?.id,
      userId: created?.user_id,
      orgId: created?.organization_id
    });
    domainData = created;
  }

  console.log('[DEBUG FLOW] 15. Final domainData:', {
    id: domainData?.id,
    domain: domainData?.domain,
    user_id: domainData?.user_id,
    organization_id: domainData?.organization_id
  });

  // Save to database
  console.log('[DEBUG FLOW] 16. Attempting to save scraped page to database:', {
    url: pageData.url,
    domain_id: domainData?.id,
    title: pageData.title,
    contentLength: pageData.content?.length
  });

  const { data: savedPage, error: pageError } = await supabase
    .from('scraped_pages')
    .upsert({
      url: pageData.url,
      domain_id: domainData?.id,
      title: pageData.title,
      content: pageData.content,
      metadata: pageData.metadata,
      last_scraped_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (pageError) {
    console.error('[DEBUG FLOW] ERROR: Failed to save scraped page:', pageError);
    throw pageError;
  }

  console.log('[DEBUG FLOW] 17. Successfully saved scraped page:', {
    id: savedPage?.id,
    url: savedPage?.url,
    domain_id: savedPage?.domain_id
  });

  // Clear chunk cache for this request
  clearChunkCache();

  // Generate embeddings for the content with deduplication
  console.log('[DEBUG FLOW] 18. Enriching content and splitting into chunks...');
  const enrichedContent = enrichContent(pageData.content, pageData.metadata);
  const chunks = splitIntoChunks(enrichedContent);
  console.log('[DEBUG FLOW] 19. Generated chunks:', {
    chunkCount: chunks.length,
    url
  });
  logger.info('Generated chunks for URL', { chunkCount: chunks.length, url });

  console.log('[DEBUG FLOW] 20. Generating embeddings...');
  const embeddings = await generateEmbeddings(chunks);
  console.log('[DEBUG FLOW] 21. Generated embeddings:', {
    embeddingCount: embeddings.length
  });

  // Save embeddings
  const embeddingRecords = chunks.map((chunk, index) => ({
    page_id: savedPage.id,
    domain_id: domainData?.id,
    chunk_text: chunk,
    embedding: embeddings[index],
    metadata: { chunk_index: index },
  }));

  console.log('[DEBUG FLOW] 22. Saving embeddings to database...', {
    recordCount: embeddingRecords.length
  });

  const { error: embError } = await supabase
    .from('page_embeddings')
    .insert(embeddingRecords);

  if (embError) {
    console.error('[DEBUG FLOW] ERROR: Failed to save embeddings:', embError);
    throw embError;
  }

  console.log('[DEBUG FLOW] 23. Successfully saved embeddings');
  console.log('[DEBUG FLOW] 24. Returning success response:', {
    id: savedPage.id,
    status: 'completed',
    pages_scraped: 1
  });

  return NextResponse.json({
    id: savedPage.id,           // Return scraped_pages ID for tracking
    status: 'completed',
    pages_scraped: 1,
    message: `Successfully scraped and indexed ${url}`,
  });
}

/**
 * Handle full website crawl
 */
export async function handleWebsiteCrawl(
  request: ScrapeRequest,
  supabase: any,
  organizationId?: string,
  userId?: string
): Promise<NextResponse> {
  const { url, max_pages, turbo } = request;

  // Full website crawl (turbo mode integrated into main crawler)
  const jobId = await crawlWebsiteWithCleanup(url, {
    maxPages: max_pages,
    excludePaths: ['/wp-admin', '/admin', '/login', '/cart', '/checkout'],
    turboMode: turbo,
    organizationId: organizationId,
  });

  // Start a background job to process the crawl results
  processCrawlResults(jobId, supabase);

  return NextResponse.json({
    status: 'started',
    job_id: jobId,
    turbo_mode: turbo,
    message: `Started ${turbo ? 'TURBO' : 'standard'} crawling ${url}. This may take a few minutes.`,
  });
}

/**
 * Handle health check
 */
export async function handleHealthCheck(startTime: number): Promise<NextResponse> {
  try {
    const healthStatus = await getHealthStatus();
    const endTime = performance.now();

    return NextResponse.json({
      status: 'ok',
      ...healthStatus,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=5',
        'X-Response-Time': `${(endTime - startTime).toFixed(2)}ms`
      }
    });
  } catch (error) {
    const endTime = performance.now();
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to get health status',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${(endTime - startTime).toFixed(2)}ms`
        }
      }
    );
  }
}

/**
 * Handle job status check
 */
export async function handleJobStatus(
  jobId: string,
  includeResults: boolean,
  offset: number,
  limit: number
): Promise<NextResponse> {
  try {
    const status = await checkCrawlStatus(jobId, {
      includeResults,
      offset,
      limit,
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking crawl status:', error);

    // If job not found, return 404 instead of 500
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Job not found', job_id: jobId },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check crawl status' },
      { status: 500 }
    );
  }
}
