import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient } from '@/lib/supabase-server';
import { crawlWebsite } from '@/lib/scraper-api';
import { DomainRefreshLock } from '@/lib/domain-refresh-lock';

/**
 * Process a domain with automatic retry logic and exponential backoff
 */
async function processDomainWithRetry(
  domain: { id: string; domain: string; organization_id: string },
  domainLock: DomainRefreshLock,
  maxRetries: number = parseInt(process.env.CRON_MAX_RETRIES || '3')
): Promise<{ success: boolean; jobId?: string; error?: string; attempts: number }> {
  const retryDelay = parseInt(process.env.CRON_RETRY_DELAY || '60') * 1000; // Convert to ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Cron] Attempt ${attempt}/${maxRetries} for ${domain.domain}`);

      const jobId = await crawlWebsite(`https://${domain.domain}`, {
        maxPages: parseInt(process.env.CRON_MAX_PAGES || '-1'),
        forceRescrape: true,
        organizationId: domain.organization_id,
        configPreset: 'production',
        turboMode: true,
      });

      console.log(`[Cron] ✅ Success on attempt ${attempt}: ${domain.domain}`);
      return { success: true, jobId, attempts: attempt };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Cron] ❌ Attempt ${attempt} failed for ${domain.domain}:`, errorMsg);

      if (attempt < maxRetries) {
        const delay = retryDelay * attempt; // Exponential: 60s, 120s, 180s
        console.log(`[Cron] ⏳ Waiting ${delay/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return { success: false, error: errorMsg, attempts: attempt };
      }
    }
  }

  return { success: false, error: 'Max retries exceeded', attempts: maxRetries };
}

// This endpoint uses parallel processing with Crawlee + Playwright (same as initial scraper)
export async function GET(request: NextRequest) {
  // Verify the request is authorized
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection unavailable' },
      { status: 503 }
    );
  }

  try {
    // Get all active domains
    const { data: domains, error } = await supabase
      .from('domains')
      .select('id, domain, organization_id')
      .eq('active', true);

    if (error) throw error;

    const results = [];
    const domainLock = new DomainRefreshLock();

    // Process each domain with parallel crawler and retry logic
    for (const domain of domains || []) {
      try {
        // Attempt to acquire lock
        const lockAcquired = await domainLock.acquire(domain.id);

        if (!lockAcquired) {
          console.log(`[Cron] ⏭️ Skipping ${domain.domain} - refresh already in progress`);
          results.push({
            domainId: domain.id,
            domain: domain.domain,
            success: false,
            skipped: true,
            message: 'Refresh already in progress, skipped to prevent conflicts',
          });
          continue;
        }

        console.log(`[Cron] 🔄 Refreshing domain: ${domain.domain}`);
        console.log(`[Cron]   - forceRescrape: true (forcing full re-scrape)`);
        console.log(`[Cron]   - maxPages: ${process.env.CRON_MAX_PAGES || '-1'}`);
        console.log(`[Cron]   - turboMode: true`);
        console.log(`[Cron]   - Using Crawlee + Playwright (same as initial scraper)`);
        console.log(`[Cron]   - Sitemap discovery ENABLED`);
        console.log(`[Cron]   - Retry logic: ${process.env.CRON_MAX_RETRIES || '3'} attempts with exponential backoff`);

        // Process domain with automatic retry logic
        const result = await processDomainWithRetry(domain, domainLock);

        // Release lock after job completes (or timeout)
        // Note: Lock will auto-expire after 5 minutes if something crashes
        setTimeout(async () => {
          await domainLock.release(domain.id);
        }, 5 * 60 * 1000); // 5 minutes

        if (result.success) {
          console.log(`✅ Started parallel refresh job: ${result.jobId} for ${domain.domain} (attempt ${result.attempts})`);
          results.push({
            domainId: domain.id,
            domain: domain.domain,
            success: true,
            jobId: result.jobId,
            attempts: result.attempts,
            message: `Parallel refresh started after ${result.attempts} attempt(s)`,
          });
        } else {
          console.error(`❌ Failed to start refresh for ${domain.domain} after ${result.attempts} attempts: ${result.error}`);
          results.push({
            domainId: domain.id,
            domain: domain.domain,
            success: false,
            attempts: result.attempts,
            error: result.error,
          });
        }
      } catch (error) {
        // Release lock on error
        await domainLock.release(domain.id);
        console.error(`❌ Failed to start refresh for ${domain.domain}:`, error);
        results.push({
          domainId: domain.id,
          domain: domain.domain,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // After all domains processed, run cleanup of old deleted pages
    console.log('\n🧹 Running cleanup of old deleted pages...');

    try {
      const { default: cleanupDeletedPages } = await import('@/scripts/database/cleanup-deleted-pages');
      await cleanupDeletedPages();
      console.log('✅ Deleted pages cleanup complete');
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
      // Don't fail the entire cron job if cleanup fails
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      cleanup: 'Deleted pages cleaned up',
      timestamp: new Date().toISOString(),
      message: 'All domains queued for parallel refresh with sitemap discovery',
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
    const { domainIds, maxPages = -1 } = body;

    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Get domains to refresh
    let query = supabase.from('domains').select('id, domain, organization_id');

    if (domainIds && domainIds.length > 0) {
      query = query.in('id', domainIds);
    }

    const { data: domains, error } = await query;

    if (error) throw error;

    const results = [];
    const domainLock = new DomainRefreshLock();

    for (const domain of domains || []) {
      try {
        // Attempt to acquire lock
        const lockAcquired = await domainLock.acquire(domain.id);

        if (!lockAcquired) {
          console.log(`[Manual] ⏭️ Skipping ${domain.domain} - refresh already in progress`);
          results.push({
            domainId: domain.id,
            domain: domain.domain,
            success: false,
            skipped: true,
            message: 'Refresh already in progress, skipped to prevent conflicts',
          });
          continue;
        }

        const jobId = await crawlWebsite(`https://${domain.domain}`, {
          maxPages,
          forceRescrape: true,
          organizationId: domain.organization_id,
          configPreset: 'production',
          turboMode: true,
        });

        // Release lock after job completes (or timeout)
        setTimeout(async () => {
          await domainLock.release(domain.id);
        }, 5 * 60 * 1000); // 5 minutes

        results.push({
          domainId: domain.id,
          domain: domain.domain,
          success: true,
          jobId,
        });
      } catch (error) {
        // Release lock on error
        await domainLock.release(domain.id);
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
