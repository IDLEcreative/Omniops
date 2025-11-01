/**
 * Customer verification flow test handler
 */

import { CustomerVerification } from '@/lib/customer-verification';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';
import type { TestResult } from '../types';

export async function runVerificationTest(email?: string): Promise<TestResult> {
  try {
    const testConversationId = uuidv4();
    const testEmail = email || 'test@example.com';

    // Create verification
    const verificationResult = await CustomerVerification.createVerification({
      conversationId: testConversationId,
      email: testEmail,
      method: 'email',
    });

    if (!verificationResult.success || !verificationResult.code) {
      return {
        success: false,
        error: 'Failed to create verification',
      };
    }

    // Verify the code
    const verifyResult = await CustomerVerification.verifyCode(
      testConversationId,
      testEmail,
      verificationResult.code
    );

    // Check status
    const status = await CustomerVerification.checkVerificationStatus(testConversationId);

    const success = verifyResult.verified && status.isVerified;

    // Clean up test data
    const supabase = await createServiceRoleClient();
    if (supabase) {
      await supabase
        .from('customer_verifications')
        .delete()
        .eq('conversation_id', testConversationId);
    }

    return {
      success,
      flow: {
        created: verificationResult.success,
        verified: verifyResult.verified,
        statusCheck: status.isVerified,
      },
      message: 'Verification flow test complete',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
