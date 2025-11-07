import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { generateCSVContent } from '@/lib/analytics/export-csv';

/**
 * GET /api/analytics/export/csv
 * Export analytics data as CSV file
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateRange: { start: string; end: string };
    if (startDate && endDate) {
      dateRange = { start: startDate, end: endDate };
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      dateRange = {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    }

    // Fetch analytics data (reusing existing analytics API logic)
    const analyticsResponse = await fetch(
      `${request.nextUrl.origin}/api/dashboard/analytics?days=${days}`,
      {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      }
    );

    if (!analyticsResponse.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const analyticsData = await analyticsResponse.json();

    // Generate CSV content
    const csv = generateCSVContent(analyticsData, dateRange);

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${dateRange.start}-to-${dateRange.end}.csv"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
