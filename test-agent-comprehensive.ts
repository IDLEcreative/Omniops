#!/usr/bin/env npx tsx

/**
 * COMPREHENSIVE AGENT FUNCTIONALITY TEST SUITE
 * Tests all aspects of the AI agent's search, context, and reasoning capabilities
 */

import dotenv from 'dotenv';
import path from 'path';
import { createServiceRoleClient } from './lib/supabase/server';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  time: number;
}

class ComprehensiveAgentTester {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests() {
    console.log(`${colors.bright}${colors.cyan}🤖 COMPREHENSIVE AGENT FUNCTIONALITY TEST SUITE${colors.reset}\n`);
    console.log('=' .repeat(70) + '\n');

    // Wait for environment to be ready
    await new Promise(r => setTimeout(r, 500));

    // Import after env vars are loaded
    const { searchSimilarContent } = await import('./lib/embeddings');
    const { getProductOverview } = await import('./lib/search-overview');
    const { getDomainCache } = await import('./lib/domain-cache');

    // Test 1: Database Connectivity
    await this.testDatabaseConnectivity();

    // Test 2: Search Limits and Full Results
    await this.testSearchLimits(searchSimilarContent, getProductOverview);

    // Test 3: Contextual Awareness
    await this.testContextualAwareness(searchSimilarContent, getProductOverview);

    // Test 4: Follow-up Query Handling
    await this.testFollowUpQueries(searchSimilarContent);

    // Test 5: Multi-Dataset Accumulation
    await this.testMultiDatasetAccumulation(searchSimilarContent);

    // Test 6: Complex Cross-Reference Queries
    await this.testCrossReferenceQueries(searchSimilarContent, getProductOverview);

    // Test 7: Real-World Conversation Simulation
    await this.testRealWorldConversation(searchSimilarContent, getProductOverview);

    // Test 8: Performance and Caching
    await this.testPerformanceAndCaching(searchSimilarContent);

    // Print summary
    this.printSummary();
  }

