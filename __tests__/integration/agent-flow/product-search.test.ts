/**
 * Product Search Flow Tests
 */

import { describe, it, expect } from '@jest/globals';
import { createTestConfig, getSupabaseClient } from './helpers';

describe('Product Search Flow', () => {
  it('should handle pump search with real AI', async () => {
    const { customerConfig, configError, testDomain, supabase } = await createTestConfig('product-search');

    if (configError || !customerConfig) {
      throw new Error('Failed to create test config: ' + JSON.stringify(configError));
    }

    const sessionId = 'test-session-' + Date.now();

    await supabase.from('scraped_pages').insert({
      domain_id: customerConfig.id,
      url: 'https://' + testDomain + '/products/model-a',
      title: 'Product Model A',
      content_text: 'Product Model A. Price: $299.99. In Stock.',
      last_scraped: new Date().toISOString(),
      content_type: 'text/html',
      status_code: 200
    });

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me pumps',
          domain: testDomain,
          session_id: sessionId
        })
      });

      console.log('[DEBUG] Response status:', response.status, response.statusText);
      const responseText = await response.text();
      console.log('[DEBUG] Response body (raw):', responseText);
      expect(response.ok).toBe(true);
      const data = JSON.parse(responseText ||'{}');
      console.log('[DEBUG] API Response (parsed):', JSON.stringify(data, null, 2));
      expect(data.message).toBeTruthy();
      expect(data.searchMetadata).toBeDefined();

      console.log('[Test 1 PASSED] Product search');

      await supabase.from('conversations').delete().eq('id', data.conversation_id);
    } finally {
      await supabase.from('scraped_pages').delete().eq('domain_id', customerConfig.id);
      await supabase.from('customer_configs').delete().eq('domain', testDomain);
    }
  }, 60000);

  it('should handle "no results found" gracefully', async () => {
    const { customerConfig, configError, testDomain, supabase } = await createTestConfig('no-results');
    if (configError || !customerConfig) throw new Error('Failed to create test config: ' + JSON.stringify(configError));

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Do you have unicorn-powered flux capacitors?',
          domain: testDomain,
          session_id: 'test-session-' + Date.now()
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const lower = data.message.toLowerCase();
      expect(lower.includes('sorry') || lower.includes('unable') || lower.includes("don't")).toBe(true);

      console.log('[Test 2 PASSED] No results handled gracefully');
      await supabase.from('conversations').delete().eq('id', data.conversation_id);
    } finally {
      await supabase.from('customer_configs').delete().eq('domain', testDomain);
    }
  }, 60000);
});
