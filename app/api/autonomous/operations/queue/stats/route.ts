/**
 * Autonomous Operations Queue Stats API
 *
 * GET /api/autonomous/operations/queue/stats
 * Returns statistics about the operation queue (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOperationQueueManager } from '@/lib/autonomous/queue';
import { requireAdmin } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult; // Return auth error
    }

    // Get queue manager
    const queueManager = getOperationQueueManager();

    // Get queue statistics
    const stats = await queueManager.getStats();

    // Get queue health
    const health = await queueManager.getHealth();

    return NextResponse.json({
      stats,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Queue stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue stats', details: (error as Error).message },
      { status: 500 }
    );
  }
}
