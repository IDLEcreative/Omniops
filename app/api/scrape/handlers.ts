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

  // Single page scrape
  const pageData = await scrapePage(url, { turboMode: turbo });

  // Get or create domain
  const domain = new URL(url).hostname.replace('www.', '');

  // First try to get existing domain
  let domainData;
  const { data: existing } = await supabase
    .from('domains')
    .select('*')
    .eq('domain', domain)
    .maybeSingle();

  if (existing) {
    domainData = existing;
  } else {
    // Create new domain if it doesn't exist
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
      logger.error('Failed to create domain', createError, { domain });
      throw new Error(`Failed to create domain ${domain}: ${createError.message}`);
    }
    domainData = created;
  }

  // Save to database
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

  if (pageError) throw pageError;

  // Clear chunk cache for this request
  clearChunkCache();

  // Generate embeddings for the content with deduplication
  const enrichedContent = enrichContent(pageData.content, pageData.metadata);
  const chunks = splitIntoChunks(enrichedContent);
  logger.info('Generated chunks for URL', { chunkCount: chunks.length, url });

  const embeddings = await generateEmbeddings(chunks);

  // Save embeddings
  const embeddingRecords = chunks.map((chunk, index) => ({
    page_id: savedPage.id,
    domain_id: domainData?.id,
    chunk_text: chunk,
    embedding: embeddings[index],
    metadata: { chunk_index: index },
  }));

  const { error: embError } = await supabase
    .from('page_embeddings')
    .insert(embeddingRecords);

  if (embError) throw embError;

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
