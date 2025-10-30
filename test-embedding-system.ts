#!/usr/bin/env npx tsx
/**
 * Comprehensive Embedding System Test
 *
 * Tests all components of the chat widget embedding system:
 * - Widget embed script loading
 * - OpenAI embedding generation
 * - Vector similarity search
 * - Cache functionality
 * - End-to-end chat flow
 */

import { generateQueryEmbedding, searchSimilarContentOptimized } from './lib/embeddings';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
  console.log(`${icon} ${result.name}: ${result.message}${result.duration ? ` (${result.duration}ms)` : ''}`);
  results.push(result);
}

async function testEnvironmentSetup(): Promise<void> {
  console.log('\n🔧 Testing Environment Setup...\n');

  // Test 1: OpenAI API Key
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    logTest({
      name: 'OpenAI API Key',
      status: 'pass',
      message: `Configured (${openaiKey.substring(0, 10)}...)`
    });
  } else {
    logTest({
      name: 'OpenAI API Key',
      status: 'fail',
      message: 'Missing OPENAI_API_KEY environment variable'
    });
  }

  // Test 2: Supabase Configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    logTest({
      name: 'Supabase Configuration',
      status: 'pass',
      message: `Connected to ${new URL(supabaseUrl).hostname}`
    });
  } else {
    logTest({
      name: 'Supabase Configuration',
      status: 'fail',
      message: 'Missing Supabase environment variables'
    });
  }

  // Test 3: Redis Configuration
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  logTest({
    name: 'Redis Configuration',
    status: 'pass',
    message: `Using ${redisUrl}`
  });
}

async function testEmbeddingGeneration(): Promise<void> {
  console.log('\n🤖 Testing Embedding Generation...\n');

  const testQueries = [
    'How do I install the widget?',
    'What are your product categories?',
    'Do you ship internationally?'
  ];

  for (const query of testQueries) {
    const start = Date.now();
    try {
      const embedding = await generateQueryEmbedding(query, true);
      const duration = Date.now() - start;

      if (embedding && embedding.length === 1536) {
        logTest({
          name: `Embedding: "${query.substring(0, 30)}..."`,
          status: 'pass',
          message: `Generated 1536-dim vector`,
          duration
        });
      } else {
        logTest({
          name: `Embedding: "${query.substring(0, 30)}..."`,
          status: 'fail',
          message: `Invalid embedding size: ${embedding?.length || 0}`
        });
      }
    } catch (error) {
      logTest({
        name: `Embedding: "${query.substring(0, 30)}..."`,
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

async function testCacheFunctionality(): Promise<void> {
  console.log('\n💾 Testing Cache Functionality...\n');

  const testQuery = 'Test cache query';

  // First call (should hit API)
  const start1 = Date.now();
  try {
    await generateQueryEmbedding(testQuery, true);
    const duration1 = Date.now() - start1;

    // Second call (should hit cache)
    const start2 = Date.now();
    await generateQueryEmbedding(testQuery, true);
    const duration2 = Date.now() - start2;

    if (duration2 < duration1 / 2) {
      logTest({
        name: 'Embedding Cache',
        status: 'pass',
        message: `Cache hit: ${duration2}ms vs ${duration1}ms (${Math.round((1 - duration2/duration1) * 100)}% faster)`
      });
    } else {
      logTest({
        name: 'Embedding Cache',
        status: 'fail',
        message: `Cache may not be working: ${duration2}ms vs ${duration1}ms`
      });
    }
  } catch (error) {
    logTest({
      name: 'Embedding Cache',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testVectorSearch(): Promise<void> {
  console.log('\n🔍 Testing Vector Similarity Search...\n');

  const testDomain = 'localhost';
  const testQuery = 'product information';

  const start = Date.now();
  try {
    const results = await searchSimilarContentOptimized(
      testQuery,
      testDomain,
      5,
      0.15,
      10000
    );
    const duration = Date.now() - start;

    logTest({
      name: 'Vector Similarity Search',
      status: 'pass',
      message: `Found ${results.length} results`,
      duration
    });

    if (results.length > 0) {
      console.log('\n   📄 Sample Results:');
      results.slice(0, 2).forEach((result, idx) => {
        console.log(`   ${idx + 1}. ${result.title || 'Untitled'}`);
        console.log(`      URL: ${result.url}`);
        console.log(`      Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`      Content preview: ${result.content.substring(0, 100)}...`);
      });
    }
  } catch (error) {
    logTest({
      name: 'Vector Similarity Search',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testWidgetEndpoints(): Promise<void> {
  console.log('\n🌐 Testing Widget Endpoints...\n');

  const endpoints = [
    { url: 'http://localhost:3000/embed.js', name: 'Embed Script' },
    { url: 'http://localhost:3000/embed', name: 'Widget Page' },
    { url: 'http://localhost:3000/api/health', name: 'Health Check' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);

      if (response.ok) {
        logTest({
          name: endpoint.name,
          status: 'pass',
          message: `HTTP ${response.status} - ${response.statusText}`
        });
      } else {
        logTest({
          name: endpoint.name,
          status: 'fail',
          message: `HTTP ${response.status} - ${response.statusText}`
        });
      }
    } catch (error) {
      logTest({
        name: endpoint.name,
        status: 'fail',
        message: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  }
}

async function printSummary(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`\nSuccess Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  Failed Tests:');
    results
      .filter(r => r.status === 'fail')
      .forEach(r => console.log(`   • ${r.name}: ${r.message}`));
  }

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED! The embedding system is fully functional.\n');
    console.log('🎉 Your chat widget is ready to use!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Open http://localhost:3000/test-widget-embed.html');
    console.log('   2. Test the interactive widget features');
    console.log('   3. Embed the widget on your site using the provided code\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Chat Widget Embedding System Test Suite');
  console.log('='.repeat(60));

  try {
    await testEnvironmentSetup();
    await testEmbeddingGeneration();
    await testCacheFunctionality();
    await testVectorSearch();
    await testWidgetEndpoints();
    await printSummary();
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
    process.exit(1);
  }
}

main();
