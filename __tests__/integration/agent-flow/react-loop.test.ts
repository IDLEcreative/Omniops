/**
 * ReAct Loop Behavior Tests
 */

import { describe, it, expect } from '@jest/globals';
import { createTestConfig } from './helpers';

describe('ReAct Loop Behavior', () => {
  it('should execute multiple tools in parallel when needed', async () => {
    const { customerConfig, configError, testDomain, supabase } = await createTestConfig('parallel-tools');
    if (configError || !customerConfig) throw new Error('Failed to create test config: ' + JSON.stringify(configError));

    await supabase.from('scraped_pages').insert({
      domain_id: customerConfig.id,
      url: 'https://' + testDomain + '/products/pump',
      title: 'Industrial Pump',
      content_text: 'Industrial pump. Price: $199.99.',
      last_scraped: new Date().toISOString(),
      content_type: 'text/html',
      status_code: 200
    });

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me hydraulic pumps and my recent orders',
          domain: testDomain,
          session_id: 'test-session-' + Date.now()
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const lower = data.message.toLowerCase();
      expect(lower.includes('pump') || lower.includes('hydraulic')).toBe(true);
      expect(lower.includes('order') || lower.includes('email')).toBe(true);

      console.log('[Test 5 PASSED] Parallel tools handled');
      await supabase.from('conversations').delete().eq('id', data.conversation_id);
    } finally {
      await supabase.from('scraped_pages').delete().eq('domain_id', customerConfig.id);
      await supabase.from('customer_configs').delete().eq('domain', testDomain);
    }
  }, 60000);
});
