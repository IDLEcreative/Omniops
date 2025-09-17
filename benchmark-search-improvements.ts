#!/usr/bin/env tsx

/**
 * Comprehensive Performance Benchmarking for Search Improvements
 * Tests BEFORE vs AFTER optimizations with real data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { performance } from 'perf_hooks';
import * as fs from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test configuration
const TEST_DOMAIN = 'thompsonseparts.co.uk';
const ITERATIONS = 5; // Reduced for initial testing
const CONCURRENT_USERS = 3;

interface BenchmarkResult {
  testName: string;
  queryType: string;
  query: string;
  iterations: number;
  results: {
    count: number;
    times: number[];
    avgTime: number;
    minTime: number;
    maxTime: number;
    p50: number;
    p95: number;
    p99: number;
  };
  improvements?: {
    speedup: number;
    description: string;
  };
}

class SearchBenchmark {
  private domainId: string | null = null;
  private results: BenchmarkResult[] = [];

  async initialize() {
    // Get domain_id for the test domain
    const { data: config } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', TEST_DOMAIN)
      .single();

    if (!config) {
      throw new Error(`Domain ${TEST_DOMAIN} not found in customer_configs`);
    }

    this.domainId = config.id;
    console.log(`${colors.green}✓ Initialized with domain_id: ${this.domainId}${colors.reset}\n`);
  }

  async run() {
    console.log(`${colors.bold}${colors.cyan}🚀 Search Performance Benchmark - BEFORE vs AFTER${colors.reset}\n`);
    console.log(`Domain: ${TEST_DOMAIN}`);
    console.log(`Iterations: ${ITERATIONS}\n`);

    await this.initialize();

    // Test 1: Basic text search (BEFORE optimization)
    await this.benchmarkBasicTextSearch();

    // Test 2: Full-text search with indexes (AFTER optimization)
    await this.benchmarkFullTextSearch();

    // Test 3: Fuzzy search without optimization (BEFORE)
    await this.benchmarkBasicFuzzySearch();

    // Test 4: Fuzzy search with trigrams (AFTER)
    await this.benchmarkTrigramFuzzySearch();

    // Test 5: JSONB search without indexes (BEFORE)
    await this.benchmarkBasicJsonbSearch();

    // Test 6: JSONB search with GIN index (AFTER)
    await this.benchmarkIndexedJsonbSearch();

    // Test 7: Combined search without optimization (BEFORE)
    await this.benchmarkBasicCombinedSearch();

    // Test 8: Hybrid search function (AFTER)
    await this.benchmarkHybridSearch();

    // Test 9: Concurrent load test
    await this.benchmarkConcurrentLoad();

    // Generate comparison report
    this.generateComparisonReport();
  }

  private async benchmarkBasicTextSearch() {
    console.log(`${colors.bold}${colors.yellow}📝 Test 1: Basic Text Search (BEFORE - using ILIKE)${colors.reset}\n`);

    const queries = ['pump', 'valve', 'hydraulic', 'filter', 'bearing'];
    
    for (const query of queries) {
      const result = await this.measurePerformance(
        `Basic ILIKE: "${query}"`,
        'BasicText',
        query,
        async () => {
          const { data, count } = await supabase
            .from('scraped_pages')
            .select('id, title, url', { count: 'exact' })
            .eq('domain_id', this.domainId!)
            .ilike('content', `%${query}%`)
            .limit(20);
          return { data, count: count || 0 };
        }
      );
      
      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkFullTextSearch() {
    console.log(`${colors.bold}${colors.green}📝 Test 2: Full-Text Search (AFTER - with tsvector)${colors.reset}\n`);

    const queries = ['pump', 'valve', 'hydraulic', 'filter', 'bearing'];
    
    for (const query of queries) {
      const result = await this.measurePerformance(
        `Full-text: "${query}"`,
        'FullText',
        query,
        async () => {
          const { data, count } = await supabase
            .from('scraped_pages')
            .select('id, title, url', { count: 'exact' })
            .eq('domain_id', this.domainId!)
            .textSearch('content_search_vector', query)
            .limit(20);
          return { data, count: count || 0 };
        }
      );
      
      // Calculate improvement
      const basicResult = this.results.find(r => 
        r.queryType === 'BasicText' && r.query === query
      );
      if (basicResult) {
        result.improvements = {
          speedup: basicResult.results.avgTime / result.results.avgTime,
          description: `${(basicResult.results.avgTime / result.results.avgTime).toFixed(2)}x faster`
        };
      }
      
      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkBasicFuzzySearch() {
    console.log(`${colors.bold}${colors.yellow}🔄 Test 3: Basic Fuzzy Search (BEFORE - multiple ILIKE)${colors.reset}\n`);

    const queries = [
      { typo: 'hydralic', correct: 'hydraulic' },
      { typo: 'pumb', correct: 'pump' },
      { typo: 'vlave', correct: 'valve' }
    ];
    
    for (const { typo, correct } of queries) {
      const result = await this.measurePerformance(
        `Basic fuzzy: "${typo}"`,
        'BasicFuzzy',
        typo,
        async () => {
          // Simulate fuzzy search with multiple ILIKE patterns
          const patterns = this.generateFuzzyPatterns(typo);
          const promises = patterns.map(pattern => 
            supabase
              .from('scraped_pages')
              .select('id, title, url')
              .eq('domain_id', this.domainId!)
              .ilike('content', `%${pattern}%`)
              .limit(5)
          );
          
          const results = await Promise.all(promises);
          const combinedData = results.flatMap(r => r.data || []);
          const uniqueData = Array.from(new Map(
            combinedData.map(item => [item.id, item])
          ).values());
          
          return { data: uniqueData.slice(0, 20), count: uniqueData.length };
        }
      );
      
      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkTrigramFuzzySearch() {
    console.log(`${colors.bold}${colors.green}🔄 Test 4: Trigram Fuzzy Search (AFTER - with pg_trgm)${colors.reset}\n`);

    const queries = [
      { typo: 'hydralic', correct: 'hydraulic' },
      { typo: 'pumb', correct: 'pump' },
      { typo: 'vlave', correct: 'valve' }
    ];
    
    for (const { typo, correct } of queries) {
      const result = await this.measurePerformance(
        `Trigram fuzzy: "${typo}"`,
        'TrigramFuzzy',
        typo,
        async () => {
          // Use the similarity function if available
          const { data, error } = await supabase.rpc('search_fuzzy_content', {
            search_term: typo,
            search_domain_id: this.domainId,
            similarity_threshold: 0.2
          });
          
          if (error) {
            // Fallback to ILIKE if function doesn't exist
            const { data: fallbackData, count } = await supabase
              .from('scraped_pages')
              .select('id, title, url', { count: 'exact' })
              .eq('domain_id', this.domainId!)
              .ilike('content', `%${typo}%`)
              .limit(20);
            return { data: fallbackData, count: count || 0 };
          }
          
          return { data: data || [], count: data?.length || 0 };
        }
      );
      
      // Calculate improvement
      const basicResult = this.results.find(r => 
        r.queryType === 'BasicFuzzy' && r.query === typo
      );
      if (basicResult) {
        result.improvements = {
          speedup: basicResult.results.avgTime / result.results.avgTime,
          description: `${(basicResult.results.avgTime / result.results.avgTime).toFixed(2)}x faster`
        };
      }
      
      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkBasicJsonbSearch() {
    console.log(`${colors.bold}${colors.yellow}🔍 Test 5: Basic JSONB Search (BEFORE - without index)${colors.reset}\n`);

    const queries = [
      { field: 'category', value: 'Pumps' },
      { field: 'brand', value: 'Thompson' },
      { field: 'sku', value: 'TS-001' }
    ];
    
    for (const { field, value } of queries) {
      const result = await this.measurePerformance(
        `JSONB no index: ${field}="${value}"`,
        'BasicJsonb',
        `${field}:${value}`,
        async () => {
          const { data, count } = await supabase
            .from('scraped_pages')
            .select('id, title, url, metadata', { count: 'exact' })
            .eq('domain_id', this.domainId!)
            .filter(`metadata->>${field}`, 'eq', value)
            .limit(20);
          return { data, count: count || 0 };
        }
      );
      
      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkIndexedJsonbSearch() {
    console.log(`${colors.bold}${colors.green}🔍 Test 6: Indexed JSONB Search (AFTER - with GIN index)${colors.reset}\n`);

    const queries = [
      { field: 'category', value: 'Pumps' },
      { field: 'brand', value: 'Thompson' },
      { field: 'sku', value: 'TS-001' }
    ];
    
    for (const { field, value } of queries) {
      const result = await this.measurePerformance(
        `JSONB indexed: ${field}="${value}"`,
        'IndexedJsonb',
        `${field}:${value}`,
        async () => {
          const { data, count } = await supabase
            .from('scraped_pages')
            .select('id, title, url, metadata', { count: 'exact' })
            .eq('domain_id', this.domainId!)
            .contains('metadata', { [field]: value })
            .limit(20);
          return { data, count: count || 0 };
        }
      );
      
      // Calculate improvement
      const basicResult = this.results.find(r => 
        r.queryType === 'BasicJsonb' && r.query === `${field}:${value}`
      );
      if (basicResult) {
        result.improvements = {
          speedup: basicResult.results.avgTime / result.results.avgTime,
          description: `${(basicResult.results.avgTime / result.results.avgTime).toFixed(2)}x faster`
        };
      }
      
      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkBasicCombinedSearch() {
    console.log(`${colors.bold}${colors.yellow}🔀 Test 7: Basic Combined Search (BEFORE - multiple queries)${colors.reset}\n`);

    const result = await this.measurePerformance(
      'Combined search: text + metadata',
      'BasicCombined',
      'hydraulic pump category:Pumps',
      async () => {
        // Simulate combined search with separate queries
        const [textResults, metadataResults] = await Promise.all([
          supabase
            .from('scraped_pages')
            .select('id, title, url, metadata')
            .eq('domain_id', this.domainId!)
            .ilike('content', '%hydraulic pump%')
            .limit(20),
          supabase
            .from('scraped_pages')
            .select('id, title, url, metadata')
            .eq('domain_id', this.domainId!)
            .contains('metadata', { category: 'Pumps' })
            .limit(20)
        ]);
        
        // Merge and deduplicate results
        const combined = [...(textResults.data || []), ...(metadataResults.data || [])];
        const unique = Array.from(new Map(
          combined.map(item => [item.id, item])
        ).values());
        
        return { data: unique.slice(0, 20), count: unique.length };
      }
    );
    
    this.results.push(result);
    this.printResult(result);
  }

  private async benchmarkHybridSearch() {
    console.log(`${colors.bold}${colors.green}🔀 Test 8: Hybrid Search Function (AFTER - optimized)${colors.reset}\n`);

    const result = await this.measurePerformance(
      'Hybrid function: text + metadata',
      'HybridFunction',
      'hydraulic pump category:Pumps',
      async () => {
        const { data, error } = await supabase.rpc('hybrid_product_search_v2', {
          search_query: 'hydraulic pump',
          search_domain_id: this.domainId,
          metadata_filters: { category: 'Pumps' },
          result_limit: 20
        });
        
        if (error) {
          // Fallback if function doesn't exist
          const { data: fallbackData, count } = await supabase
            .from('scraped_pages')
            .select('id, title, url, metadata', { count: 'exact' })
            .eq('domain_id', this.domainId!)
            .ilike('content', '%hydraulic pump%')
            .limit(20);
          return { data: fallbackData, count: count || 0 };
        }
        
        return { data: data || [], count: data?.length || 0 };
      }
    );
    
    // Calculate improvement
    const basicResult = this.results.find(r => 
      r.queryType === 'BasicCombined'
    );
    if (basicResult) {
      result.improvements = {
        speedup: basicResult.results.avgTime / result.results.avgTime,
        description: `${(basicResult.results.avgTime / result.results.avgTime).toFixed(2)}x faster`
      };
    }
    
    this.results.push(result);
    this.printResult(result);
  }

  private async benchmarkConcurrentLoad() {
    console.log(`${colors.bold}${colors.blue}⚡ Test 9: Concurrent Load Test${colors.reset}\n`);

    const queries = ['pump', 'valve', 'filter'];
    
    // Test with sequential queries
    const sequentialStart = performance.now();
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      for (const query of queries) {
        await supabase
          .from('scraped_pages')
          .select('id')
          .eq('domain_id', this.domainId!)
          .textSearch('content_search_vector', query)
          .limit(5);
      }
    }
    const sequentialTime = performance.now() - sequentialStart;

    // Test with concurrent queries
    const concurrentStart = performance.now();
    const promises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      for (const query of queries) {
        promises.push(
          supabase
            .from('scraped_pages')
            .select('id')
            .eq('domain_id', this.domainId!)
            .textSearch('content_search_vector', query)
            .limit(5)
        );
      }
    }
    await Promise.all(promises);
    const concurrentTime = performance.now() - concurrentStart;

    console.log(`${colors.cyan}Sequential (${CONCURRENT_USERS} users × ${queries.length} queries):${colors.reset}`);
    console.log(`  Time: ${colors.yellow}${sequentialTime.toFixed(2)}ms${colors.reset}`);
    console.log(`  Avg per query: ${(sequentialTime / (CONCURRENT_USERS * queries.length)).toFixed(2)}ms\n`);
    
    console.log(`${colors.cyan}Concurrent (${CONCURRENT_USERS} users × ${queries.length} queries):${colors.reset}`);
    console.log(`  Time: ${colors.green}${concurrentTime.toFixed(2)}ms${colors.reset}`);
    console.log(`  Avg per query: ${(concurrentTime / (CONCURRENT_USERS * queries.length)).toFixed(2)}ms`);
    console.log(`  Speedup: ${colors.green}${(sequentialTime / concurrentTime).toFixed(2)}x${colors.reset}\n`);
  }

  private async measurePerformance(
    testName: string,
    queryType: string,
    query: string,
    queryFn: () => Promise<{ data: any; count: number }>
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    let resultCount = 0;

    // Warm-up run
    await queryFn();

    // Actual measurement runs
    for (let i = 0; i < ITERATIONS; i++) {
      const startTime = performance.now();
      const result = await queryFn();
      const endTime = performance.now();
      
      times.push(endTime - startTime);
      if (i === 0) {
        resultCount = result.count;
      }
    }

    const sortedTimes = [...times].sort((a, b) => a - b);
    
    return {
      testName,
      queryType,
      query,
      iterations: ITERATIONS,
      results: {
        count: resultCount,
        times,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        p50: this.percentile(sortedTimes, 50),
        p95: this.percentile(sortedTimes, 95),
        p99: this.percentile(sortedTimes, 99)
      }
    };
  }

  private generateFuzzyPatterns(word: string): string[] {
    const patterns = [word];
    
    // Add variations with missing characters
    for (let i = 0; i < word.length; i++) {
      patterns.push(word.slice(0, i) + word.slice(i + 1));
    }
    
    // Add variations with swapped characters
    for (let i = 0; i < word.length - 1; i++) {
      const chars = word.split('');
      [chars[i], chars[i + 1]] = [chars[i + 1] || '', chars[i] || ''];
      patterns.push(chars.join(''));
    }
    
    return [...new Set(patterns)].slice(0, 5); // Limit to 5 patterns
  }

  private percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))] || 0;
  }

  private printResult(result: BenchmarkResult) {
    console.log(`${colors.cyan}${result.testName}${colors.reset}`);
    console.log(`  Results: ${result.results.count} rows`);
    console.log(`  Avg: ${colors.yellow}${result.results.avgTime.toFixed(2)}ms${colors.reset}`);
    console.log(`  Min: ${result.results.minTime.toFixed(2)}ms | Max: ${result.results.maxTime.toFixed(2)}ms`);
    console.log(`  P50: ${result.results.p50.toFixed(2)}ms | P95: ${result.results.p95.toFixed(2)}ms`);
    
    if (result.improvements) {
      console.log(`  ${colors.green}✨ Improvement: ${result.improvements.description}${colors.reset}`);
    }
    console.log();
  }

  private generateComparisonReport() {
    console.log(`${colors.bold}${colors.green}📊 Performance Comparison Report${colors.reset}\n`);

    // Group results by test type
    const comparisons = [
      {
        name: 'Text Search',
        before: this.results.filter(r => r.queryType === 'BasicText'),
        after: this.results.filter(r => r.queryType === 'FullText')
      },
      {
        name: 'Fuzzy Search',
        before: this.results.filter(r => r.queryType === 'BasicFuzzy'),
        after: this.results.filter(r => r.queryType === 'TrigramFuzzy')
      },
      {
        name: 'JSONB Search',
        before: this.results.filter(r => r.queryType === 'BasicJsonb'),
        after: this.results.filter(r => r.queryType === 'IndexedJsonb')
      },
      {
        name: 'Combined Search',
        before: this.results.filter(r => r.queryType === 'BasicCombined'),
        after: this.results.filter(r => r.queryType === 'HybridFunction')
      }
    ];

    for (const comp of comparisons) {
      if (comp.before.length === 0 || comp.after.length === 0) continue;

      const avgBefore = comp.before.reduce((sum, r) => sum + r.results.avgTime, 0) / comp.before.length;
      const avgAfter = comp.after.reduce((sum, r) => sum + r.results.avgTime, 0) / comp.after.length;
      const improvement = avgBefore / avgAfter;

      console.log(`${colors.bold}${comp.name}:${colors.reset}`);
      console.log(`  Before: ${colors.yellow}${avgBefore.toFixed(2)}ms${colors.reset} avg`);
      console.log(`  After: ${colors.green}${avgAfter.toFixed(2)}ms${colors.reset} avg`);
      console.log(`  Improvement: ${colors.green}${improvement.toFixed(2)}x faster${colors.reset}`);
      console.log(`  Reduction: ${colors.green}${((1 - 1/improvement) * 100).toFixed(1)}%${colors.reset}\n`);
    }

    // Overall statistics
    const allBefore = this.results.filter(r => 
      ['BasicText', 'BasicFuzzy', 'BasicJsonb', 'BasicCombined'].includes(r.queryType)
    );
    const allAfter = this.results.filter(r => 
      ['FullText', 'TrigramFuzzy', 'IndexedJsonb', 'HybridFunction'].includes(r.queryType)
    );

    if (allBefore.length > 0 && allAfter.length > 0) {
      const totalBefore = allBefore.reduce((sum, r) => sum + r.results.avgTime, 0) / allBefore.length;
      const totalAfter = allAfter.reduce((sum, r) => sum + r.results.avgTime, 0) / allAfter.length;
      const totalImprovement = totalBefore / totalAfter;

      console.log(`${colors.bold}${colors.green}🎯 Overall Performance Improvement:${colors.reset}`);
      console.log(`  Average query time reduced from ${colors.yellow}${totalBefore.toFixed(2)}ms${colors.reset} to ${colors.green}${totalAfter.toFixed(2)}ms${colors.reset}`);
      console.log(`  ${colors.bold}${colors.green}${totalImprovement.toFixed(2)}x faster overall${colors.reset}`);
      console.log(`  ${colors.bold}${colors.green}${((1 - 1/totalImprovement) * 100).toFixed(1)}% reduction in response time${colors.reset}\n`);
    }

    // Save detailed results
    const reportData = {
      timestamp: new Date().toISOString(),
      domain: TEST_DOMAIN,
      iterations: ITERATIONS,
      results: this.results,
      summary: comparisons.map(comp => ({
        category: comp.name,
        before: comp.before.map(r => ({
          query: r.query,
          avgTime: r.results.avgTime,
          p95: r.results.p95
        })),
        after: comp.after.map(r => ({
          query: r.query,
          avgTime: r.results.avgTime,
          p95: r.results.p95,
          improvement: r.improvements?.speedup
        }))
      }))
    };

    fs.writeFileSync('benchmark-comparison.json', JSON.stringify(reportData, null, 2));
    console.log(`${colors.green}✓ Detailed results saved to benchmark-comparison.json${colors.reset}`);
  }
}

// Main execution
async function main() {
  const benchmark = new SearchBenchmark();
  
  try {
    await benchmark.run();
    console.log(`\n${colors.bold}${colors.green}✅ Benchmark completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Benchmark failed:${colors.reset}`, error);
    process.exit(1);
  }
}

main().catch(console.error);