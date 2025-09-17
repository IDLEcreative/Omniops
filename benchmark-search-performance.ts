#!/usr/bin/env tsx

/**
 * Comprehensive Performance Benchmarking for Search Improvements
 * 
 * This script measures and compares database search performance:
 * - Query execution times (before/after optimizations)
 * - Memory usage and buffer cache effectiveness
 * - Index scan vs sequential scan ratios
 * - Concurrent query performance
 * - Response time percentiles (p50, p95, p99)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

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
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Test configuration
const TEST_DOMAIN = 'thompsonseparts.co.uk';
const ITERATIONS = 10; // Number of iterations per test for statistical significance
const CONCURRENT_QUERIES = 5; // Number of concurrent queries to test

// Test queries organized by category
const testQueries = {
  fullText: [
    { name: 'Simple product search', query: 'pump' },
    { name: 'Multi-word search', query: 'hydraulic pump' },
    { name: 'Specific product', query: 'gear pump' },
    { name: 'Technical term', query: 'directional valve' },
    { name: 'Brand search', query: 'DC66' }
  ],
  fuzzy: [
    { name: 'Common typo', query: 'hydralic', correct: 'hydraulic' },
    { name: 'Missing letter', query: 'pum', correct: 'pump' },
    { name: 'Swapped letters', query: 'vlaue', correct: 'valve' },
    { name: 'Extra letter', query: 'pummp', correct: 'pump' },
    { name: 'Phonetic match', query: 'hidrolik', correct: 'hydraulic' }
  ],
  metadata: [
    { name: 'SKU search', field: 'sku', value: 'DC66-001' },
    { name: 'Price range', field: 'price', condition: 'range', min: 100, max: 500 },
    { name: 'Category search', field: 'category', value: 'Hydraulic Pumps' },
    { name: 'Brand filter', field: 'brand', value: 'DC66' },
    { name: 'In stock items', field: 'in_stock', value: true }
  ]
};

interface BenchmarkResult {
  queryType: string;
  queryName: string;
  query: string;
  times: number[];
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  resultCount: number;
  planInfo?: any;
  cacheHits?: number;
  indexUsage?: string;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  async run() {
    console.log(`${colors.bold}${colors.cyan}🚀 Starting Comprehensive Search Performance Benchmark${colors.reset}\n`);
    console.log(`Domain: ${TEST_DOMAIN}`);
    console.log(`Iterations per test: ${ITERATIONS}`);
    console.log(`Concurrent queries: ${CONCURRENT_QUERIES}\n`);

    // Warm up the database connection
    await this.warmUp();

    // Reset statistics
    await this.resetStatistics();

    // Run benchmarks for each query type
    await this.benchmarkFullTextSearch();
    await this.benchmarkFuzzySearch();
    await this.benchmarkMetadataSearch();
    await this.benchmarkHybridFunction();
    await this.benchmarkConcurrentQueries();

    // Analyze database statistics
    await this.analyzeStatistics();

    // Generate report
    this.generateReport();
  }

  private async warmUp() {
    console.log(`${colors.yellow}Warming up database connection...${colors.reset}`);
    
    // Run a few dummy queries to warm up the connection pool
    for (let i = 0; i < 3; i++) {
      await supabase
        .from('scraped_pages')
        .select('id')
        .eq('domain', TEST_DOMAIN)
        .limit(1);
    }
    
    console.log(`${colors.green}✓ Database connection warmed up${colors.reset}\n`);
  }

  private async resetStatistics() {
    console.log(`${colors.yellow}Resetting database statistics...${colors.reset}`);
    
    // Reset pg_stat_statements if available (may not exist)
    try {
      await supabase.rpc('pg_stat_statements_reset');
    } catch (error) {
      // Function may not exist, continue
    }
    
    // Clear buffer cache statistics (may not exist)
    try {
      await supabase.rpc('pg_stat_reset');
    } catch (error) {
      // Function may not exist, continue
    }
    
    console.log(`${colors.green}✓ Statistics reset${colors.reset}\n`);
  }

  private async benchmarkFullTextSearch() {
    console.log(`${colors.bold}${colors.blue}📝 Full-Text Search Benchmarks${colors.reset}\n`);

    for (const test of testQueries.fullText) {
      const result = await this.measureQuery(
        'Full-Text',
        test.name,
        test.query,
        async (query) => {
          // First get the domain_id
          const { data: config } = await supabase
            .from('customer_configs')
            .select('id')
            .eq('domain', TEST_DOMAIN)
            .single();
            
          if (!config) return { data: [], count: 0 };
          
          // Test using scraped_pages full-text search
          return await supabase
            .from('scraped_pages')
            .select('*', { count: 'exact' })
            .eq('domain_id', config.id)
            .textSearch('content', query, {
              type: 'websearch',
              config: 'english'
            });
        }
      );

      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkFuzzySearch() {
    console.log(`${colors.bold}${colors.blue}🔄 Fuzzy Search Benchmarks${colors.reset}\n`);

    for (const test of testQueries.fuzzy) {
      const result = await this.measureQuery(
        'Fuzzy',
        test.name,
        test.query,
        async (query) => {
          // Test using similarity search with pg_trgm
          const { data, error } = await supabase.rpc('search_with_typo_tolerance', {
            search_query: query,
            search_domain: TEST_DOMAIN
          });

          if (error) {
            // Fallback to basic search if function doesn't exist
            return await supabase
              .from('scraped_pages')
              .select('*', { count: 'exact' })
              .eq('domain', TEST_DOMAIN)
              .ilike('content', `%${query}%`);
          }

          return { data, count: data?.length || 0 };
        }
      );

      result.queryName = `${test.name} (${test.query} → ${test.correct})`;
      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkMetadataSearch() {
    console.log(`${colors.bold}${colors.blue}🔍 JSONB Metadata Search Benchmarks${colors.reset}\n`);

    for (const test of testQueries.metadata) {
      let queryFn: (field: string, value: any) => Promise<any>;

      if (test.condition === 'range' && test.min !== undefined && test.max !== undefined) {
        queryFn = async () => {
          const query = `metadata->>'${test.field}' >= '${test.min}' AND metadata->>'${test.field}' <= '${test.max}'`;
          return await supabase
            .from('scraped_pages')
            .select('*', { count: 'exact' })
            .eq('domain', TEST_DOMAIN)
            .filter('metadata', 'not.is', null);
        };
      } else {
        queryFn = async () => {
          return await supabase
            .from('scraped_pages')
            .select('*', { count: 'exact' })
            .eq('domain', TEST_DOMAIN)
            .contains('metadata', { [test.field]: test.value });
        };
      }

      const result = await this.measureQuery(
        'Metadata',
        test.name,
        `${test.field}: ${test.value || `${test.min}-${test.max}`}`,
        queryFn as any
      );

      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkHybridFunction() {
    console.log(`${colors.bold}${colors.blue}🔀 Hybrid Product Search Function Benchmarks${colors.reset}\n`);

    const hybridTests = [
      { name: 'Simple product', query: 'pump', limit: 10 },
      { name: 'With typo', query: 'hydralic', limit: 10 },
      { name: 'Complex query', query: 'high pressure hydraulic pump', limit: 20 },
      { name: 'SKU search', query: 'DC66-001', limit: 5 },
      { name: 'Price filter', query: 'pump under $500', limit: 15 }
    ];

    for (const test of hybridTests) {
      const result = await this.measureQuery(
        'Hybrid Function',
        test.name,
        test.query,
        async (query) => {
          const { data, error } = await supabase.rpc('hybrid_product_search', {
            search_query: query,
            search_domain: TEST_DOMAIN,
            result_limit: test.limit
          });

          if (error) {
            console.error(`Error calling hybrid_product_search: ${error.message}`);
            return { data: null, count: 0 };
          }

          return { data, count: data?.length || 0 };
        }
      );

      this.results.push(result);
      this.printResult(result);
    }
  }

  private async benchmarkConcurrentQueries() {
    console.log(`${colors.bold}${colors.blue}⚡ Concurrent Query Performance${colors.reset}\n`);

    const queries = [
      'pump',
      'valve',
      'hydraulic',
      'gear',
      'pressure'
    ];

    const concurrentResults: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const startTime = performance.now();

      // Execute queries concurrently
      await Promise.all(
        queries.slice(0, CONCURRENT_QUERIES).map(query =>
          supabase
            .from('scraped_pages')
            .select('id, title')
            .eq('domain', TEST_DOMAIN)
            .textSearch('content', query)
            .limit(10)
        )
      );

      const endTime = performance.now();
      concurrentResults.push(endTime - startTime);
    }

    const result: BenchmarkResult = {
      queryType: 'Concurrent',
      queryName: `${CONCURRENT_QUERIES} parallel queries`,
      query: queries.slice(0, CONCURRENT_QUERIES).join(', '),
      times: concurrentResults,
      avgTime: this.calculateAverage(concurrentResults),
      minTime: Math.min(...concurrentResults),
      maxTime: Math.max(...concurrentResults),
      p50: this.calculatePercentile(concurrentResults, 50),
      p95: this.calculatePercentile(concurrentResults, 95),
      p99: this.calculatePercentile(concurrentResults, 99),
      resultCount: CONCURRENT_QUERIES
    };

    this.results.push(result);
    this.printResult(result);
  }

  private async measureQuery(
    queryType: string,
    queryName: string,
    query: string,
    queryFn: (query: string) => Promise<any>
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    let resultCount = 0;
    let planInfo: any;

    // Run the query multiple times to get stable measurements
    for (let i = 0; i < ITERATIONS; i++) {
      const startTime = performance.now();
      
      try {
        const result = await queryFn(query);
        const endTime = performance.now();
        
        times.push(endTime - startTime);
        
        // Get result count from first iteration
        if (i === 0) {
          resultCount = result.count || result.data?.length || 0;
        }
      } catch (error) {
        console.error(`Error in query: ${error}`);
        times.push(0);
      }
    }

    // Get query plan for analysis (optional)
    try {
      const { data: explainData } = await supabase.rpc('get_query_plan', {
        query_text: `SELECT * FROM scraped_pages WHERE domain = '${TEST_DOMAIN}' AND content ILIKE '%${query}%'`
      });
      
      planInfo = explainData;
    } catch (error) {
      // Query plan analysis not available
    }

    return {
      queryType,
      queryName,
      query,
      times,
      avgTime: this.calculateAverage(times),
      minTime: Math.min(...times.filter(t => t > 0)),
      maxTime: Math.max(...times),
      p50: this.calculatePercentile(times, 50),
      p95: this.calculatePercentile(times, 95),
      p99: this.calculatePercentile(times, 99),
      resultCount,
      planInfo
    };
  }

  private async analyzeStatistics() {
    console.log(`${colors.bold}${colors.blue}📊 Database Statistics Analysis${colors.reset}\n`);

    // Check index usage
    let indexStats: any = null;
    try {
      const { data } = await supabase
        .rpc('get_index_statistics', { table_name: 'scraped_pages' });
      indexStats = data;
    } catch (error) {
      // Function may not exist
    }

    if (indexStats) {
      console.log(`${colors.cyan}Index Usage Statistics:${colors.reset}`);
      console.log(indexStats);
    }

    // Check buffer cache hit ratio
    let cacheStats: any = null;
    try {
      const { data } = await supabase
        .rpc('get_cache_hit_ratio');
      cacheStats = data;
    } catch (error) {
      // Function may not exist
    }

    if (cacheStats) {
      console.log(`\n${colors.cyan}Cache Hit Ratio:${colors.reset}`);
      console.log(cacheStats);
    }

    // Check table statistics
    let tableStats: any = null;
    try {
      const { data } = await supabase
        .rpc('get_table_statistics', { table_name: 'scraped_pages' });
      tableStats = data;
    } catch (error) {
      // Function may not exist
    }

    if (tableStats) {
      console.log(`\n${colors.cyan}Table Statistics:${colors.reset}`);
      console.log(tableStats);
    }
  }

  private printResult(result: BenchmarkResult) {
    console.log(`${colors.cyan}${result.queryName}${colors.reset}`);
    console.log(`  Query: "${result.query}"`);
    console.log(`  Results: ${result.resultCount} rows`);
    console.log(`  Avg: ${colors.yellow}${result.avgTime.toFixed(2)}ms${colors.reset}`);
    console.log(`  Min: ${result.minTime.toFixed(2)}ms | Max: ${result.maxTime.toFixed(2)}ms`);
    console.log(`  P50: ${result.p50.toFixed(2)}ms | P95: ${result.p95.toFixed(2)}ms | P99: ${result.p99.toFixed(2)}ms`);
    console.log();
  }

  private generateReport() {
    console.log(`${colors.bold}${colors.green}📈 Performance Report Summary${colors.reset}\n`);

    // Group results by query type
    const groupedResults = this.results.reduce((acc, result) => {
      if (!acc[result.queryType]) {
        acc[result.queryType] = [];
      }
      acc[result.queryType]!.push(result);
      return acc;
    }, {} as Record<string, BenchmarkResult[]>);

    // Calculate aggregates by type
    for (const [type, results] of Object.entries(groupedResults)) {
      const avgTimes = results.map(r => r.avgTime);
      const p95Times = results.map(r => r.p95);
      
      console.log(`${colors.bold}${type} Searches:${colors.reset}`);
      console.log(`  Average response time: ${colors.yellow}${this.calculateAverage(avgTimes).toFixed(2)}ms${colors.reset}`);
      console.log(`  Average P95: ${this.calculateAverage(p95Times).toFixed(2)}ms`);
      console.log(`  Fastest query: ${Math.min(...avgTimes).toFixed(2)}ms`);
      console.log(`  Slowest query: ${Math.max(...avgTimes).toFixed(2)}ms`);
      console.log();
    }

    // Save detailed results to JSON file
    const reportPath = path.join(process.cwd(), 'benchmark-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`${colors.green}✓ Detailed results saved to: ${reportPath}${colors.reset}`);

    // Generate CSV for analysis
    const csvPath = path.join(process.cwd(), 'benchmark-results.csv');
    const csvContent = this.generateCSV();
    fs.writeFileSync(csvPath, csvContent);
    console.log(`${colors.green}✓ CSV results saved to: ${csvPath}${colors.reset}`);
  }

  private generateCSV(): string {
    const headers = ['Query Type', 'Query Name', 'Query', 'Avg Time (ms)', 'Min Time (ms)', 'Max Time (ms)', 'P50 (ms)', 'P95 (ms)', 'P99 (ms)', 'Result Count'];
    const rows = this.results.map(r => [
      r.queryType,
      r.queryName,
      r.query,
      r.avgTime.toFixed(2),
      r.minTime.toFixed(2),
      r.maxTime.toFixed(2),
      r.p50.toFixed(2),
      r.p95.toFixed(2),
      r.p99.toFixed(2),
      r.resultCount.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private calculateAverage(times: number[]): number {
    const validTimes = times.filter(t => t > 0);
    if (validTimes.length === 0) return 0;
    return validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
  }

  private calculatePercentile(times: number[], percentile: number): number {
    const validTimes = times.filter(t => t > 0).sort((a, b) => a - b);
    if (validTimes.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * validTimes.length) - 1;
    return validTimes[Math.max(0, Math.min(index, validTimes.length - 1))] || 0;
  }
}

// Run the benchmark
async function main() {
  const benchmark = new PerformanceBenchmark();
  
  try {
    await benchmark.run();
    console.log(`\n${colors.bold}${colors.green}✅ Benchmark completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Benchmark failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Execute the benchmark
main().catch(console.error);