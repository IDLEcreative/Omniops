/**
 * Cart Analytics API
 *
 * Provides analytics data for cart operations.
 * Supports filtering by date range, platform, and operation type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDomainAnalytics, getRecentOperations } from '@/lib/cart-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'daily';

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    if (type === 'operations') {
      // Get recent operations
      const limit = parseInt(searchParams.get('limit') || '100');
      const operations = await getRecentOperations(domain, limit);

      return NextResponse.json({
        success: true,
        data: operations,
        count: operations.length
      });
    }

    // Get daily analytics
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const analytics = await getDomainAnalytics(domain, start, end);

    return NextResponse.json({
      success: true,
      data: analytics,
      count: analytics?.length || 0
    });
  } catch (error) {
    console.error('[Cart Analytics API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cart analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
