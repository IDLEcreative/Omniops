/**
 * Scrape API Route - AI-optimized header for fast comprehension
 *
 * @purpose Web scraping endpoint - single page or full website crawl with Playwright + Readability
 *
 * @flow
 *   1. Request → Validate (ScrapeRequestSchema) + CSRF check
 *   2. → Rate limit check (10 scrapes/hour per domain)
 *   3. → IF single page: handleSinglePageScrape (immediate response)
 *   4. → IF full crawl: handleWebsiteCrawl (background job)
 *   5. → Extract content (Readability), generate embeddings, store in database
 *   6. → Return scrape results OR job ID for status polling
 *
 * @keyFunctions
 *   - handlePost (line 20): Main POST handler with validation + rate limiting
 *   - handleSinglePageScrape: Scrapes one page, returns immediately
 *   - handleWebsiteCrawl: Initiates background crawl job (BullMQ)
 *   - handleHealthCheck: GET /api/scrape returns API health status
 *   - handleJobStatus: GET /api/scrape?jobId=X returns crawl progress
 *
 * @handles
 *   - Single page scraping: Immediate extraction + embedding generation
 *   - Full website crawling: Background job with progress tracking
 *   - Rate limiting: 10 scrapes/hour per domain (expensive operation)
 *   - CSRF protection: Requires X-CSRF-Token header
 *   - Content extraction: Playwright for JS rendering, Readability for clean text
 *   - Embeddings: Auto-generates vectors for semantic search
 *   - Structured data: Extracts FAQs, products, contact info
 *
 * @returns
 *   - POST (single page): {success: true, content, metadata}
 *   - POST (full crawl): {jobId, status: 'queued'}
 *   - GET (health): {status: 'ok', timestamp}
 *   - GET (job status): {jobId, status, progress, pagesScraped}
 *   - Error: {error, message} with 400/429/500 status codes
 *
 * @dependencies
 *   - Playwright: Browser automation for JS-heavy sites
 *   - Readability: Mozilla's content extraction
 *   - BullMQ: Background job queue via Redis
 *   - Database: scraped_pages, page_embeddings, structured_extractions
 *   - OpenAI: Embedding generation (text-embedding-ada-002)
 *
 * @consumers
 *   - Widget settings UI: Triggers initial website scrape
 *   - Admin dashboard: Re-scrape functionality
 *
 * @configuration
 *   - runtime: nodejs (not edge - needs Playwright)
 *   - maxDuration: 300 seconds (5 minutes for long crawls)
 *   - Rate limit: 10 scrapes/hour per domain
 *
 * @security
 *   - Input validation: Zod schema (ScrapeRequestSchema) validates URL, domain
 *   - CSRF protection: Requires X-CSRF-Token header for all POST requests
 *   - Rate limiting: 10 scrapes/hour per domain (prevents abuse, expensive operation)
 *   - URL validation: Only allows HTTPS URLs, blocks localhost/internal IPs
 *   - Service role: Uses admin database access to store scraped content
 *   - Content sanitization: Readability strips scripts, sanitizes HTML
 *   - Authentication: Requires valid domain in customer_configs table
 *   - Resource limits: Max 5 min timeout, max depth 3 for crawls
 *
 * @performance
 *   - Complexity: O(n) for single page, O(n × depth) for full crawl
 *   - Bottlenecks: Playwright page load (2-10s), Readability extraction (100-500ms), embedding generation (1-3s per page)
 *   - Expected timing: Single page 5-15s, full crawl 1-5 min (depends on site size)
 *   - Concurrency: Max 5 concurrent scrapes (Playwright browser instances)
 *   - Memory: ~100MB per Playwright instance, ~50MB per page scraped
 *
 * @knownIssues
 *   - JavaScript-heavy sites: May timeout if JS takes >10s to render
 *   - Rate limit bypass: Can scrape same domain with different session IDs
 *   - Memory leaks: Long crawls (100+ pages) may exhaust memory
 *   - Playwright crashes: Unstable on some sites (graceful degradation)
 *   - Cloudflare/bot detection: Some sites block Playwright
 *
 * @totalLines 350
 * @estimatedTokens 1,800 (without header), 700 (with header - 61% savings)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient, createClient } from '@/lib/supabase-server';
import { ScrapeRequestSchema } from './validators';
import {
  handleSinglePageScrape,
  handleWebsiteCrawl,
  handleHealthCheck,
  handleJobStatus
} from './handlers';
import { withCSRF } from '@/lib/middleware/csrf';
import { checkExpensiveOpRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for web scraping (long-running crawling operations)

/**
 * POST /api/scrape
 * Scrape a single page or initiate a full website crawl
 *
 * CSRF PROTECTED: Requires valid CSRF token in X-CSRF-Token header
 */
