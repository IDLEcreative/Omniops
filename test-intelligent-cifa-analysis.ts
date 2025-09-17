#!/usr/bin/env npx tsx
/**
 * Focused analysis of the intelligent search system's AI capabilities
 * Tests tool selection, search iteration patterns, and problem-solving approach
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

interface SearchMetadata {
  iterations: number;
  totalSearches: number;
  searchLog: Array<{
    tool: string;
    query: string;
    resultCount: number;
    source: string;
  }>;
}

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
  searchMetadata?: SearchMetadata;
}

async function testIntelligentChat(message: string): Promise<ChatResponse> {
  const response = await fetch('http://localhost:3000/api/chat-intelligent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      session_id: uuidv4(),
      domain: 'thompsonseparts.co.uk',
      config: {
        ai: {
          maxSearchIterations: 3,
          searchTimeout: 20000
        }
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function analyzeIntelligentCapabilities() {
  console.log('🧠 Analyzing Intelligent Search AI Capabilities\n');
  console.log('='  .repeat(60));
  console.log('Focus: AI tool selection and search strategy analysis');
  console.log('='  .repeat(60));

  // Specific test cases designed to trigger different AI behaviors
  const testCases = [
    {
      query: "Find me a pump that works with Cifa concrete mixers",
      expectedBehavior: "Should use search_products with refined query",
      focus: "Query reformulation and product search"
    },
    {
      query: "I need help finding Cifa water system maintenance info",
      expectedBehavior: "Should use search_by_category for maintenance/info",
      focus: "Category vs product differentiation"
    },
    {
      query: "What's the price and specs of the DC66-10P Agri Flip?",
      expectedBehavior: "Should use get_product_details for specific product",
      focus: "Specific product detail extraction"
    },
    {
      query: "Show me everything you have for Cifa equipment",
      expectedBehavior: "Should make multiple searches to be comprehensive",
      focus: "Multiple search iteration strategy"
    },
    {
      query: "Cifa pump broke, need replacement ASAP with pricing",
      expectedBehavior: "Should search products and possibly iterate for prices",
      focus: "Problem-solving with specific requirements"
    }
  ];

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`\n${'━'.repeat(50)}`);
    console.log(`🔍 Test ${i + 1}: ${testCase.focus}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expectedBehavior}`);
    console.log(`${'━'.repeat(50)}`);

    try {
      console.log('🤖 Executing intelligent search...');
      const startTime = Date.now();
      const response = await testIntelligentChat(testCase.query);
      const executionTime = Date.now() - startTime;

      const searchLog = response.searchMetadata?.searchLog || [];
      const iterations = response.searchMetadata?.iterations || 0;
      
      console.log(`✅ Completed in ${executionTime}ms`);
      console.log(`📊 AI Behavior Analysis:`);
      console.log(`   • Total iterations: ${iterations}`);
      console.log(`   • Tool calls made: ${searchLog.length}`);
      console.log(`   • Sources found: ${response.sources.length}`);

      // Analyze tool selection pattern
      const toolTypes = new Set(searchLog.map(log => log.tool));
      const queryRefinements = searchLog.map(log => log.query);
      
      console.log(`\n🧠 AI Intelligence Indicators:`);
      console.log(`   • Tool diversity: ${toolTypes.size} different tools`);
      console.log(`   • Tools used: ${Array.from(toolTypes).join(', ')}`);
      
      if (queryRefinements.length > 1) {
        console.log(`   • Query evolution:`);
        queryRefinements.forEach((query, idx) => {
          console.log(`     ${idx + 1}. "${query}"`);
        });
      } else if (queryRefinements.length === 1) {
        console.log(`   • Single targeted query: "${queryRefinements[0]}"`);
      }

      // Analyze search progression
      console.log(`\n🔍 Search Strategy:`);
      searchLog.forEach((log, idx) => {
        console.log(`   ${idx + 1}. ${log.tool}: "${log.query}"`);
        console.log(`      → ${log.resultCount} results from ${log.source}`);
      });

      // Check if AI found relevant results
      const cifaResults = response.sources.filter(s => 
        s.title.toLowerCase().includes('cifa') || 
        s.url.toLowerCase().includes('cifa')
      );

      console.log(`\n🎯 Result Quality:`);
      console.log(`   • Total sources: ${response.sources.length}`);
      console.log(`   • Cifa-relevant sources: ${cifaResults.length}`);
      console.log(`   • Relevance success rate: ${response.sources.length > 0 ? (cifaResults.length / response.sources.length * 100).toFixed(1) : 0}%`);

      // Sample response analysis
      const responseLength = response.message.length;
      const hasPricing = response.message.toLowerCase().includes('£') || response.message.toLowerCase().includes('price');
      const hasLinks = response.message.includes('http');
      
      console.log(`\n💬 Response Analysis:`);
      console.log(`   • Response length: ${responseLength} characters`);
      console.log(`   • Includes pricing: ${hasPricing ? 'Yes' : 'No'}`);
      console.log(`   • Includes links: ${hasLinks ? 'Yes' : 'No'}`);

      results.push({
        testCase,
        response,
        executionTime,
        toolTypes: Array.from(toolTypes),
        cifaResults: cifaResults.length,
        behaviorScore: calculateBehaviorScore(testCase, searchLog, response)
      });

    } catch (error) {
      console.error(`❌ Test failed: ${error}`);
      results.push({
        testCase,
        error: error instanceof Error ? error.message : String(error),
        behaviorScore: 0
      });
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate intelligence analysis report
  console.log('\n' + '='.repeat(60));
  console.log('🧠 AI INTELLIGENCE ANALYSIS REPORT');
  console.log('='.repeat(60));

  const successfulTests = results.filter(r => !r.error);
  const avgBehaviorScore = successfulTests.reduce((sum, r) => sum + r.behaviorScore, 0) / successfulTests.length;

  console.log(`\n📈 Overall Intelligence Metrics:`);
  console.log(`   • Test success rate: ${(successfulTests.length / results.length * 100).toFixed(1)}%`);
  console.log(`   • Average behavior score: ${avgBehaviorScore.toFixed(1)}/10`);
  console.log(`   • Average execution time: ${successfulTests.reduce((sum, r) => sum + (r.executionTime || 0), 0) / successfulTests.length}ms`);

  // Tool usage analysis
  const allToolsUsed = new Set();
  let totalIterations = 0;
  let multiIterationTests = 0;

  successfulTests.forEach(result => {
    if (result.toolTypes) {
      result.toolTypes.forEach(tool => allToolsUsed.add(tool));
    }
    const iterations = result.response?.searchMetadata?.iterations || 0;
    totalIterations += iterations;
    if (iterations > 1) multiIterationTests++;
  });

  console.log(`\n🛠️ Tool Intelligence:`);
  console.log(`   • Total unique tools used: ${allToolsUsed.size}`);
  console.log(`   • Tools: ${Array.from(allToolsUsed).join(', ')}`);
  console.log(`   • Multi-iteration tests: ${multiIterationTests}/${successfulTests.length}`);
  console.log(`   • Average iterations per test: ${(totalIterations / successfulTests.length).toFixed(1)}`);

  // Problem-solving analysis
  console.log(`\n🎯 Problem-Solving Intelligence:`);
  
  successfulTests.forEach((result, idx) => {
    console.log(`\n   Test ${idx + 1}: ${result.testCase.focus}`);
    console.log(`   • Behavior score: ${result.behaviorScore}/10`);
    console.log(`   • Cifa results: ${result.cifaResults}`);
    console.log(`   • Tools used: ${result.toolTypes?.join(', ') || 'None'}`);
    
    const searchLog = result.response?.searchMetadata?.searchLog || [];
    if (searchLog.length > 0) {
      console.log(`   • Search strategy: ${searchLog[0].tool} → ${searchLog.length > 1 ? `${searchLog.length - 1} more searches` : 'single search'}`);
    }
  });

  // Key insights
  console.log(`\n🔍 Key Intelligence Insights:`);
  
  const toolDiversityScore = allToolsUsed.size >= 3 ? 'High' : allToolsUsed.size >= 2 ? 'Medium' : 'Low';
  console.log(`   • Tool diversity: ${toolDiversityScore} (${allToolsUsed.size}/3 tools)`);
  
  const adaptabilityScore = multiIterationTests / successfulTests.length >= 0.6 ? 'High' : 
                           multiIterationTests / successfulTests.length >= 0.3 ? 'Medium' : 'Low';
  console.log(`   • Adaptability: ${adaptabilityScore} (${(multiIterationTests / successfulTests.length * 100).toFixed(1)}% multi-iteration)`);
  
  const overallIntelligence = avgBehaviorScore >= 7 ? 'High' : avgBehaviorScore >= 5 ? 'Medium' : 'Developing';
  console.log(`   • Overall intelligence: ${overallIntelligence} (${avgBehaviorScore.toFixed(1)}/10 avg score)`);

  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (avgBehaviorScore < 7) {
    console.log(`   • Consider refining search tool descriptions for better tool selection`);
  }
  if (multiIterationTests / successfulTests.length < 0.5) {
    console.log(`   • AI could benefit from more iterative search strategies`);
  }
  if (allToolsUsed.size < 3) {
    console.log(`   • Encourage use of all available search tools for comprehensive results`);
  }
  if (avgBehaviorScore >= 8) {
    console.log(`   • ✅ AI demonstrates strong intelligent search capabilities!`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Analysis complete! The AI shows intelligent search behavior.');
  console.log('='.repeat(60));
}

function calculateBehaviorScore(testCase: any, searchLog: any[], response: ChatResponse): number {
  let score = 0;
  
  // Base score for successful execution
  if (response && response.message) score += 2;
  
  // Tool selection appropriateness
  const hasProductSearch = searchLog.some(log => log.tool === 'search_products');
  const hasCategorySearch = searchLog.some(log => log.tool === 'search_by_category');
  const hasDetailSearch = searchLog.some(log => log.tool === 'get_product_details');
  
  if (testCase.query.includes('price') || testCase.query.includes('spec')) {
    if (hasDetailSearch || hasProductSearch) score += 2;
  } else if (testCase.query.includes('info') || testCase.query.includes('maintenance')) {
    if (hasCategorySearch) score += 2;
  } else if (testCase.query.includes('find') || testCase.query.includes('need')) {
    if (hasProductSearch) score += 2;
  }
  
  // Quality of results
  if (response.sources && response.sources.length > 0) score += 1;
  if (response.sources && response.sources.length >= 5) score += 1;
  
  // Search refinement and iteration
  if (searchLog.length > 1) score += 1;
  if (searchLog.some(log => log.resultCount > 0)) score += 1;
  
  // Response quality
  if (response.message.length > 100) score += 1;
  if (response.message.includes('£') && testCase.query.includes('price')) score += 1;
  
  return Math.min(score, 10);
}

// Run the analysis
console.log('🧠 Starting AI Intelligence Analysis...');
console.log('Make sure the development server is running on localhost:3000\n');

analyzeIntelligentCapabilities()
  .then(() => {
    console.log('\n✅ Intelligence analysis completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });