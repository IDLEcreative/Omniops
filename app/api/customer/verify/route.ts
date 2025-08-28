import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { CustomerVerification } from '@/lib/customer-verification';
import { z } from 'zod';
import { checkDomainRateLimit } from '@/lib/rate-limit';

// Request validation schemas
const SendVerificationSchema = z.object({
  conversation_id: z.string().uuid(),
  email: z.string().email(),
  method: z.enum(['email', 'order']).optional(),
});

const VerifyCodeSchema = z.object({
  conversation_id: z.string().uuid(),
  email: z.string().email(),
  code: z.string().length(6),
});

// POST: Send verification code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SendVerificationSchema.parse(body);
    const { conversation_id, email, method } = validatedData;

    // Rate limiting
    const domain = request.headers.get('host') || 'unknown';
    const { allowed, resetTime } = checkDomainRateLimit(domain); // Use default domain rate limit

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Reset': resetTime.toString(),
          }
        }
      );
    }

    // Create verification request
    const result = await CustomerVerification.createVerification({
      conversationId: conversation_id,
      email,
      method: method || 'email',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // In production, send email here
    // For testing, we're returning the code (remove in production!)
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: result.message,
        // REMOVE IN PRODUCTION - only for testing
        code: result.code,
        expiresAt: result.expiresAt,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresAt: result.expiresAt,
    });

  } catch (error) {
    console.error('Verification send error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

// PUT: Verify code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = VerifyCodeSchema.parse(body);
    const { conversation_id, email, code } = validatedData;

    // Verify the code
    const result = await CustomerVerification.verifyCode(
      conversation_id,
      email,
      code
    );

    if (!result.verified) {
      return NextResponse.json(
        { 
          verified: false,
          message: result.message 
        },
        { status: 400 }
      );
    }

    // Update conversation with verification status
    const supabase = await createServiceRoleClient();
    await supabase
      .from('messages')
      .update({ 
        verification_status: 'verified',
        customer_email: email 
      })
      .eq('conversation_id', conversation_id);

    return NextResponse.json({
      verified: true,
      message: 'Successfully verified',
      customerEmail: result.customerEmail,
    });

  } catch (error) {
    console.error('Verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid verification data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

// GET: Check verification status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversation_id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required' },
        { status: 400 }
      );
    }

    const status = await CustomerVerification.checkVerificationStatus(conversationId);

    return NextResponse.json({
      isVerified: status.isVerified,
      customerEmail: status.customerEmail,
      verifiedAt: status.verifiedAt,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}