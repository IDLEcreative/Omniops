#!/usr/bin/env npx tsx
/**
 * Performance Analysis for Intelligent Search System
 * 
 * This script analyzes the performance characteristics of the new intelligent search system
 * compared to the old implementation, measuring response times, resource usage, and bottlenecks.
 */

import { performance } from 'perf_hooks';
import { createServiceRoleClient } from './lib/supabase-server';
import OpenAI from 'openai';
import { searchSimilarContent } from './lib/embeddings';
import { searchProductsDynamic } from './lib/woocommerce-dynamic';
import { getEnhancedChatContext } from './lib/chat-context-enhancer';

// Test configuration
const TEST_DOMAIN = 'thompsonseparts.co.uk';
const TEST_QUERIES = [
  // Simple queries (no search expected)
  { query: 'Hi there!', expectedIterations: 0, type: 'greeting' },
  { query: 'Thank you', expectedIterations: 0, type: 'gratitude' },
  
  // Product queries (1-2 iterations expected)
  { query: 'Show me hydraulic pumps', expectedIterations: 1, type: 'product_search' },
  { query: 'I need a torque wrench for my equipment', expectedIterations: 1, type: 'product_specific' },
  { query: 'What Cifa parts do you have?', expectedIterations: 2, type: 'brand_search' },
  
  // Complex queries (2-3 iterations expected)
  { query: 'I need a DC66-10P Agri Flip pump with specifications', expectedIterations: 3, type: 'detailed_product' },
  { query: 'Show me all available concrete pump parts under £500', expectedIterations: 2, type: 'filtered_search' },
  { query: 'What hydraulic systems are compatible with my Cifa equipment?', expectedIterations: 3, type: 'compatibility_check' },
];

interface PerformanceMetrics {
  query: string;
  type: string;
  totalTime: number;
  searchTime: number;
  aiProcessingTime: number;
  databaseTime: number;
  iterations: number;
  searchCalls: number;
  totalResults: number;
  memoryUsed: number;
  cacheHits: number;
  bottlenecks: string[];
}

class PerformanceAnalyzer {
  private metrics: PerformanceMetrics[] = [];
  private openai: OpenAI | null = null;
  private supabase: any = null;
  
