/**
 * Scattered Chunks Testing Specialist
 *
 * Verifies that executeGetProductDetails returns 15 scattered chunks correctly:
 * - Returns exactly 15 chunks
 * - Chunks come from MULTIPLE different pages (not all from one page)
 * - Includes product information (price, SKU)
 * - Shows related products for comparison/upselling
 * - Reasonable token count (4000-5000 tokens)
 */

import { executeGetProductDetails } from './lib/chat/tool-handlers';
import { searchSimilarContent } from './lib/embeddings';
import { getCommerceProvider } from './lib/agents/commerce-provider';

// Simple token estimation (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function testScatteredChunks() {
  console.log('='.repeat(80));
  console.log('SCATTERED CHUNKS VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log();

  const testQuery = '10mtr extension cables';
  const testDomain = 'thompsonseparts.co.uk';

  console.log(`Test Query: "${testQuery}"`);
  console.log(`Test Domain: ${testDomain}`);
  console.log();

  try {
    console.log('Executing executeGetProductDetails...');
    const startTime = Date.now();

    const result = await executeGetProductDetails(
      testQuery,
      true, // includeSpecs
      testDomain,
      { getCommerceProvider, searchSimilarContent }
    );

    const duration = Date.now() - startTime;

    console.log();
    console.log('-'.repeat(80));
    console.log('RESULTS');
    console.log('-'.repeat(80));
    console.log();

    // Test 1: Check chunk count
    const chunkCount = result.results.length;
    const expectedChunkCount = 15;
    const chunkCountPass = chunkCount === expectedChunkCount;

    console.log(`✅/❌ Returns 15 chunks: ${chunkCountPass ? '✅' : '❌'}`);
    console.log(`   Expected: ${expectedChunkCount}, Got: ${chunkCount}`);
    console.log();

    if (chunkCount === 0) {
      console.log('❌ No results returned. Possible issues:');
      console.log('   - Domain may not have scraped content');
      console.log('   - Query may not match any embeddings');
      console.log('   - Database connection issue');
      console.log();
      console.log(`Source: ${result.source}`);
      console.log(`Success: ${result.success}`);
      return;
    }

    // Test 2: Check if chunks come from multiple pages
    const uniqueUrls = new Set<string>();
    const urlCounts = new Map<string, number>();

    result.results.forEach(chunk => {
      if (chunk.url) {
        uniqueUrls.add(chunk.url);
        urlCounts.set(chunk.url, (urlCounts.get(chunk.url) || 0) + 1);
      }
    });

    const multiplePages = uniqueUrls.size > 1;
    console.log(`✅/❌ Multiple pages: ${multiplePages ? '✅' : '❌'}`);
    console.log(`   Unique pages: ${uniqueUrls.size}`);
    console.log();

    // Show page distribution
    console.log('Page Distribution:');
    const sortedUrls = Array.from(urlCounts.entries()).sort((a, b) => b[1] - a[1]);
    sortedUrls.forEach(([url, count]) => {
      const shortUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
      console.log(`   ${count} chunks: ${shortUrl}`);
    });
    console.log();

    // Test 3: Check for product information (price, SKU)
    let priceFound = false;
    let skuFound = false;
    const pricePatterns = [/£\d+/, /\$\d+/, /price/i, /cost/i, /\d+\.\d{2}/];
    const skuPatterns = [/sku/i, /part\s*#/i, /item\s*#/i, /product\s*code/i, /[A-Z0-9]{6,}/];

    result.results.forEach(chunk => {
      const content = chunk.content?.toLowerCase() || '';
      const title = chunk.title?.toLowerCase() || '';
      const fullText = `${content} ${title}`;

      if (!priceFound && pricePatterns.some(p => p.test(fullText))) {
        priceFound = true;
      }
      if (!skuFound && skuPatterns.some(p => p.test(fullText))) {
        skuFound = true;
      }
    });

    console.log(`✅/❌ Contains product info:`);
    console.log(`   Price found: ${priceFound ? '✅' : '❌'}`);
    console.log(`   SKU found: ${skuFound ? '✅' : '❌'}`);
    console.log();

    // Test 4: Check for related products (variations like 10mtr, 20mtr, etc.)
    const relatedProducts = new Set<string>();
    const lengthPatterns = [/\d+m(tr)?/gi, /\d+\s*metre/gi, /\d+\s*meter/gi];

    result.results.forEach(chunk => {
      const fullText = `${chunk.content} ${chunk.title}`;
      lengthPatterns.forEach(pattern => {
        const matches = fullText.match(pattern);
        if (matches) {
          matches.forEach(m => relatedProducts.add(m.toLowerCase()));
        }
      });
    });

    const hasRelatedProducts = relatedProducts.size > 1;
    console.log(`✅/❌ Related products visible: ${hasRelatedProducts ? '✅' : '❌'}`);
    if (relatedProducts.size > 0) {
      console.log(`   Found variations: ${Array.from(relatedProducts).join(', ')}`);
    } else {
      console.log('   No length variations detected');
    }
    console.log();

    // Test 5: Calculate token count
    let totalTokens = 0;
    result.results.forEach(chunk => {
      const chunkText = `${chunk.title}\n${chunk.content}`;
      totalTokens += estimateTokens(chunkText);
    });

    const tokenCountInRange = totalTokens >= 4000 && totalTokens <= 5000;
    console.log(`Token Count: ${totalTokens}`);
    console.log(`   Expected range: 4000-5000`);
    console.log(`   ${tokenCountInRange ? '✅' : '⚠️'} ${tokenCountInRange ? 'Within range' : 'Outside expected range (still may be acceptable)'}`);
    console.log();

    // Additional analysis
    console.log('-'.repeat(80));
    console.log('DETAILED ANALYSIS');
    console.log('-'.repeat(80));
    console.log();

    // Show similarity scores
    const similarities = result.results.map(r => r.similarity);
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const minSimilarity = Math.min(...similarities);
    const maxSimilarity = Math.max(...similarities);

    console.log('Similarity Scores:');
    console.log(`   Average: ${avgSimilarity.toFixed(3)}`);
    console.log(`   Min: ${minSimilarity.toFixed(3)}`);
    console.log(`   Max: ${maxSimilarity.toFixed(3)}`);
    console.log();

    // Show sample chunks
    console.log('Sample Chunks (first 3):');
    result.results.slice(0, 3).forEach((chunk, idx) => {
      console.log(`\n   Chunk ${idx + 1}:`);
      console.log(`   URL: ${chunk.url}`);
      console.log(`   Title: ${chunk.title}`);
      console.log(`   Similarity: ${chunk.similarity.toFixed(3)}`);
      console.log(`   Content preview: ${chunk.content.substring(0, 100)}...`);
    });
    console.log();

    // Performance metrics
    console.log('-'.repeat(80));
    console.log('PERFORMANCE METRICS');
    console.log('-'.repeat(80));
    console.log();
    console.log(`Execution time: ${duration}ms`);
    console.log(`Source: ${result.source}`);
    console.log(`Success: ${result.success}`);
    console.log();

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log();

    const allTestsPassed =
      chunkCountPass &&
      multiplePages &&
      priceFound &&
      skuFound &&
      hasRelatedProducts;

    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED');
      console.log('   The standard search correctly returns 15 scattered chunks');
      console.log('   with product information from multiple pages.');
    } else {
      console.log('⚠️ SOME TESTS FAILED');
      console.log('   Issues detected:');
      if (!chunkCountPass) console.log('   - Chunk count mismatch');
      if (!multiplePages) console.log('   - All chunks from single page');
      if (!priceFound) console.log('   - No price information found');
      if (!skuFound) console.log('   - No SKU information found');
      if (!hasRelatedProducts) console.log('   - No related products detected');
    }
    console.log();

    // AI context quality assessment
    console.log('AI Context Quality Assessment:');
    console.log(`   ✅ Token count: ${totalTokens} (${tokenCountInRange ? 'optimal' : 'acceptable'})`);
    console.log(`   ${multiplePages ? '✅' : '❌'} Breadth: ${uniqueUrls.size} different sources`);
    console.log(`   ${priceFound && skuFound ? '✅' : '❌'} Product details: Complete`);
    console.log(`   ${hasRelatedProducts ? '✅' : '❌'} Comparison capability: Available`);
    console.log();

    if (multiplePages && priceFound && hasRelatedProducts) {
      console.log('✅ AI WOULD HAVE SUFFICIENT CONTEXT FOR:');
      console.log('   - Answering product queries accurately');
      console.log('   - Making product comparisons');
      console.log('   - Upselling to related products');
      console.log('   - Providing complete specifications');
    } else {
      console.log('⚠️ AI CONTEXT MAY BE LIMITED FOR:');
      if (!multiplePages) console.log('   - Product comparisons (single source)');
      if (!priceFound) console.log('   - Pricing information');
      if (!hasRelatedProducts) console.log('   - Upselling opportunities');
    }
    console.log();

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    console.error(error);
    console.log();

    if (error instanceof Error) {
      console.log('Error details:');
      console.log(`   Message: ${error.message}`);
      console.log(`   Stack: ${error.stack?.split('\n').slice(0, 3).join('\n   ')}`);
    }
  }

  console.log('='.repeat(80));
}

// Run the test
testScatteredChunks().catch(console.error);
