import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CustomerVerification } from '@/lib/customer-verification';
import { SimpleCustomerVerification } from '@/lib/customer-verification-simple';

// Request validation schemas
const SendVerificationCodeSchema = z.object({
  conversationId: z.string().uuid(),
  email: z.string().email(),
  method: z.enum(['email', 'order']).optional().default('email')
});

const VerifyCodeSchema = z.object({
  conversationId: z.string().uuid(),
  email: z.string().email(),
  code: z.string().min(6).max(6)
});

const SimpleVerifySchema = z.object({
  conversationId: z.string().uuid(),
  email: z.string().email().optional(),
  orderNumber: z.string().optional(),
  postalCode: z.string().optional(),
  name: z.string().optional(),
  domain: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'send_code') {
      // Send verification code
      const validatedData = SendVerificationCodeSchema.parse(body);
      const result = await CustomerVerification.createVerification({
        conversationId: validatedData.conversationId,
        email: validatedData.email,
        method: validatedData.method
      });

      if (result.success) {
        // In production, don't send the code in response
        // For demo/testing, we include it
        return NextResponse.json({
          success: true,
          message: result.message,
          verificationId: result.verificationId,
          // Remove this in production - email should be sent instead
          code: result.code,
          expiresAt: result.expiresAt
        });
      } else {
        return NextResponse.json({
          success: false,
          message: result.message
        }, { status: 400 });
      }
    } else if (action === 'verify_code') {
      // Verify the code
      const validatedData = VerifyCodeSchema.parse(body);
      const result = await CustomerVerification.verifyCode(
        validatedData.conversationId,
        validatedData.email,
        validatedData.code
      );

      if (result.verified) {
        return NextResponse.json({
          success: true,
          verified: true,
          message: result.message,
          customerEmail: result.customerEmail
        });
      } else {
        return NextResponse.json({
          success: false,
          verified: false,
          message: result.message
        }, { status: 400 });
      }
    } else if (action === 'simple_verify') {
      // Simple verification (order number + email/postal)
      const validatedData = SimpleVerifySchema.parse(body);
      const result = await SimpleCustomerVerification.verifyCustomer({
        conversationId: validatedData.conversationId,
        email: validatedData.email,
        orderNumber: validatedData.orderNumber,
        postalCode: validatedData.postalCode,
        name: validatedData.name
      }, validatedData.domain);

      return NextResponse.json({
        success: true,
        level: result.level,
        customerId: result.customerId,
        customerEmail: result.customerEmail,
        allowedData: result.allowedData
      });
    } else if (action === 'check_status') {
      // Check verification status
      const { conversationId } = body;
      if (!conversationId) {
        return NextResponse.json({
          error: 'Conversation ID required'
        }, { status: 400 });
      }

      const status = await CustomerVerification.checkVerificationStatus(conversationId);
      return NextResponse.json({
        isVerified: status.isVerified,
        customerEmail: status.customerEmail,
        verifiedAt: status.verifiedAt
      });
    } else {
      return NextResponse.json({
        error: 'Invalid action'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Customer verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Verification failed'
    }, { status: 500 });
  }
}