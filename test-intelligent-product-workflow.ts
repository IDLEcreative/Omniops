#!/usr/bin/env npx tsx
/*
 * Comprehensive Test for Intelligent Chat Product Querying Workflow
 * ==================================================================
 * 
 * This test analyzes how the intelligent chat agent:
 * 1. Interprets user queries about products
 * 2. Uses multiple tools in parallel for comprehensive search
 * 3. Gathers and processes search results
 * 4. Formulates context-aware responses
 * 
 * The test provides detailed telemetry and reasoning traces to understand
 * the agent's decision-making process.
 */

import { createServiceRoleClient } from './lib/supabase-server';
import { config } from 'dotenv';
import chalk from 'chalk';

// Load environment
config({ path: '.env.local' });

// Terminal colors
const colors = {
  header: chalk.cyan.bold,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  dim: chalk.gray,
  bright: chalk.white.bold,
  searchQuery: chalk.magenta,
  toolCall: chalk.yellow.bold,
  resultCount: chalk.green.bold,
  reasoning: chalk.cyan,
};

// Test configuration
const TEST_CONFIG = {
  apiUrl: 'http://localhost:3000/api/chat-intelligent',
  domain: 'thompsonseparts.co.uk',
  sessionId: `test-workflow-${Date.now()}`,
  detailedLogging: true,
};

// Test cases for comprehensive product search testing
const TEST_QUERIES = [
  {
    name: 'Brand Search - Cifa',
    query: 'Show me all Cifa products',
    expectedBehavior: {
      toolsUsed: ['search_products', 'search_by_category'],
      minSearches: 2,
      expectMultipleVariations: true,
      expectedPatterns: ['Cifa', 'pump', 'hydraulic'],
    },
  },
  {
    name: 'Generic Product Search',
    query: 'I need a hydraulic pump',
    expectedBehavior: {
      toolsUsed: ['search_products', 'search_by_category'],
      minSearches: 2,
      expectBroadSearch: true,
      expectedPatterns: ['hydraulic', 'pump'],
    },
  },
  {
    name: 'Specific Model Search',
    query: 'Do you have the DC66-10P Agri Flip pump?',
    expectedBehavior: {
      toolsUsed: ['search_products', 'get_product_details'],
      minSearches: 2,
      expectSpecificSearch: true,
      expectedPatterns: ['DC66-10P', 'Agri Flip'],
    },
  },
  {
    name: 'Category Browse',
    query: 'What types of pumps do you have available?',
    expectedBehavior: {
      toolsUsed: ['search_by_category', 'search_products'],
      minSearches: 2,
      expectCategorySearch: true,
      expectedPatterns: ['pump', 'hydraulic', 'water'],
    },
  },
  {
    name: 'Price Query',
    query: 'Show me pumps under £500',
    expectedBehavior: {
      toolsUsed: ['search_products'],
      minSearches: 1,
      expectPriceFilter: true,
      expectedPatterns: ['pump', 'price'],
    },
  },
];

// Analysis class for tracking agent behavior
class WorkflowAnalyzer {
  private startTime: number;
  private iterations: number = 0;
  private toolCalls: Array<{
    tool: string;
    query: string;
    timestamp: number;
    resultCount: number;
    source: string;
    duration?: number;
  }> = [];
  private searchPatterns: Map<string, number> = new Map();
  private uniqueProducts: Set<string> = new Set();
  private parallelExecutions: Array<{
    tools: string[];
    timestamp: number;
    duration: number;
  }> = [];

  constructor() {
    this.startTime = Date.now();
  }

