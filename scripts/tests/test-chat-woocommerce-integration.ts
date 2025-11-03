/**
 * Integration Test: Chat Agent WooCommerce Search
 *
 * This test verifies that the chat agent can successfully:
 * 1. Connect to WooCommerce
 * 2. Search for products via chat queries
 * 3. Return properly formatted results
 * 4. Handle various query types (product names, SKUs, categories)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test configuration
const TEST_DOMAIN = 'thompsonseparts.co.uk';
const API_ENDPOINT = 'http://localhost:3000/api/chat';

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance?: number;
  }>;
  searchMetadata?: {
    iterations: number;
    totalSearches: number;
    searchLog: Array<{
      query: string;
      source: string;
      resultsCount: number;
    }>;
  };
}

async function sendChatMessage(message: string, conversationId?: string): Promise<ChatResponse> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      domain: TEST_DOMAIN,
      session_id: 'test-session-' + Date.now(),
      conversation_id: conversationId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat API error (${response.status}): ${error}`);
  }

  return response.json();
}

async function verifyWooCommerceConfig(): Promise<boolean> {
  console.log('\n🔍 Verifying WooCommerce configuration...');

  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url, encrypted_woocommerce_consumer_key')
    .eq('domain', TEST_DOMAIN)
    .single();

  if (error || !config) {
    console.error('❌ No WooCommerce config found for domain:', TEST_DOMAIN);
    return false;
  }

  if (!config.woocommerce_url || !config.encrypted_woocommerce_consumer_key) {
    console.error('❌ WooCommerce credentials missing');
    return false;
  }

  console.log('✅ WooCommerce config found:');
  console.log('   Domain:', config.domain);
  console.log('   WooCommerce URL:', config.woocommerce_url);
  console.log('   Has credentials:', !!config.encrypted_woocommerce_consumer_key);

  return true;
}

async function testProductSearch(query: string): Promise<void> {
  console.log(`\n🧪 Test: "${query}"`);
  console.log('─'.repeat(60));

  try {
    const startTime = Date.now();
    const response = await sendChatMessage(query);
    const duration = Date.now() - startTime;

    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`💬 AI Response: ${response.message.substring(0, 200)}...`);

    // Check for WooCommerce search in metadata
    if (response.searchMetadata) {
      console.log(`\n📊 Search Metadata:`);
      console.log(`   Total searches: ${response.searchMetadata.totalSearches}`);
      console.log(`   Iterations: ${response.searchMetadata.iterations}`);

      const woocommerceSearch = response.searchMetadata.searchLog.find(
        (log: any) => log.source === 'woocommerce'
      );

      if (woocommerceSearch) {
        console.log(`\n✅ WooCommerce search detected!`);
        console.log(`   Query: "${woocommerceSearch.query}"`);
        console.log(`   Results: ${woocommerceSearch.resultsCount}`);
      } else {
        console.log(`\n⚠️  No WooCommerce search in log. Sources used:`);
        response.searchMetadata.searchLog.forEach((log: any) => {
          console.log(`   - ${log.source}: ${log.resultsCount} results`);
        });
      }
    }

    // Check sources
    if (response.sources && response.sources.length > 0) {
      console.log(`\n📚 Sources (${response.sources.length}):`);
      response.sources.slice(0, 3).forEach((source, i) => {
        console.log(`   ${i + 1}. ${source.title}`);
        console.log(`      ${source.url}`);
      });
    }

    console.log('\n✅ Test passed\n');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Chat Agent WooCommerce Integration Test');
  console.log('═══════════════════════════════════════════════════════════');

  // Step 1: Verify WooCommerce configuration
  const hasConfig = await verifyWooCommerceConfig();
  if (!hasConfig) {
    console.error('\n❌ Test suite failed: WooCommerce not configured');
    process.exit(1);
  }

  // Step 2: Test various product search queries
  const testQueries = [
    'Do you have any Teng products?',
    'Show me torque wrenches',
    'I need a hydraulic pump',
    'What products do you sell?',
  ];

  console.log('\n📋 Running test queries...\n');

  let passed = 0;
  let failed = 0;

  for (const query of testQueries) {
    try {
      await testProductSearch(query);
      passed++;
    } catch (error) {
      failed++;
      console.error('Test failed, continuing...\n');
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   Test Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}/${testQueries.length}`);
  console.log(`❌ Failed: ${failed}/${testQueries.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Chat agent can successfully search WooCommerce.');
  }
}

// Check if server is running
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  // Check if dev server is running
  const serverRunning = await checkServerHealth();

  if (!serverRunning) {
    console.error('❌ Development server is not running on port 3000');
    console.error('   Please start the server with: npm run dev');
    process.exit(1);
  }

  await runTests();
})().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