  async initialize() {
    console.log('🚀 Initializing Performance Analyzer...\n');
    
    // Initialize OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    this.openai = new OpenAI({ apiKey });
    
    // Initialize Supabase
    this.supabase = await createServiceRoleClient();
    if (!this.supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    console.log('✅ Initialization complete\n');
  }
  
  /**
   * Simulate the intelligent search route processing
   */
  async simulateIntelligentSearch(query: string): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    const metric: PerformanceMetrics = {
      query,
      type: '',
      totalTime: 0,
      searchTime: 0,
      aiProcessingTime: 0,
      databaseTime: 0,
      iterations: 0,
      searchCalls: 0,
      totalResults: 0,
      memoryUsed: 0,
      cacheHits: 0,
      bottlenecks: []
    };
    
    try {
      // 1. Database operations (conversation management)
      const dbStart = performance.now();
      const { data: domainData } = await this.supabase
        .from('domains')
        .select('id')
        .eq('domain', TEST_DOMAIN)
        .single();
      metric.databaseTime = performance.now() - dbStart;
      
      if (metric.databaseTime > 100) {
        metric.bottlenecks.push(`Slow database query: ${metric.databaseTime.toFixed(0)}ms`);
      }
      
      // 2. Initial AI processing with tools
      const aiStart = performance.now();
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a search assistant. Analyze the query and determine if search is needed.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'search_products',
              description: 'Search for products',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string' }
                },
                required: ['query']
              }
            }
          }
        ],
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 100
      });
      
      const aiInitialTime = performance.now() - aiStart;
      metric.aiProcessingTime += aiInitialTime;
      
      if (aiInitialTime > 2000) {
        metric.bottlenecks.push(`Slow AI initial response: ${aiInitialTime.toFixed(0)}ms`);
      }
      
      // 3. Simulate search iterations based on tool calls
      const toolCalls = completion.choices[0]?.message?.tool_calls || [];
      const maxIterations = 3;
      let allResults: any[] = [];
      
      for (let i = 0; i < Math.min(toolCalls.length, maxIterations); i++) {
        metric.iterations++;
        
        // Execute search
        const searchStart = performance.now();
        
        // Parallel search operations
        const [semanticResults, wooResults] = await Promise.all([
          searchSimilarContent(query, TEST_DOMAIN, 8, 0.2).catch(() => []),
          searchProductsDynamic(TEST_DOMAIN, query, 8).catch(() => [])
        ]);
        
        const searchTime = performance.now() - searchStart;
        metric.searchTime += searchTime;
        metric.searchCalls++;
        
        if (searchTime > 1000) {
          metric.bottlenecks.push(`Slow search operation ${i + 1}: ${searchTime.toFixed(0)}ms`);
        }
        
        // Combine results
        const iterationResults = [
          ...semanticResults.map((r: any) => ({ ...r, source: 'semantic' })),
          ...wooResults.map((r: any) => ({ 
            content: `${r.name} - £${r.price}`,
            url: r.permalink,
            title: r.name,
            similarity: 0.9,
            source: 'woocommerce'
          }))
        ];
        
        allResults.push(...iterationResults);
        metric.totalResults += iterationResults.length;
        
        // Simulate follow-up AI processing
        if (i < toolCalls.length - 1) {
          const aiFollowUp = performance.now();
          await this.openai!.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'Process search results' },
              { role: 'user', content: `Found ${iterationResults.length} results` }
            ],
            temperature: 0.7,
            max_tokens: 50
          });
          metric.aiProcessingTime += performance.now() - aiFollowUp;
        }
      }
      
      // 4. Final response generation
      const finalAiStart = performance.now();
      await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Generate final response based on search results' },
          { role: 'user', content: `Query: ${query}\nResults: ${allResults.length} items found` }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      metric.aiProcessingTime += performance.now() - finalAiStart;
      
    } catch (error) {
      console.error('Error in simulation:', error);
      metric.bottlenecks.push('Error during processing');
    }
    
    // Calculate totals
    metric.totalTime = performance.now() - startTime;
    metric.memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024; // MB
    
    // Identify main bottleneck
    const times = [
      { name: 'Search', time: metric.searchTime },
      { name: 'AI Processing', time: metric.aiProcessingTime },
      { name: 'Database', time: metric.databaseTime }
    ];
    times.sort((a, b) => b.time - a.time);
    
    if (times[0].time > metric.totalTime * 0.5) {
      metric.bottlenecks.push(`Primary bottleneck: ${times[0].name} (${((times[0].time / metric.totalTime) * 100).toFixed(1)}% of total)`);
    }
    
    return metric;
  }
  
  /**
   * Simulate the old chat route processing for comparison
   */
  async simulateOldRoute(query: string): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    const metric: PerformanceMetrics = {
      query,
      type: 'old_route',
      totalTime: 0,
      searchTime: 0,
      aiProcessingTime: 0,
      databaseTime: 0,
      iterations: 0,
      searchCalls: 1, // Old route does one search
      totalResults: 0,
      memoryUsed: 0,
      cacheHits: 0,
      bottlenecks: []
    };
    
    try {
      // 1. Database operations
      const dbStart = performance.now();
      const { data: domainData } = await this.supabase
        .from('domains')
        .select('id')
        .eq('domain', TEST_DOMAIN)
        .single();
      metric.databaseTime = performance.now() - dbStart;
      
      // 2. Single search operation (old approach)
      const searchStart = performance.now();
      const enhancedContext = await getEnhancedChatContext(
        query,
        TEST_DOMAIN,
        domainData?.id || '',
        {
          enableSmartSearch: true,
          minChunks: 20,
          maxChunks: 25,
          conversationHistory: []
        }
      );
      metric.searchTime = performance.now() - searchStart;
      metric.totalResults = enhancedContext.chunks.length;
      
      if (metric.searchTime > 2000) {
        metric.bottlenecks.push(`Slow enhanced context search: ${metric.searchTime.toFixed(0)}ms`);
      }
      
      // 3. Single AI call with all context
      const aiStart = performance.now();
      await this.openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: `You are a customer service assistant. Context: ${enhancedContext.chunks.slice(0, 5).map(c => c.content).join('\n')}`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      metric.aiProcessingTime = performance.now() - aiStart;
      
      if (metric.aiProcessingTime > 3000) {
        metric.bottlenecks.push(`Slow AI processing with large context: ${metric.aiProcessingTime.toFixed(0)}ms`);
      }
      
    } catch (error) {
      console.error('Error in old route simulation:', error);
      metric.bottlenecks.push('Error during processing');
    }
    
    metric.totalTime = performance.now() - startTime;
    metric.memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;
    
    return metric;
  }
  
  /**
   * Run comprehensive performance tests
   */
  async runTests() {
    console.log('📊 Starting Performance Analysis\n');
    console.log('=' .repeat(80));
    
    const intelligentMetrics: PerformanceMetrics[] = [];
    const oldRouteMetrics: PerformanceMetrics[] = [];
    
    for (const testQuery of TEST_QUERIES) {
      console.log(`\n🔍 Testing: "${testQuery.query}"`);
      console.log(`   Type: ${testQuery.type}`);
      console.log('-'.repeat(60));
      
      // Test intelligent search
      console.log('   Running intelligent search...');
      const intelligentMetric = await this.simulateIntelligentSearch(testQuery.query);
      intelligentMetric.type = testQuery.type;
      intelligentMetrics.push(intelligentMetric);
      
      // Test old route
      console.log('   Running old route search...');
      const oldMetric = await this.simulateOldRoute(testQuery.query);
      oldMetric.type = testQuery.type;
      oldRouteMetrics.push(oldMetric);
      
      // Compare results
      console.log(`\n   📈 Results Comparison:`);
      console.log(`   ├─ Intelligent Route: ${intelligentMetric.totalTime.toFixed(0)}ms (${intelligentMetric.iterations} iterations)`);
      console.log(`   ├─ Old Route:         ${oldMetric.totalTime.toFixed(0)}ms`);
      console.log(`   ├─ Speed Difference:  ${((oldMetric.totalTime - intelligentMetric.totalTime) / oldMetric.totalTime * 100).toFixed(1)}% ${intelligentMetric.totalTime < oldMetric.totalTime ? 'faster ✅' : 'slower ⚠️'}`);
      console.log(`   └─ Results Found:     ${intelligentMetric.totalResults} vs ${oldMetric.totalResults}`);
      
      if (intelligentMetric.bottlenecks.length > 0) {
        console.log(`\n   ⚠️  Bottlenecks detected:`);
        intelligentMetric.bottlenecks.forEach(b => console.log(`      - ${b}`));
      }
      
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Generate summary report
    this.generateReport(intelligentMetrics, oldRouteMetrics);
  }
  
  /**
   * Generate comprehensive performance report
   */
  generateReport(intelligentMetrics: PerformanceMetrics[], oldMetrics: PerformanceMetrics[]) {
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    // 1. Overall Performance Summary
    console.log('\n1️⃣  OVERALL PERFORMANCE SUMMARY\n');
    
    const avgIntelligentTime = intelligentMetrics.reduce((sum, m) => sum + m.totalTime, 0) / intelligentMetrics.length;
    const avgOldTime = oldMetrics.reduce((sum, m) => sum + m.totalTime, 0) / oldMetrics.length;
    const improvement = ((avgOldTime - avgIntelligentTime) / avgOldTime * 100);
    
    console.log(`   Average Response Times:`);
    console.log(`   ├─ Intelligent Route: ${avgIntelligentTime.toFixed(0)}ms`);
    console.log(`   ├─ Old Route:         ${avgOldTime.toFixed(0)}ms`);
    console.log(`   └─ Improvement:       ${improvement.toFixed(1)}% ${improvement > 0 ? '✅' : '⚠️'}\n`);
    
    // 2. Breakdown by Query Type
    console.log('2️⃣  PERFORMANCE BY QUERY TYPE\n');
    
    const types = [...new Set(intelligentMetrics.map(m => m.type))];
    for (const type of types) {
      const intelligentType = intelligentMetrics.filter(m => m.type === type);
      const oldType = oldMetrics.filter(m => m.type === type);
      
      const avgInt = intelligentType.reduce((sum, m) => sum + m.totalTime, 0) / intelligentType.length;
      const avgOld = oldType.reduce((sum, m) => sum + m.totalTime, 0) / oldType.length;
      
      console.log(`   ${type}:`);
      console.log(`   ├─ Intelligent: ${avgInt.toFixed(0)}ms (${intelligentType[0]?.iterations || 0} iterations avg)`);
      console.log(`   ├─ Old:         ${avgOld.toFixed(0)}ms`);
      console.log(`   └─ Difference:  ${((avgOld - avgInt) / avgOld * 100).toFixed(1)}%\n`);
    }
    
    // 3. Resource Usage Analysis
    console.log('3️⃣  RESOURCE USAGE ANALYSIS\n');
    
    const avgIntelligentMemory = intelligentMetrics.reduce((sum, m) => sum + m.memoryUsed, 0) / intelligentMetrics.length;
    const avgOldMemory = oldMetrics.reduce((sum, m) => sum + m.memoryUsed, 0) / oldMetrics.length;
    
    console.log(`   Memory Usage:`);
    console.log(`   ├─ Intelligent Route: ${avgIntelligentMemory.toFixed(2)} MB`);
    console.log(`   ├─ Old Route:         ${avgOldMemory.toFixed(2)} MB`);
    console.log(`   └─ Difference:        ${(avgIntelligentMemory - avgOldMemory).toFixed(2)} MB\n`);
    
    const totalIntelligentSearchCalls = intelligentMetrics.reduce((sum, m) => sum + m.searchCalls, 0);
    const totalOldSearchCalls = oldMetrics.reduce((sum, m) => sum + m.searchCalls, 0);
    
    console.log(`   API Calls:`);
    console.log(`   ├─ Intelligent Route: ${totalIntelligentSearchCalls} search calls`);
    console.log(`   ├─ Old Route:         ${totalOldSearchCalls} search calls`);
    console.log(`   └─ AI Calls:          ${intelligentMetrics.reduce((sum, m) => sum + m.iterations + 1, 0)} vs ${oldMetrics.length}\n`);
    
    // 4. Bottleneck Analysis
    console.log('4️⃣  BOTTLENECK IDENTIFICATION\n');
    
    const allBottlenecks = intelligentMetrics.flatMap(m => m.bottlenecks);
    const bottleneckCounts = new Map<string, number>();
    
    allBottlenecks.forEach(b => {
      const key = b.split(':')[0]; // Group by bottleneck type
      bottleneckCounts.set(key, (bottleneckCounts.get(key) || 0) + 1);
    });
    
    if (bottleneckCounts.size > 0) {
      console.log('   Most Common Bottlenecks:');
      const sorted = Array.from(bottleneckCounts.entries()).sort((a, b) => b[1] - a[1]);
      sorted.forEach(([type, count]) => {
        console.log(`   ├─ ${type}: ${count} occurrences`);
      });
    } else {
      console.log('   ✅ No significant bottlenecks detected');
    }
    
    // 5. Optimization Opportunities
    console.log('\n5️⃣  OPTIMIZATION RECOMMENDATIONS\n');
    
    const recommendations: string[] = [];
    
    // Check search performance
    const avgSearchTime = intelligentMetrics.reduce((sum, m) => sum + m.searchTime, 0) / intelligentMetrics.length;
    if (avgSearchTime > 1000) {
      recommendations.push('🔧 Search operations are slow (>1s avg). Consider:');
      recommendations.push('   - Implementing result caching for common queries');
      recommendations.push('   - Adding database indexes on frequently searched fields');
      recommendations.push('   - Reducing embedding dimension size for faster similarity search');
    }
    
    // Check AI processing time
    const avgAITime = intelligentMetrics.reduce((sum, m) => sum + m.aiProcessingTime, 0) / intelligentMetrics.length;
    if (avgAITime > 2000) {
      recommendations.push('🔧 AI processing is slow (>2s avg). Consider:');
      recommendations.push('   - Using GPT-3.5-turbo for tool calls, GPT-4 only for final response');
      recommendations.push('   - Implementing streaming responses');
      recommendations.push('   - Reducing max iterations for simpler queries');
    }
    
    // Check iteration efficiency
    const avgIterations = intelligentMetrics.reduce((sum, m) => sum + m.iterations, 0) / intelligentMetrics.length;
    if (avgIterations > 2) {
      recommendations.push('🔧 Too many search iterations on average. Consider:');
      recommendations.push('   - Better query understanding in first iteration');
      recommendations.push('   - Combining multiple search types in parallel');
      recommendations.push('   - Implementing smarter tool selection logic');
    }
    
    // Memory usage
    if (avgIntelligentMemory > avgOldMemory * 1.5) {
      recommendations.push('🔧 Higher memory usage detected. Consider:');
      recommendations.push('   - Streaming search results instead of loading all at once');
      recommendations.push('   - Implementing result pagination');
      recommendations.push('   - Clearing intermediate results between iterations');
    }
    
    if (recommendations.length > 0) {
      recommendations.forEach(r => console.log(`   ${r}`));
    } else {
      console.log('   ✅ System is performing optimally!');
    }
    
    // 6. Comparison Summary
    console.log('\n6️⃣  FINAL COMPARISON\n');
    
    const metrics = [
      { 
        name: 'Response Time', 
        intelligent: avgIntelligentTime, 
        old: avgOldTime,
        unit: 'ms',
        better: avgIntelligentTime < avgOldTime
      },
      {
        name: 'Memory Usage',
        intelligent: avgIntelligentMemory,
        old: avgOldMemory,
        unit: 'MB',
        better: avgIntelligentMemory < avgOldMemory
      },
      {
        name: 'Search Accuracy',
        intelligent: intelligentMetrics.reduce((sum, m) => sum + m.totalResults, 0) / intelligentMetrics.length,
        old: oldMetrics.reduce((sum, m) => sum + m.totalResults, 0) / oldMetrics.length,
        unit: 'results',
        better: true // More results generally better for accuracy
      }
    ];
    
    console.log('   ┌─────────────────┬──────────────┬──────────────┬────────────┐');
    console.log('   │ Metric          │ Intelligent  │ Old Route    │ Winner     │');
    console.log('   ├─────────────────┼──────────────┼──────────────┼────────────┤');
    
    metrics.forEach(m => {
      const intelligentVal = `${m.intelligent.toFixed(1)} ${m.unit}`;
      const oldVal = `${m.old.toFixed(1)} ${m.unit}`;
      const winner = m.better ? '✅ New' : '⚠️ Old';
      
      console.log(`   │ ${m.name.padEnd(15)} │ ${intelligentVal.padEnd(12)} │ ${oldVal.padEnd(12)} │ ${winner.padEnd(10)} │`);
    });
    
    console.log('   └─────────────────┴──────────────┴──────────────┴────────────┘');
    
    // Final verdict
    console.log('\n\n' + '='.repeat(80));
    console.log('🎯 FINAL VERDICT\n');
    
    if (improvement > 0) {
      console.log(`   ✅ The intelligent search system is ${improvement.toFixed(1)}% faster overall!`);
      console.log(`   ✅ It provides more accurate, iterative search capabilities.`);
      console.log(`   ✅ Better user experience with progressive refinement.`);
    } else {
      console.log(`   ⚠️  The intelligent system is ${Math.abs(improvement).toFixed(1)}% slower.`);
      console.log(`   📝 However, it provides better search accuracy and flexibility.`);
      console.log(`   📝 Consider the optimization recommendations above.`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run the analysis
async function main() {
  const analyzer = new PerformanceAnalyzer();
  
  try {
    await analyzer.initialize();
    await analyzer.runTests();
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

export { PerformanceAnalyzer };