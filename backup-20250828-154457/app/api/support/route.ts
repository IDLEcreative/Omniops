import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Support request schema
const SupportRequestSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(1000),
  domain: z.string(),
  conversation_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, message, domain, conversation_id } = SupportRequestSchema.parse(body);

    // In production, you'd:
    // 1. Send email notification
    // 2. Create support ticket
    // 3. Store in database
    // 4. Send to Slack/Discord

    // For now, just log it
    console.log('Support request:', {
      email,
      message,
      domain,
      conversation_id,
      timestamp: new Date().toISOString(),
    });

    // You could integrate with:
    // - SendGrid/Postmark for email
    // - Zendesk/Freshdesk for tickets
    // - Slack webhook for notifications

    return NextResponse.json({
      success: true,
      message: 'Support request received. We\'ll get back to you within 24 hours.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit support request' },
      { status: 500 }
    );
  }
}