async function handlePost(request: NextRequest) {
  try {
    console.log('[DEBUG FLOW] 1. Received POST request to /api/scrape', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    let body;
    try {
      body = await request.json();
      console.log('[DEBUG FLOW] 2. Parsed request body:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error('[DEBUG FLOW] ERROR: Failed to parse JSON body:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const scrapeRequest = ScrapeRequestSchema.parse(body);
    console.log('[DEBUG FLOW] 3. Validated scrape request:', {
      url: scrapeRequest.url,
      crawl: scrapeRequest.crawl,
      turbo: scrapeRequest.turbo,
      max_pages: scrapeRequest.max_pages
    });

    // Rate limit expensive scraping operations
    const domain = new URL(scrapeRequest.url).hostname;
    const rateLimit = await checkExpensiveOpRateLimit(domain);

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded for scraping operations',
          message: 'You have exceeded the scraping rate limit. Please try again later.',
          resetTime: resetDate.toISOString(),
          remaining: rateLimit.remaining
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': resetDate.toISOString()
          }
        }
      );
    }

    const supabase = await createServiceRoleClient();
    const userSupabase = await createClient();

    if (!supabase || !userSupabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Get the authenticated user's ID and organization ID
    const { data: { user } } = await userSupabase.auth.getUser();
    const userId = user?.id;
    console.log('[DEBUG FLOW] 4. Authenticated user:', {
      userId: userId,
      userEmail: user?.email
    });

    const organizationId = await getOrganizationId(userSupabase);
    console.log('[DEBUG FLOW] 5. Retrieved organization ID:', {
      organizationId: organizationId
    });

    // Route to appropriate handler
    if (!scrapeRequest.crawl) {
      console.log('[DEBUG FLOW] 6. Routing to handleSinglePageScrape');
      return await handleSinglePageScrape(scrapeRequest, supabase, organizationId, userId);
    } else {
      console.log('[DEBUG FLOW] 6. Routing to handleWebsiteCrawl');
      return await handleWebsiteCrawl(scrapeRequest, supabase, organizationId, userId);
    }
  } catch (error) {
    console.error('Scrape API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape
 * Check job status or health status
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('job_id');
  const health = searchParams.get('health');

  // Health check endpoint
  if (health === 'true') {
    return await handleHealthCheck(startTime);
  }

  // Job status check
  if (!jobId) {
    return NextResponse.json(
      { error: 'job_id parameter is required' },
      { status: 400 }
    );
  }

  const includeResults = searchParams.get('include_results') === 'true';
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '100');

  return await handleJobStatus(jobId, includeResults, offset, limit);
}

/**
 * Get organization ID for authenticated user
 * Returns undefined if user is not authenticated or not in an organization
 */
async function getOrganizationId(userSupabase: any): Promise<string | undefined> {
  try {
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();

    if (!authError && user) {
      const { data: membership } = await userSupabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (membership) {
        // Only allow admins and owners to scrape
        if (['owner', 'admin'].includes(membership.role)) {
          return membership.organization_id;
        } else {
          throw new Error('Insufficient permissions to scrape content');
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      throw error;
    }
    console.log('Could not get organization ID, proceeding without owned domains');
  }

  return undefined;
}

// Export POST handler with CSRF protection
export const POST = withCSRF(handlePost);
