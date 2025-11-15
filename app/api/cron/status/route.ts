import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServiceRoleClient();

  // Get cron configuration
  const config = {
    enabled: process.env.CRON_ENABLED === 'true',
    schedule: process.env.CRON_SCHEDULE || '0 2 * * *',
    maxPages: parseInt(process.env.CRON_MAX_PAGES || '-1'),
    refreshMode: process.env.CRON_REFRESH_MODE || 'full',
    maxRetries: parseInt(process.env.CRON_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.CRON_RETRY_DELAY || '60'),
    notifications: {
      email: process.env.NOTIFICATION_EMAIL_ENABLED === 'true',
      slack: process.env.NOTIFICATION_SLACK_ENABLED === 'true',
      discord: process.env.NOTIFICATION_DISCORD_ENABLED === 'true',
    },
  };

  // Get last 10 runs from history
  const { data: history } = await supabase
    .from('cron_refresh_history')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  // Get latest run
  const lastRun = history?.[0];

  // Calculate next run using cron-parser
  let nextRun = null;
  try {
    const cronParser = await import('cron-parser');
    const parser = cronParser.CronExpressionParser ?? cronParser.default;
    if (!parser?.parse) {
      throw new Error('cron-parser parse API not available');
    }
    const interval = parser.parse(config.schedule);
    nextRun = interval.next().toDate().toISOString();
  } catch (error) {
    console.error('Failed to parse cron schedule:', error);
  }

  return NextResponse.json({
    config,
    status: {
      lastRun: lastRun ? {
        startedAt: lastRun.started_at,
        completedAt: lastRun.completed_at,
        status: lastRun.status,
        domainsProcessed: lastRun.domains_processed,
        domainsFailed: lastRun.domains_failed,
        pagesRefreshed: lastRun.pages_refreshed,
        duration: lastRun.total_duration_ms,
        error: lastRun.error_message,
      } : null,
      nextRun,
    },
    history: history || [],
  });
}
