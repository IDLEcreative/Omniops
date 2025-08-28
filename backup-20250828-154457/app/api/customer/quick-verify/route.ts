import { NextRequest, NextResponse } from 'next/server';
import { SimpleCustomerVerification } from '@/lib/customer-verification-simple';
import { z } from 'zod';

// Request validation - all fields optional for progressive verification
const QuickVerifySchema = z.object({
  conversation_id: z.string().uuid(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  order_number: z.string().optional(),
  postal_code: z.string().optional(),
  domain: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = QuickVerifySchema.parse(body);
    
    // Perform verification with whatever info was provided
    const verificationLevel = await SimpleCustomerVerification.verifyCustomer({
      conversationId: validatedData.conversation_id,
      name: validatedData.name,
      email: validatedData.email,
      orderNumber: validatedData.order_number,
      postalCode: validatedData.postal_code,
    }, validatedData.domain);

    // Get appropriate context based on verification level
    const customerContext = await SimpleCustomerVerification.getCustomerContext(
      verificationLevel,
      validatedData.conversation_id,
      validatedData.domain
    );

    // Get prompt for additional verification if needed
    const additionalPrompt = SimpleCustomerVerification.getVerificationPrompt(verificationLevel);

    return NextResponse.json({
      success: true,
      verification_level: verificationLevel.level,
      allowed_data: verificationLevel.allowedData,
      customer_context: customerContext,
      prompt: additionalPrompt,
      can_access: {
        general_info: true,
        order_status: verificationLevel.level !== 'none',
        order_history: verificationLevel.level === 'full',
        account_details: verificationLevel.level === 'full',
        make_changes: verificationLevel.level === 'full',
      }
    });

  } catch (error) {
    console.error('Quick verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}