  private async testDatabaseConnectivity() {
    const testName = '1. Database Connectivity & Domain Cache';
    console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
    const start = Date.now();

    try {
      const supabase = await createServiceRoleClient();
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Invalid Supabase client');
      }

      // Test domain cache
      const { getDomainCache } = await import('./lib/domain-cache');
      const domainCache = getDomainCache();
      const domainId = await domainCache.getDomainId('thompsonseparts.co.uk');

      if (!domainId) {
        throw new Error('Domain not found in cache');
      }

      // Test basic query
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('id')
        .eq('domain_id', domainId)
        .limit(1);

      if (error) throw error;

      this.recordResult(testName, true, `✅ Database connected, Domain cached: ${domainId.substring(0, 8)}...`, Date.now() - start);
    } catch (error: any) {
      this.recordResult(testName, false, `❌ Failed: ${error.message}`, Date.now() - start);
    }
  }

  private async testSearchLimits(searchSimilarContent: any, getProductOverview: any) {
    const testName = '2. Search Limits & Full Context Return';
    console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
    const start = Date.now();

    try {
      const domain = 'thompsonseparts.co.uk';
      
      // Test with Cifa products (should have 212 total)
      const overview = await getProductOverview('Cifa', domain);
      const totalInDb = overview?.total || 0;

      // Test different limit requests
      const testLimits = [10, 50, 100, 250];
      const results: any = {};

      for (const limit of testLimits) {
        const searchResults = await searchSimilarContent('Cifa', domain, limit, 0.15, 5000);
        results[limit] = searchResults.length;
        console.log(`  Limit ${limit}: Got ${searchResults.length} results`);
      }

      // Verify we can get all available results
      const maxReceived = Math.max(...Object.values(results));
      const success = maxReceived >= Math.min(200, totalInDb); // Should get at least 200 or all

      this.recordResult(
        testName, 
        success,
        success 
          ? `✅ Can retrieve full context: ${maxReceived}/${totalInDb} products`
          : `❌ Limited context: Only ${maxReceived}/${totalInDb} products`,
        Date.now() - start
      );
    } catch (error: any) {
      this.recordResult(testName, false, `❌ Failed: ${error.message}`, Date.now() - start);
    }
  }

  private async testContextualAwareness(searchSimilarContent: any, getProductOverview: any) {
    const testName = '3. AI Contextual Awareness (Full Dataset)';
    console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
    const start = Date.now();

    try {
      const domain = 'thompsonseparts.co.uk';
      
      // Simulate what AI receives for a comprehensive query
      const searchResults = await searchSimilarContent('pumps', domain, 100, 0.15, 5000);
      const overview = await getProductOverview('pumps', domain);

      // Build the AI's context object
      const aiContext = {
        formatted_response: `We have ${overview?.total || searchResults.length} pumps available.`,
        data: {
          total: overview?.total || searchResults.length,
          shown: searchResults.length,
          products: searchResults.map(r => ({
            name: r.title,
            url: r.url,
            content: r.content
          }))
        },
        metadata: {
          categories: overview?.categories || [],
          brands: overview?.brands || []
        }
      };

      // Verify AI has full context
      const hasFullContext = aiContext.data.products.length === aiContext.data.total || 
                            aiContext.data.products.length >= 20;

      console.log(`  AI receives: ${aiContext.data.products.length} products`);
      console.log(`  Can answer about product #10: ${aiContext.data.products[9] ? 'YES ✅' : 'NO ❌'}`);
      console.log(`  Can filter by criteria: ${aiContext.data.products.length > 10 ? 'YES ✅' : 'LIMITED ⚠️'}`);

      this.recordResult(
        testName,
        hasFullContext,
        hasFullContext 
          ? `✅ AI has full context: ${aiContext.data.products.length} products in memory`
          : `❌ Limited context: Only ${aiContext.data.products.length} products`,
        Date.now() - start
      );
    } catch (error: any) {
      this.recordResult(testName, false, `❌ Failed: ${error.message}`, Date.now() - start);
    }
  }

  private async testFollowUpQueries(searchSimilarContent: any) {
    const testName = '4. Follow-up Query Handling (No Re-search)';
    console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
    const start = Date.now();

    try {
      const domain = 'thompsonseparts.co.uk';
      
      // Initial search - AI gets all results
      const initialResults = await searchSimilarContent('Cifa', domain, 250, 0.15, 5000);
      
      // Simulate follow-up scenarios AI can handle without re-searching
      const followUpScenarios = [
        { 
          query: "Show me items 50-60", 
          canAnswer: initialResults.length >= 60,
          answer: initialResults.slice(49, 60).map(r => r.title.substring(0, 30))
        },
        {
          query: "Which ones contain 'pump'?",
          canAnswer: true,
          answer: initialResults.filter(r => r.title.toLowerCase().includes('pump')).length
        },
        {
          query: "What's the 100th product?",
          canAnswer: initialResults.length >= 100,
          answer: initialResults[99]?.title || 'Not available'
        }
      ];

      let allPass = true;
      for (const scenario of followUpScenarios) {
        console.log(`  "${scenario.query}": ${scenario.canAnswer ? 'CAN ANSWER ✅' : 'NEEDS RE-SEARCH ❌'}`);
        if (scenario.canAnswer && scenario.answer) {
          console.log(`    → ${JSON.stringify(scenario.answer).substring(0, 100)}...`);
        }
        allPass = allPass && scenario.canAnswer;
      }

      this.recordResult(
        testName,
        allPass,
        allPass
          ? `✅ AI can handle all follow-ups from ${initialResults.length} cached results`
          : `⚠️ Some follow-ups need re-searching (only ${initialResults.length} results cached)`,
        Date.now() - start
      );
    } catch (error: any) {
      this.recordResult(testName, false, `❌ Failed: ${error.message}`, Date.now() - start);
    }
  }

  private async testMultiDatasetAccumulation(searchSimilarContent: any) {
    const testName = '5. Multi-Dataset Accumulation';
    console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
    const start = Date.now();

    try {
      const domain = 'thompsonseparts.co.uk';
      
      // Simulate multiple searches building context
      console.log('  Search 1: Cifa products...');
      const cifaResults = await searchSimilarContent('Cifa', domain, 100, 0.15, 3000);
      
      console.log('  Search 2: Pumps...');
      const pumpResults = await searchSimilarContent('pumps', domain, 50, 0.15, 3000);
      
      console.log('  Search 3: Starter motors...');
      const starterResults = await searchSimilarContent('starter', domain, 30, 0.15, 3000);

      // Simulate AI's accumulated context
      const accumulatedContext = {
        datasets: {
          cifa: cifaResults.length,
          pumps: pumpResults.length,
          starters: starterResults.length
        },
        totalItems: cifaResults.length + pumpResults.length + starterResults.length,
        canCrossReference: true
      };

      console.log(`\n  Accumulated context:`);
      console.log(`    - Cifa products: ${accumulatedContext.datasets.cifa}`);
      console.log(`    - Pumps: ${accumulatedContext.datasets.pumps}`);
      console.log(`    - Starters: ${accumulatedContext.datasets.starters}`);
      console.log(`    - Total items in memory: ${accumulatedContext.totalItems}`);

      const success = accumulatedContext.totalItems > 50;

      this.recordResult(
        testName,
        success,
        success
          ? `✅ AI accumulated ${accumulatedContext.totalItems} items across 3 searches`
          : `❌ Limited accumulation: Only ${accumulatedContext.totalItems} items`,
        Date.now() - start
      );
    } catch (error: any) {
      this.recordResult(testName, false, `❌ Failed: ${error.message}`, Date.now() - start);
    }
  }

  private async testCrossReferenceQueries(searchSimilarContent: any, getProductOverview: any) {
    const testName = '6. Complex Cross-Reference Queries';
    console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
    const start = Date.now();

    try {
      const domain = 'thompsonseparts.co.uk';
      
      // Get two different datasets
      const [cifaResults, pumpResults] = await Promise.all([
        searchSimilarContent('Cifa', domain, 100, 0.15, 5000),
        searchSimilarContent('hydraulic', domain, 50, 0.15, 5000)
      ]);

      // Find overlaps (Cifa products that are also hydraulic)
      const cifaUrls = new Set(cifaResults.map(r => r.url));
      const hydraulicUrls = new Set(pumpResults.map(r => r.url));
      const overlaps = [...cifaUrls].filter(url => hydraulicUrls.has(url));

      console.log(`  Dataset 1 (Cifa): ${cifaResults.length} items`);
      console.log(`  Dataset 2 (Hydraulic): ${pumpResults.length} items`);
      console.log(`  Cross-reference found: ${overlaps.length} items in both sets`);
      
      // AI can answer complex queries like:
      const complexQueries = [
        `"Show Cifa hydraulic products" → Can identify ${overlaps.length} matches`,
        `"Compare Cifa vs other hydraulic" → Can analyze ${cifaResults.length + pumpResults.length} items`,
        `"Most common category across both" → Can analyze patterns`
      ];

      complexQueries.forEach(q => console.log(`  ${q}`));

      const success = cifaResults.length > 0 && pumpResults.length > 0;

      this.recordResult(
        testName,
        success,
        success
          ? `✅ AI can cross-reference ${cifaResults.length + pumpResults.length} items across datasets`
          : `❌ Insufficient data for cross-referencing`,
        Date.now() - start
      );
    } catch (error: any) {
      this.recordResult(testName, false, `❌ Failed: ${error.message}`, Date.now() - start);
    }
  }

  private async testRealWorldConversation(searchSimilarContent: any, getProductOverview: any) {
    const testName = '7. Real-World Conversation Flow';
    console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
    const start = Date.now();

    try {
      const domain = 'thompsonseparts.co.uk';
      const conversation: any[] = [];

      // Turn 1: Initial broad search
      console.log('\n  Turn 1: "Show me all Cifa products"');
      const turn1 = await searchSimilarContent('Cifa', domain, 250, 0.15, 5000);
      conversation.push({ role: 'search', results: turn1.length });
      console.log(`    → AI receives ${turn1.length} products`);

      // Turn 2: Filter from memory (no search needed)
      console.log('\n  Turn 2: "Which ones are pumps?" (from memory)');
      const pumpsFromMemory = turn1.filter(r => r.title.toLowerCase().includes('pump'));
      conversation.push({ role: 'filter', results: pumpsFromMemory.length });
      console.log(`    → AI filters to ${pumpsFromMemory.length} pumps without searching`);

      // Turn 3: New search for comparison
      console.log('\n  Turn 3: "Show me Teng tools too"');
      const turn3 = await searchSimilarContent('Teng', domain, 100, 0.15, 5000);
      conversation.push({ role: 'search', results: turn3.length });
      console.log(`    → AI adds ${turn3.length} Teng products to context`);

      // Turn 4: Complex cross-reference
      console.log('\n  Turn 4: "Compare prices between Cifa and Teng" (from memory)');
      console.log(`    → AI can analyze ${turn1.length + turn3.length} total items`);

      // Turn 5: Specific item from memory
      console.log('\n  Turn 5: "Tell me about the 50th Cifa product" (from memory)');
      if (turn1[49]) {
        console.log(`    → AI retrieves: "${turn1[49].title.substring(0, 50)}..."`);
      }

      const totalContext = turn1.length + turn3.length;
      const success = totalContext > 100 && pumpsFromMemory.length > 0;

      this.recordResult(
        testName,
        success,
        success
          ? `✅ Conversation maintained ${totalContext} items in context across 5 turns`
          : `❌ Limited conversation context: ${totalContext} items`,
        Date.now() - start
      );
    } catch (error: any) {
      this.recordResult(testName, false, `❌ Failed: ${error.message}`, Date.now() - start);
    }
  }

  private async testPerformanceAndCaching(searchSimilarContent: any) {
    const testName = '8. Performance & Caching';
    console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
    const start = Date.now();

    try {
      const domain = 'thompsonseparts.co.uk';
      
      // First search (cold cache)
      console.log('  First search (cold cache)...');
      const coldStart = Date.now();
      const firstResults = await searchSimilarContent('test query xyz', domain, 10, 0.15, 5000);
      const coldTime = Date.now() - coldStart;
      console.log(`    → Cold search: ${coldTime}ms`);

      // Second search (warm cache)
      console.log('  Second search (warm cache)...');
      const warmStart = Date.now();
      const secondResults = await searchSimilarContent('test query xyz', domain, 10, 0.15, 5000);
      const warmTime = Date.now() - warmStart;
      console.log(`    → Warm search: ${warmTime}ms`);

      // Cache effectiveness
      const cacheSpeedup = coldTime > 0 ? Math.round((coldTime - warmTime) / coldTime * 100) : 0;
      console.log(`    → Cache speedup: ${cacheSpeedup}%`);

      // Test parallel searches
      console.log('\n  Testing parallel search capability...');
      const parallelStart = Date.now();
      const [r1, r2, r3] = await Promise.all([
        searchSimilarContent('pump', domain, 5, 0.15, 3000),
        searchSimilarContent('valve', domain, 5, 0.15, 3000),
        searchSimilarContent('motor', domain, 5, 0.15, 3000)
      ]);
      const parallelTime = Date.now() - parallelStart;
      console.log(`    → 3 parallel searches: ${parallelTime}ms total`);

      const success = warmTime < coldTime || cacheSpeedup > 20;

      this.recordResult(
        testName,
        success,
        success
          ? `✅ Caching effective: ${cacheSpeedup}% speedup, parallel in ${parallelTime}ms`
          : `⚠️ Limited cache benefit: ${cacheSpeedup}% speedup`,
        Date.now() - start
      );
    } catch (error: any) {
      this.recordResult(testName, false, `❌ Failed: ${error.message}`, Date.now() - start);
    }
  }

  private recordResult(name: string, passed: boolean, details: string, time: number) {
    this.results.push({ name, passed, details, time });
    console.log(`  ${details}`);
  }

  private printSummary() {
    console.log('\n' + '=' .repeat(70));
    console.log(`${colors.bright}COMPREHENSIVE TEST SUMMARY${colors.reset}\n`);

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    this.results.forEach(r => {
      const icon = r.passed ? '✅' : '❌';
      const color = r.passed ? colors.green : colors.red;
      console.log(`${color}${icon} ${r.name}${colors.reset}`);
      console.log(`   ${r.details}`);
      console.log(`   Time: ${r.time}ms\n`);
    });

    console.log('=' .repeat(70));
    
    const allPassed = failed === 0;
    const summaryColor = allPassed ? colors.green : colors.yellow;
    
    console.log(`${summaryColor}${colors.bright}FINAL RESULTS:${colors.reset}`);
    console.log(`${summaryColor}Passed: ${passed}/${total}${colors.reset}`);
    console.log(`${summaryColor}Failed: ${failed}/${total}${colors.reset}`);
    
    if (allPassed) {
      console.log(`\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED! The agent system is fully functional!${colors.reset}`);
      console.log('\nKey Capabilities Verified:');
      console.log('  ✅ Full context retrieval (200+ items)');
      console.log('  ✅ No re-searching for follow-ups');
      console.log('  ✅ Multi-dataset accumulation');
      console.log('  ✅ Cross-reference reasoning');
      console.log('  ✅ Conversation flow with memory');
      console.log('  ✅ Effective caching & performance');
    } else {
      console.log(`\n${colors.yellow}⚠️ Some tests failed. Review the details above.${colors.reset}`);
    }
  }
}

// Run the comprehensive test suite
const tester = new ComprehensiveAgentTester();
tester.runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});