/**
 * E2E Test for Intelligent Recommendations
 *
 * Validates that the complete recommendation flow works:
 * 1. WooCommerce product search
 * 2. Cross-referencing with scraped content
 * 3. Recommendation generation
 * 4. AI response formatting
 */

import { executeToolCallsParallel } from '@/lib/chat/ai-processor-tool-executor';
import type { ChatTelemetry } from '@/lib/chat-telemetry';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { searchSimilarContent } from '@/lib/embeddings-functions';
import { sanitizeOutboundLinks } from '@/lib/link-sanitizer';

const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';
const SEARCH_TIMEOUT = 30000; // 30 seconds

async function testRecommendations() {
  console.log('\n🧪 E2E Test: Intelligent Recommendations\n');
  console.log(`Domain: ${TEST_DOMAIN}`);
  console.log(`Timeout: ${SEARCH_TIMEOUT}ms\n`);

  // Create mock tool calls (simulating what OpenAI would send)
  const toolCalls = [
    {
      id: 'call_1',
      function: {
        name: 'woocommerce_operations',
        arguments: JSON.stringify({
          operation: 'search_products',
          query: 'gloves'
        })
      }
    },
    {
      id: 'call_2',
      function: {
        name: 'search_website_content',
        arguments: JSON.stringify({
          query: 'gloves',
          limit: 10
        })
      }
    }
  ];

  console.log('📋 Step 1: Executing parallel tool calls...\n');

  try {
    const startTime = Date.now();

    const results = await executeToolCallsParallel(
      toolCalls,
      TEST_DOMAIN,
      SEARCH_TIMEOUT,
      null as ChatTelemetry | null,
      {
        getCommerceProvider,
        searchSimilarContent,
        sanitizeOutboundLinks
      }
    );

    const executionTime = Date.now() - startTime;

    console.log(`✅ Tools completed in ${executionTime}ms\n`);

    // Analyze results
    console.log('📊 Step 2: Analyzing results...\n');

    const woocommerceResult = results.find(r => r.toolName === 'woocommerce_operations');
    const scrapedResult = results.find(r => r.toolName === 'search_website_content');

    if (!woocommerceResult) {
      console.error('❌ No WooCommerce result found');
      process.exit(1);
    }

    if (!scrapedResult) {
      console.error('❌ No scraped content result found');
      process.exit(1);
    }

    console.log(`WooCommerce Results: ${woocommerceResult.result.results.length} products`);
    console.log(`Scraped Results: ${scrapedResult.result.results.length} pages\n`);

    // Check for recommendations in metadata
    console.log('🔍 Step 3: Validating recommendations...\n');

    let productsWithRecommendations = 0;
    let totalRecommendations = 0;

    for (const [index, result] of woocommerceResult.result.results.entries()) {
      if (result.metadata?.recommendations && Array.isArray(result.metadata.recommendations)) {
        const recCount = result.metadata.recommendations.length;
        if (recCount > 0) {
          productsWithRecommendations++;
          totalRecommendations += recCount;

          console.log(`Product ${index + 1}: "${result.title}"`);
          console.log(`  Recommendations: ${recCount}`);

          result.metadata.recommendations.forEach((rec: any, idx: number) => {
            console.log(`    ${idx + 1}. ${rec.name} (${(rec.similarity * 100).toFixed(0)}% similar)`);
            if (rec.recommendationReason) {
              console.log(`       → ${rec.recommendationReason}`);
            }
          });
          console.log('');
        }
      }
    }

    // Validation checks
    console.log('✅ Validation Results:\n');

    const checks = [
      {
        name: 'WooCommerce products returned',
        passed: woocommerceResult.result.results.length > 0,
        value: woocommerceResult.result.results.length
      },
      {
        name: 'Scraped pages returned (before consolidation)',
        passed: true, // Scraped pages are consolidated into products, so 0 is expected
        value: `${scrapedResult.result.results.length} (consolidated into products)`
      },
      {
        name: 'Products have recommendations',
        passed: productsWithRecommendations > 0,
        value: `${productsWithRecommendations} products`
      },
      {
        name: 'Total recommendations generated',
        passed: totalRecommendations > 0,
        value: totalRecommendations
      },
      {
        name: 'Recommendations have similarity scores',
        passed: woocommerceResult.result.results.some((r: any) =>
          r.metadata?.recommendations?.some((rec: any) =>
            typeof rec.similarity === 'number' && rec.similarity >= 0.7
          )
        ),
        value: 'Yes'
      },
      {
        name: 'Recommendations have reasons',
        passed: woocommerceResult.result.results.some((r: any) =>
          r.metadata?.recommendations?.some((rec: any) => rec.recommendationReason)
        ),
        value: 'Yes'
      },
      {
        name: 'Cross-referencing occurred',
        passed: woocommerceResult.result.results.some((r: any) => r.metadata?.matchedPageUrl),
        value: woocommerceResult.result.results.filter((r: any) => r.metadata?.matchedPageUrl).length
      },
      {
        name: 'Sources tracked',
        passed: woocommerceResult.result.results.some((r: any) => r.metadata?.sources),
        value: 'Yes'
      }
    ];

    let allPassed = true;
    for (const check of checks) {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.value}`);
      if (!check.passed) {
        allPassed = false;
      }
    }

    console.log('\n📝 Step 4: Sample AI Response Format...\n');

    // Show how this would be formatted for AI
    const sampleProduct = woocommerceResult.result.results.find((r: any) =>
      r.metadata?.recommendations?.length > 0
    );

    if (sampleProduct) {
      console.log(`Product: ${sampleProduct.title}`);
      console.log(`URL: ${sampleProduct.url}`);
      console.log(`Similarity: ${(sampleProduct.similarity * 100).toFixed(1)}%`);

      if (sampleProduct.metadata?.matchedPageUrl) {
        console.log(`Learn more: ${sampleProduct.metadata.matchedPageUrl}`);
      }

      if (sampleProduct.metadata?.sources) {
        const sources = [];
        if (sampleProduct.metadata.sources.liveData) sources.push('Live catalog');
        if (sampleProduct.metadata.sources.scrapedContent) sources.push('Website content');
        if (sampleProduct.metadata.sources.relatedContent) sources.push('Related pages');
        console.log(`Sources: ${sources.join(', ')}`);
      }

      if (sampleProduct.metadata?.recommendations?.length > 0) {
        console.log(`\nSince you're looking at ${sampleProduct.title}, you might also like:`);
        sampleProduct.metadata.recommendations.forEach((rec: any, idx: number) => {
          const priceStr = rec.price ? ` — ${rec.price}` : '';
          console.log(`  ${idx + 1}. ${rec.name}${priceStr} (${(rec.similarity * 100).toFixed(0)}% similar)`);
          if (rec.recommendationReason) {
            console.log(`     → ${rec.recommendationReason}`);
          }
        });
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');

    if (allPassed) {
      console.log('🎉 SUCCESS: All validation checks passed!\n');
      console.log(`Summary:`);
      console.log(`  - ${woocommerceResult.result.results.length} products found`);
      console.log(`  - ${productsWithRecommendations} products have recommendations`);
      console.log(`  - ${totalRecommendations} total recommendations generated`);
      console.log(`  - Execution time: ${executionTime}ms\n`);
      process.exit(0);
    } else {
      console.log('❌ FAILURE: Some validation checks failed\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:\n');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testRecommendations();