  recordToolCall(tool: string, query: string, resultCount: number, source: string) {
    const timestamp = Date.now();
    this.toolCalls.push({
      tool,
      query,
      timestamp,
      resultCount,
      source,
    });

    // Track search patterns
    const words = query.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        this.searchPatterns.set(word, (this.searchPatterns.get(word) || 0) + 1);
      }
    });
  }

  recordParallelExecution(tools: string[], duration: number) {
    this.parallelExecutions.push({
      tools,
      timestamp: Date.now(),
      duration,
    });
  }

  recordIteration() {
    this.iterations++;
  }

  recordProduct(productName: string) {
    this.uniqueProducts.add(productName);
  }

  getAnalysis() {
    const totalDuration = Date.now() - this.startTime;
    const totalResults = this.toolCalls.reduce((sum, call) => sum + call.resultCount, 0);
    
    return {
      duration: totalDuration,
      iterations: this.iterations,
      totalToolCalls: this.toolCalls.length,
      totalResults,
      uniqueProducts: this.uniqueProducts.size,
      toolsUsed: Array.from(new Set(this.toolCalls.map(c => c.tool))),
      searchPatterns: Array.from(this.searchPatterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      parallelExecutions: this.parallelExecutions,
      averageResultsPerSearch: totalResults / (this.toolCalls.length || 1),
      sourcesUsed: Array.from(new Set(this.toolCalls.map(c => c.source))),
      timelineBreakdown: this.getTimelineBreakdown(),
    };
  }

  private getTimelineBreakdown() {
    return this.toolCalls.map(call => ({
      time: `+${call.timestamp - this.startTime}ms`,
      tool: call.tool,
      query: call.query.substring(0, 50),
      results: call.resultCount,
      source: call.source,
    }));
  }

  printAnalysis(queryName: string) {
    const analysis = this.getAnalysis();
    
    console.log('\n' + colors.header('═'.repeat(80)));
    console.log(colors.header(`WORKFLOW ANALYSIS: ${queryName}`));
    console.log(colors.header('═'.repeat(80)));

    // Performance Metrics
    console.log('\n' + colors.bright('📊 Performance Metrics:'));
    console.log(`  • Total Duration: ${colors.success(`${analysis.duration}ms`)}`);
    console.log(`  • Iterations: ${colors.info(analysis.iterations)}`);
    console.log(`  • Tool Calls: ${colors.info(analysis.totalToolCalls)}`);
    console.log(`  • Parallel Executions: ${colors.info(analysis.parallelExecutions.length)}`);

    // Search Results
    console.log('\n' + colors.bright('🔍 Search Results:'));
    console.log(`  • Total Results Found: ${colors.resultCount(analysis.totalResults)}`);
    console.log(`  • Unique Products: ${colors.resultCount(analysis.uniqueProducts)}`);
    console.log(`  • Average Results/Search: ${colors.info(analysis.averageResultsPerSearch.toFixed(1))}`);
    console.log(`  • Data Sources: ${colors.info(analysis.sourcesUsed.join(', '))}`);

    // Tools Usage
    console.log('\n' + colors.bright('🛠️  Tools Used:'));
    analysis.toolsUsed.forEach(tool => {
      const callsForTool = this.toolCalls.filter(c => c.tool === tool);
      console.log(`  • ${colors.toolCall(tool)}: ${callsForTool.length} calls, ${callsForTool.reduce((sum, c) => sum + c.resultCount, 0)} results`);
    });

    // Search Patterns
    console.log('\n' + colors.bright('🔤 Search Patterns (Top Keywords):'));
    analysis.searchPatterns.slice(0, 5).forEach(([word, count]) => {
      console.log(`  • "${colors.searchQuery(word)}": ${count} occurrences`);
    });

    // Parallel Execution Analysis
    if (analysis.parallelExecutions.length > 0) {
      console.log('\n' + colors.bright('⚡ Parallel Execution:'));
      analysis.parallelExecutions.forEach((exec, i) => {
        console.log(`  ${i + 1}. ${colors.success(`${exec.tools.length} tools`)} executed in ${colors.info(`${exec.duration}ms`)}`);
        console.log(`     Tools: ${exec.tools.join(', ')}`);
      });
    }

    // Timeline
    console.log('\n' + colors.bright('⏱️  Execution Timeline:'));
    analysis.timelineBreakdown.forEach(event => {
      console.log(`  ${colors.dim(event.time)} - ${colors.toolCall(event.tool)}: "${colors.searchQuery(event.query)}" → ${colors.resultCount(`${event.results} results`)} (${event.source})`);
    });
  }
}

