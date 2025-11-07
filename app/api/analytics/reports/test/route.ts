import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { sendAnalyticsReport } from '@/lib/email/send-report';

/**
 * Manual test endpoint for analytics email reports
 * Allows admins to send a test report to verify email configuration
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, organizationId } = authResult;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Send test report with sample data
    const testData = {
      organizationName: 'Test Organization',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalConversations: 150,
      avgResponseTime: 1.8,
      sentimentScore: 4.2,
      topQueries: [
        { query: 'How do I track my order?', count: 45 },
        { query: 'What are your shipping options?', count: 32 },
        { query: 'Can I cancel my order?', count: 28 },
        { query: 'Do you ship internationally?', count: 21 },
        { query: 'What is your return policy?', count: 18 },
      ],
      summary: {
        totalMessages: 420,
        positiveSentiment: 65,
        negativeSentiment: 15,
        neutralSentiment: 20,
      },
    };

    await sendAnalyticsReport(email, 'weekly', testData);

    return NextResponse.json({
      success: true,
      message: `Test report sent to ${email}`,
    });
  } catch (error: any) {
    console.error('Failed to send test report:', error);

    return NextResponse.json(
      {
        error: 'Failed to send test report',
        details: error.message,
        hint: 'Check SMTP configuration in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS)',
      },
      { status: 500 }
    );
  }
}
