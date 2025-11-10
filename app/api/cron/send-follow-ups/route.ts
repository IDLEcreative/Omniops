/**
 * Cron Job: Send Pending Follow-ups
 *
 * Runs every 5-15 minutes to send pending follow-up messages
 * Configure in Vercel: https://vercel.com/docs/cron-jobs
 *
 * Schedule: every 15 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { sendPendingFollowUps } from '@/lib/follow-ups';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/cron/send-follow-ups
 * Send all pending follow-up messages
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (Vercel Cron Jobs send this header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    console.log('[Cron] Starting follow-up send job...');

    // Send up to 100 pending messages per run
    const result = await sendPendingFollowUps(supabase, 100);

    console.log('[Cron] Follow-up send job complete:', result);

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Follow-up send job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/send-follow-ups
 * Health check for cron job
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    job: 'send-follow-ups',
    schedule: 'every 15 minutes',
  });
}