// Main test function
async function testIntelligentChatWorkflow(query: string, queryName: string): Promise<void> {
  console.log('\n' + colors.header('▶ Starting Test: ' + queryName));
  console.log(colors.info(`Query: "${query}"`));
  
  const analyzer = new WorkflowAnalyzer();
  
  try {
    // Make the API request with detailed tracking
    const response = await fetch(TEST_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: TEST_CONFIG.sessionId,
        domain: TEST_CONFIG.domain,
        config: {
          ai: {
            maxSearchIterations: 5,
            searchTimeout: 15000,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract and analyze search metadata
    if (data.searchMetadata) {
      const metadata = data.searchMetadata;
      
      // Record iterations
      for (let i = 0; i < metadata.iterations; i++) {
        analyzer.recordIteration();
      }

      // Record tool calls
      if (metadata.searchLog) {
        metadata.searchLog.forEach((search: any) => {
          analyzer.recordToolCall(
            search.tool,
            search.query,
            search.resultCount,
            search.source
          );
        });
      }

      // Estimate parallel executions (searches at same iteration)
      const searchesByIteration: Map<number, any[]> = new Map();
      metadata.searchLog?.forEach((search: any, index: number) => {
        const iteration = Math.floor(index / 3); // Estimate based on typical parallel execution
        if (!searchesByIteration.has(iteration)) {
          searchesByIteration.set(iteration, []);
        }
        searchesByIteration.get(iteration)!.push(search);
      });

      searchesByIteration.forEach(searches => {
        if (searches.length > 1) {
          analyzer.recordParallelExecution(
            searches.map(s => s.tool),
            100 * searches.length // Estimated duration
          );
        }
      });
    }

    // Extract product information from sources
    if (data.sources) {
      data.sources.forEach((source: any) => {
        if (source.title) {
          analyzer.recordProduct(source.title);
        }
      });
    }

    // Print the analysis
    analyzer.printAnalysis(queryName);

    // Print the response
    console.log('\n' + colors.bright('💬 Agent Response:'));
    console.log(colors.dim('─'.repeat(80)));
    console.log(data.message);
    console.log(colors.dim('─'.repeat(80)));

    // Validate against expected behavior
    const testCase = TEST_QUERIES.find(tc => tc.name === queryName);
    if (testCase) {
      console.log('\n' + colors.bright('✅ Validation:'));
      const analysis = analyzer.getAnalysis();
      
      // Check tools used
      const expectedTools = testCase.expectedBehavior.toolsUsed;
      const usedTools = analysis.toolsUsed;
      const hasExpectedTools = expectedTools.every(tool => usedTools.includes(tool));
      console.log(`  • Expected tools used: ${hasExpectedTools ? colors.success('✓') : colors.error('✗')} (${usedTools.join(', ')})`);
      
      // Check minimum searches
      const meetsMinSearches = analysis.totalToolCalls >= testCase.expectedBehavior.minSearches;
      console.log(`  • Minimum searches (${testCase.expectedBehavior.minSearches}): ${meetsMinSearches ? colors.success('✓') : colors.error('✗')} (${analysis.totalToolCalls} searches)`);
      
      // Check search patterns
      const searchWords = Array.from(analysis.searchPatterns.keys());
      const hasExpectedPatterns = testCase.expectedBehavior.expectedPatterns.some(pattern => 
        searchWords.some(word => typeof word === 'string' && word.includes(pattern.toLowerCase()))
      );
      console.log(`  • Expected search patterns: ${hasExpectedPatterns ? colors.success('✓') : colors.error('✗')}`);
      
      // Check parallel execution
      const hasParallelExecution = analysis.parallelExecutions.length > 0;
      console.log(`  • Parallel execution: ${hasParallelExecution ? colors.success('✓') : colors.error('✗')}`);
    }

  } catch (error) {
    console.error(colors.error('\n❌ Test failed:'), error);
  }
}

// Database telemetry analysis
async function analyzeDatabaseTelemetry(sessionId: string) {
  console.log('\n' + colors.header('📊 DATABASE TELEMETRY ANALYSIS'));
  console.log(colors.header('═'.repeat(80)));
  
  try {
    const supabase = await createServiceRoleClient();
    
    // Get telemetry data
    const { data: telemetryData, error } = await supabase
      .from('chat_telemetry')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(colors.error('Failed to fetch telemetry:'), error);
      return;
    }

    if (!telemetryData || telemetryData.length === 0) {
      console.log(colors.warning('No telemetry data found for this session'));
      return;
    }

    // Analyze telemetry
    console.log(colors.info(`\nFound ${telemetryData.length} telemetry entries`));
    
    telemetryData.forEach((entry, index) => {
      console.log(`\n${colors.bright(`Entry ${index + 1}:`)} ${colors.dim(new Date(entry.created_at).toISOString())}`);
      
      if (entry.metadata) {
        const metadata = entry.metadata as any;
        
        if (metadata.iterations) {
          console.log(`  • Iterations: ${colors.info(metadata.iterations)}`);
        }
        
        if (metadata.searches) {
          console.log(`  • Searches performed: ${colors.info(metadata.searches.length)}`);
          metadata.searches.forEach((search: any) => {
            console.log(`    - ${colors.toolCall(search.tool)}: "${colors.searchQuery(search.query)}" → ${colors.resultCount(`${search.resultCount} results`)}`);
          });
        }
        
        if (metadata.totalTokens) {
          console.log(`  • Total tokens: ${colors.info(metadata.totalTokens)}`);
          console.log(`  • Estimated cost: ${colors.success(`$${metadata.estimatedCost?.toFixed(4) || '0.0000'}`)}`);
        }
      }
    });
    
  } catch (error) {
    console.error(colors.error('Database analysis failed:'), error);
  }
}

// Main execution
async function main() {
  console.log(colors.header('\n🚀 INTELLIGENT CHAT PRODUCT WORKFLOW TEST'));
  console.log(colors.header('Testing comprehensive product querying and agent reasoning'));
  console.log(colors.dim(`Session ID: ${TEST_CONFIG.sessionId}`));
  console.log(colors.dim(`API URL: ${TEST_CONFIG.apiUrl}`));
  console.log(colors.dim(`Domain: ${TEST_CONFIG.domain}`));
  
  // Run selected test cases
  const testCasesToRun = process.argv.slice(2);
  const casesToExecute = testCasesToRun.length > 0 
    ? TEST_QUERIES.filter(tc => testCasesToRun.some(arg => tc.name.toLowerCase().includes(arg.toLowerCase())))
    : TEST_QUERIES;

  if (casesToExecute.length === 0) {
    console.log(colors.warning('\nNo matching test cases found. Available cases:'));
    TEST_QUERIES.forEach(tc => console.log(`  • ${tc.name}`));
    return;
  }

  console.log(colors.info(`\n📝 Running ${casesToExecute.length} test case(s)`));

  for (const testCase of casesToExecute) {
    await testIntelligentChatWorkflow(testCase.query, testCase.name);
    
    // Add delay between tests
    if (casesToExecute.indexOf(testCase) < casesToExecute.length - 1) {
      console.log(colors.dim('\n⏳ Waiting 2 seconds before next test...'));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Analyze database telemetry
  await analyzeDatabaseTelemetry(TEST_CONFIG.sessionId);

  // Summary
  console.log('\n' + colors.header('═'.repeat(80)));
  console.log(colors.header('TEST WORKFLOW COMPLETE'));
  console.log(colors.header('═'.repeat(80)));
  console.log(colors.success(`✓ Executed ${casesToExecute.length} test case(s)`));
  console.log(colors.info('Review the analysis above to understand:'));
  console.log('  1. How the agent interprets queries');
  console.log('  2. Which tools are used and in what order');
  console.log('  3. How many products are found');
  console.log('  4. Whether searches are executed in parallel');
  console.log('  5. The agent\'s response quality');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(colors.error('\n❌ Unhandled error:'), error);
  process.exit(1);
});

// Run the test
main().catch(error => {
  console.error(colors.error('\n❌ Fatal error:'), error);
  process.exit(1);
});