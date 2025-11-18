import { NextRequest, NextResponse } from 'next/server';
import { enrichPendingLeads } from '@/lib/lead-enrichment';

/**
 * Cron endpoint to enrich pending leads
 * Run this periodically (e.g., every 15 minutes) to automatically find emails
 *
 * Usage:
 * - Manual: GET http://localhost:3000/api/cron/enrich-leads
 * - Cron: Set up Vercel Cron or similar to hit this endpoint
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Add authentication to prevent abuse
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    await enrichPendingLeads();

    return NextResponse.json({
      success: true,
      message: 'Lead enrichment completed'
    });

  } catch (error) {
    console.error('[Cron] Lead enrichment error:', error);

    return NextResponse.json(
      { error: 'Lead enrichment failed' },
      { status: 500 }
    );
  }
}
