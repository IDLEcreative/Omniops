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

/**
 * POST /api/scrape
 * Scrape a single page or initiate a full website crawl
 *
 * CSRF PROTECTED: Requires valid CSRF token in X-CSRF-Token header
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const scrapeRequest = ScrapeRequestSchema.parse(body);

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

    // Get the authenticated user's organization ID
    const organizationId = await getOrganizationId(userSupabase);

    // Route to appropriate handler
    if (!scrapeRequest.crawl) {
      return await handleSinglePageScrape(scrapeRequest, supabase);
    } else {
      return await handleWebsiteCrawl(scrapeRequest, supabase, organizationId);
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
