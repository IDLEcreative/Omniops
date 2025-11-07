import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { sendAnalyticsReport } from '@/lib/email/send-report';
import type { DashboardAnalyticsData } from '@/types/dashboard';

/**
 * POST /api/analytics/reports/test
 * Test endpoint to manually trigger a report email
 */
export async function POST(request: NextRequest) {
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

    // Get email from request or use authenticated user's email
    const { email } = await request.json().catch(() => ({ email: user.email }));

    if (!email) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    // Fetch sample analytics data
    const analyticsResponse = await fetch(
      `${request.nextUrl.origin}/api/dashboard/analytics?days=7`,
      {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      }
    );

    if (!analyticsResponse.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const analyticsData: DashboardAnalyticsData = await analyticsResponse.json();

    // Calculate date range
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const dateRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };

    // Send test report
    await sendAnalyticsReport({
      to: email,
      data: analyticsData,
      dateRange,
      period: 'weekly',
      includeCSV: true,
      includePDF: false,
      organizationName: 'Test Organization',
    });

    return NextResponse.json({
      success: true,
      message: `Test report sent to ${email}`,
    });
  } catch (error) {
    console.error('Test report error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
