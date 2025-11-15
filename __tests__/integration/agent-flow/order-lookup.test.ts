/**
 * Order Lookup Flow Tests
 */

import { describe, it, expect } from '@jest/globals';
import { createTestConfig } from './helpers';

describe('Order Lookup Flow', () => {
  it('should handle order lookup with verification', async () => {
    const { customerConfig, configError, testDomain, supabase } = await createTestConfig('order-verify');
    if (configError || !customerConfig) throw new Error('Failed to create test config: ' + JSON.stringify(configError));

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "What's the status of order #12345?",
          domain: testDomain,
          session_id: 'test-session-' + Date.now()
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const lower = data.message.toLowerCase();
      expect(lower.includes('email') || lower.includes('verify')).toBe(true);

      console.log('[Test 3 PASSED] Order verification requested');
      await supabase.from('conversations').delete().eq('id', data.conversation_id);
    } finally {
      await supabase.from('customer_configs').delete().eq('domain', testDomain);
    }
  }, 60000);

  it('should prevent order access without verification', async () => {
    const { customerConfig, configError, testDomain, supabase } = await createTestConfig('order-security');
    if (configError || !customerConfig) throw new Error('Failed to create test config: ' + JSON.stringify(configError));

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me my recent orders',
          domain: testDomain,
          session_id: 'test-session-' + Date.now()
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const lower = data.message.toLowerCase();
      expect(lower.includes('email') || lower.includes('verify')).toBe(true);
      expect(lower).not.toContain('order #');

      console.log('[Test 4 PASSED] Order access prevented');
      await supabase.from('conversations').delete().eq('id', data.conversation_id);
    } finally {
      await supabase.from('customer_configs').delete().eq('domain', testDomain);
    }
  }, 60000);
});
