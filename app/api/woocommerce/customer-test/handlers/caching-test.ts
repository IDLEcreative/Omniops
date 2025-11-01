/**
 * Customer data caching test handler
 */

import { CustomerVerification } from '@/lib/customer-verification';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';
import type { TestResult } from '../types';

export async function runCachingTest(email?: string): Promise<TestResult> {
  try {
    const testConversationId = uuidv4();
    const testEmail = email || 'test@example.com';
    const testData = { test: 'data', timestamp: Date.now() };

    // Cache data
    await CustomerVerification.cacheCustomerData(
      testConversationId,
      testEmail,
      123,
      testData,
      'profile'
    );

    // Retrieve cached data
    const cached = await CustomerVerification.getCachedData(testConversationId, 'profile');

    const success = !!cached && cached.test === 'data';

    // Clean up
    const supabase = await createServiceRoleClient();
    if (supabase) {
      await supabase
        .from('customer_data_cache')
        .delete()
        .eq('conversation_id', testConversationId);
    }

    return {
      success,
      stored: !!cached,
      retrieved: cached?.test === 'data',
      message: 'Caching test complete',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
