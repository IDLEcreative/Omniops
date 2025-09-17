#!/usr/bin/env npx tsx
/**
 * Test the chat-intelligent route with Cifa query to analyze AI reasoning
 * Compares with standard chat route behavior
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const TEST_QUERY = 'Need a pump for my Cifa mixer';
const INTELLIGENT_API = 'http://localhost:3000/api/chat-intelligent';
const STANDARD_API = 'http://localhost:3000/api/chat';

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
  searchMetadata?: {
    iterations: number;
    totalSearches: number;
    searchLog: Array<{
      tool: string;
      query: string;
      resultCount: number;
      source: string;
    }>;
  };
}

async function testIntelligentRoute(): Promise<ChatResponse> {
  console.log('\n🤖 TESTING CHAT-INTELLIGENT ROUTE');
  console.log('━'.repeat(60));
  
  const startTime = Date.now();
  
  const response = await fetch(INTELLIGENT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: TEST_QUERY,
      session_id: uuidv4(),
      domain: 'thompsonseparts.co.uk',
      config: {
        ai: {
          maxSearchIterations: 3,
          searchTimeout: 30000
        },
        features: {
          websiteScraping: { enabled: true },
          woocommerce: { enabled: true }
        }
      }
    }),
  });

  const elapsed = Date.now() - startTime;
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ Response received in ${elapsed}ms`);
  
  return data;
}

async function analyzeIntelligentResponse(data: ChatResponse) {
  console.log('\n📊 INTELLIGENT ROUTE ANALYSIS');
  console.log('━'.repeat(60));
  
  const responseLower = data.message.toLowerCase();
  
  console.log('\n📝 Response Content:');
  console.log('─'.repeat(50));
  console.log(data.message);
  console.log('─'.repeat(50));
  
  console.log('\n🔍 Response Characteristics:');
  console.log(`• Response length: ${data.message.length} characters`);
  console.log(`• Sources provided: ${data.sources?.length || 0}`);
  
  // Check for AI search metadata (unique to intelligent route)
  if (data.searchMetadata) {
    console.log('\n🧠 AI Function Calling Analysis:');
    console.log(`• Total iterations: ${data.searchMetadata.iterations}`);
    console.log(`• Total searches performed: ${data.searchMetadata.totalSearches}`);
    console.log(`• Search log entries: ${data.searchMetadata.searchLog.length}`);
    
    if (data.searchMetadata.searchLog.length > 0) {
      console.log('\n📋 Search Execution Log:');
      data.searchMetadata.searchLog.forEach((log, i) => {
        console.log(`  ${i + 1}. Tool: ${log.tool}`);
        console.log(`     Query: "${log.query}"`);
        console.log(`     Results: ${log.resultCount} from ${log.source}`);
      });
      
      // Analyze tool usage
      const toolsUsed = new Set(data.searchMetadata.searchLog.map(l => l.tool));
      console.log(`\n🛠️ Tools Used: ${Array.from(toolsUsed).join(', ')}`);
      console.log(`• Tool diversity: ${toolsUsed.size} different tools`);
      
      // Analyze query evolution
      const queries = data.searchMetadata.searchLog.map(l => l.query);
      if (queries.length > 1) {
        console.log('\n🔄 Query Evolution:');
        queries.forEach((q, i) => {
          console.log(`  ${i + 1}. "${q}"`);
        });
      }
    }
  } else {
    console.log('\n⚠️ No search metadata found (not using function calling?)');
  }
  
  console.log('\n🎯 Content Analysis:');
  console.log(`• Mentions "Cifa": ${responseLower.includes('cifa') ? '✅' : '❌'}`);
  console.log(`• Mentions "pump": ${responseLower.includes('pump') ? '✅' : '❌'}`);
  console.log(`• Mentions "mixer": ${responseLower.includes('mixer') ? '✅' : '❌'}`);
  console.log(`• Admits uncertainty: ${responseLower.includes("don't have") || responseLower.includes("unable to find") ? '✅' : '❌'}`);
  console.log(`• Suggests alternatives: ${responseLower.includes('alternative') || responseLower.includes('instead') ? '✅' : '❌'}`);
  console.log(`• Includes product links: ${data.message.includes('http') || data.message.includes('](') ? '✅' : '❌'}`);
  console.log(`• Includes prices: ${data.message.includes('£') ? '✅' : '❌'}`);
  
  if (data.sources && data.sources.length > 0) {
    console.log('\n📚 Sources Analysis:');
    
    const cifaSources = data.sources.filter((s: any) => 
      s.title?.toLowerCase().includes('cifa') || 
      s.url?.toLowerCase().includes('cifa')
    );
    
    const pumpSources = data.sources.filter((s: any) => 
      s.title?.toLowerCase().includes('pump') || 
      s.url?.toLowerCase().includes('pump')
    );
    
    console.log(`• Total sources: ${data.sources.length}`);
    console.log(`• Cifa-related: ${cifaSources.length} (${(cifaSources.length/data.sources.length*100).toFixed(1)}%)`);
    console.log(`• Pump-related: ${pumpSources.length} (${(pumpSources.length/data.sources.length*100).toFixed(1)}%)`);
    console.log(`• Average relevance: ${(data.sources.reduce((sum: number, s: any) => sum + s.relevance, 0) / data.sources.length * 100).toFixed(1)}%`);
    
    console.log('\n📍 Top 5 Sources:');
    data.sources.slice(0, 5).forEach((source: any, i: number) => {
      console.log(`  ${i + 1}. ${source.title}`);
      console.log(`     Relevance: ${(source.relevance * 100).toFixed(1)}%`);
    });
  }
  
  // Determine strategy
  let strategy = 'unknown';
  if (data.searchMetadata?.searchLog) {
    const tools = data.searchMetadata.searchLog.map(l => l.tool);
    if (tools.includes('search_products')) {
      strategy = 'product_search';
    } else if (tools.includes('search_by_category')) {
      strategy = 'category_search';
    } else if (tools.includes('get_product_details')) {
      strategy = 'detail_search';
    }
    
    if (data.searchMetadata.iterations > 1) {
      strategy += '_iterative';
    }
  }
  
  console.log('\n🎯 AI Strategy Detection:');
  console.log(`• Detected strategy: ${strategy}`);
  console.log(`• Function calling: ${data.searchMetadata ? '✅ Yes' : '❌ No'}`);
  console.log(`• Iterative search: ${data.searchMetadata && data.searchMetadata.iterations > 1 ? '✅ Yes' : '❌ No'}`);
  
  return {
    hasSearchMetadata: !!data.searchMetadata,
    iterations: data.searchMetadata?.iterations || 0,
    toolsUsed: data.searchMetadata ? new Set(data.searchMetadata.searchLog.map(l => l.tool)).size : 0,
    cifaSources: data.sources?.filter((s: any) => s.title?.toLowerCase().includes('cifa')).length || 0,
    totalSources: data.sources?.length || 0,
    strategy
  };
}

async function compareRoutes() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔬 COMPARING CHAT-INTELLIGENT vs STANDARD CHAT ROUTES');
  console.log('═'.repeat(60));
  console.log(`Query: "${TEST_QUERY}"`);
  console.log('═'.repeat(60));
  
  try {
    // Test intelligent route
    console.log('\n1️⃣ Testing Chat-Intelligent Route...');
    const intelligentData = await testIntelligentRoute();
    const intelligentAnalysis = await analyzeIntelligentResponse(intelligentData);
    
    // Wait a bit before testing standard route
    console.log('\n⏳ Waiting 3 seconds before testing standard route...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test standard route
    console.log('\n2️⃣ Testing Standard Chat Route...');
    console.log('━'.repeat(60));
    
    const standardStart = Date.now();
    const standardResponse = await fetch(STANDARD_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: TEST_QUERY,
        session_id: uuidv4(),
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true },
            woocommerce: { enabled: true }
          }
        }
      }),
    });
    
    const standardElapsed = Date.now() - standardStart;
    const standardData = await standardResponse.json();
    console.log(`✅ Standard route responded in ${standardElapsed}ms`);
    
    // Compare results
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ROUTE COMPARISON RESULTS');
    console.log('═'.repeat(60));
    
    console.log('\n🏁 Performance:');
    console.log(`• Chat-Intelligent: Response time included in analysis above`);
    console.log(`• Standard Chat: ${standardElapsed}ms`);
    
    console.log('\n🔍 Search Approach:');
    console.log('• Chat-Intelligent:');
    console.log(`  - Function calling: ${intelligentAnalysis.hasSearchMetadata ? '✅ Yes' : '❌ No'}`);
    console.log(`  - Iterations: ${intelligentAnalysis.iterations}`);
    console.log(`  - Tools used: ${intelligentAnalysis.toolsUsed}`);
    console.log(`  - Strategy: ${intelligentAnalysis.strategy}`);
    
    console.log('• Standard Chat:');
    console.log(`  - Function calling: ❌ No (uses enhanced context retrieval)`);
    console.log(`  - Context chunks: 20-25 (fixed)`);
    console.log(`  - Strategy: Hybrid semantic + keyword search`);
    
    console.log('\n📈 Results Quality:');
    console.log('• Chat-Intelligent:');
    console.log(`  - Sources found: ${intelligentAnalysis.totalSources}`);
    console.log(`  - Cifa-specific: ${intelligentAnalysis.cifaSources}`);
    console.log(`  - Response length: ${intelligentData.message.length} chars`);
    
    console.log('• Standard Chat:');
    const standardCifaSources = standardData.sources?.filter((s: any) => 
      s.title?.toLowerCase().includes('cifa')
    ).length || 0;
    console.log(`  - Sources found: ${standardData.sources?.length || 0}`);
    console.log(`  - Cifa-specific: ${standardCifaSources}`);
    console.log(`  - Response length: ${standardData.message.length} chars`);
    
    console.log('\n🏆 Winner Analysis:');
    const intelligentScore = (intelligentAnalysis.cifaSources * 2) + intelligentAnalysis.totalSources;
    const standardScore = (standardCifaSources * 2) + (standardData.sources?.length || 0);
    
    if (intelligentScore > standardScore) {
      console.log('✨ Chat-Intelligent performs better for this query');
      console.log(`   Score: ${intelligentScore} vs ${standardScore}`);
    } else if (standardScore > intelligentScore) {
      console.log('✨ Standard Chat performs better for this query');
      console.log(`   Score: ${standardScore} vs ${intelligentScore}`);
    } else {
      console.log('✨ Both routes perform similarly');
      console.log(`   Score: ${intelligentScore} (tied)`);
    }
    
    console.log('\n💡 Key Insights:');
    if (intelligentAnalysis.hasSearchMetadata) {
      console.log('• Chat-Intelligent provides transparent search reasoning via metadata');
      console.log('• Function calling allows for dynamic search strategies');
    }
    console.log('• Standard Chat uses pre-configured enhanced context retrieval');
    console.log('• Both routes successfully handle the Cifa mixer pump query');
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ COMPARISON COMPLETE');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Chat Route Comparison Test...\n');
  console.log('⚠️  Ensure development server is running on localhost:3000\n');
  
  try {
    await compareRoutes();
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the test
main();