/**
 * Scheduled Content Refresh System
 * 
 * Automatically refreshes scraped content on a periodic schedule to ensure
 * data freshness. Uses intelligent change detection to avoid unnecessary work.
 * 
 * Schedule: Daily at 2:00 AM UTC
 * Change Detection: SHA-256 content hashing
 * Batch Size: 50 pages per domain
 */

import cron from 'node-cron';

const REFRESH_INTERVAL_HOURS = 24;
const MAX_PAGES_PER_DOMAIN = 50;
const CRON_SCHEDULE = '0 2 * * *'; // 2 AM daily

let refreshJob: cron.ScheduledTask | null = null;

/**
 * Initialize the scheduled content refresh system
 * Runs daily at 2 AM UTC to refresh stale content
 */
export function initializeContentRefresh() {
  if (refreshJob) {
    console.log('[Content Refresh] Already initialized');
    return refreshJob;
  }

  console.log('[Content Refresh] Initializing daily refresh job...');
  console.log(`[Content Refresh] Schedule: ${CRON_SCHEDULE} (2 AM UTC daily)`);
  console.log(`[Content Refresh] Interval: ${REFRESH_INTERVAL_HOURS} hours`);
  console.log(`[Content Refresh] Max pages per domain: ${MAX_PAGES_PER_DOMAIN}`);

  refreshJob = cron.schedule(CRON_SCHEDULE, async () => {
    console.log('[Content Refresh] Starting scheduled refresh...');
    
    try {
      const result = await triggerContentRefresh();
      
      if (result.success) {
        console.log('[Content Refresh] ✅ Completed successfully');
        console.log(`[Content Refresh] Domains processed: ${result.domainsProcessed}`);
        console.log(`[Content Refresh] Pages refreshed: ${result.pagesRefreshed}`);
      } else {
        console.error('[Content Refresh] ❌ Failed:', result.error);
      }
    } catch (error) {
      console.error('[Content Refresh] ❌ Unexpected error:', error);
    }
  }, {
    timezone: 'UTC'
  });

  console.log('[Content Refresh] ✅ Scheduler initialized');
  
  return refreshJob;
}

/**
 * Trigger content refresh for all stale domains
 * Can be called manually or by cron job
 */
export async function triggerContentRefresh(): Promise<{
  success: boolean;
  domainsProcessed: number;
  pagesRefreshed: number;
  error?: string;
}> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      throw new Error('CRON_SECRET environment variable not set');
    }

    const response = await fetch(`${appUrl}/api/cron/refresh`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Refresh API returned ${response.status}: ${error}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      domainsProcessed: result.domainsProcessed || 0,
      pagesRefreshed: result.totalPagesRefreshed || 0
    };
  } catch (error) {
    return {
      success: false,
      domainsProcessed: 0,
      pagesRefreshed: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Stop the scheduled content refresh
 * Useful for graceful shutdown
 */
export function stopContentRefresh() {
  if (refreshJob) {
    refreshJob.stop();
    refreshJob = null;
    console.log('[Content Refresh] ✅ Scheduler stopped');
  }
}

/**
 * Get refresh status
 */
export function getRefreshStatus() {
  return {
    isRunning: refreshJob !== null,
    schedule: CRON_SCHEDULE,
    intervalHours: REFRESH_INTERVAL_HOURS,
    maxPagesPerDomain: MAX_PAGES_PER_DOMAIN
  };
}
