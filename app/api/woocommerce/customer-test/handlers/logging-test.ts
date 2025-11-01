/**
 * Access logging test handler
 */

import { CustomerVerification } from '@/lib/customer-verification';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';
import type { TestResult } from '../types';

export async function runLoggingTest(email?: string): Promise<TestResult> {
  try {
    const testConversationId = uuidv4();
    const testEmail = email || 'test@example.com';

    // Log access
    await CustomerVerification.logAccess(
      testConversationId,
      testEmail,
      123,
      ['profile', 'orders'],
      'Test access',
      'test'
    );

    // Check if logged
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Database connection unavailable',
      };
    }

    const { data } = await supabase
      .from('customer_access_logs')
      .select('*')
      .eq('conversation_id', testConversationId)
      .single();

    // Clean up
    if (data) {
      await supabase.from('customer_access_logs').delete().eq('id', data.id);
    }

    return {
      success: !!data,
      logged: !!data,
      message: 'Access logging test complete',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
