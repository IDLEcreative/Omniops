/**
 * Deprecations API Endpoint
 *
 * GET /api/deprecations - Returns current deprecation status and timeline
 */

import { NextResponse } from 'next/server';
import { getDeprecationTimeline, getDeprecationInfo } from '@/lib/utils/deprecation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/deprecations
 *
 * Returns information about deprecated features and their timeline
 *
 * Response:
 * {
 *   timeline: [
 *     {
 *       feature: "customer_id",
 *       phase: "silent",
 *       startDate: "2025-11-22",
 *       warnDate: "2026-02-22",
 *       errorDate: "2026-05-22",
 *       removeDate: "2026-11-22",
 *       replacement: "organization_id",
 *       daysUntilWarn: 92,
 *       daysUntilError: 182,
 *       daysUntilRemoval: 365
 *     }
 *   ]
 * }
 */
export async function GET() {
  try {
    const timeline = getDeprecationTimeline();

    return NextResponse.json({
      success: true,
      timeline,
      message: 'Deprecation timeline retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching deprecation timeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deprecation timeline',
      },
      { status: 500 }
    );
  }
}
