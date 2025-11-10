/**
 * Cart Session Metrics API
 *
 * Retrieves detailed metrics for a specific cart session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionMetrics } from '@/lib/cart-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID parameter is required' },
        { status: 400 }
      );
    }

    const metrics = await getSessionMetrics(sessionId);

    if (!metrics) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('[Session Metrics API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch session metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
