#!/usr/bin/env node

/**
 * Test iteration behavior with queries that should find results
 */

import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3001';
const SESSION_ID = uuidv4();

async function testQuery(query, description) {
  console.log(`\n🔬 ${description}`);
  console.log('='.repeat(60));
  console.log(`Query: "${query}"`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/chat-intelligent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: SESSION_ID + Math.random(),
        domain: 'thompsonseparts.co.uk',
        config: {
          ai: {
            maxSearchIterations: 5, // Allow more iterations
            searchTimeout: 10000
          }
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    console.log(`Response Time: ${responseTime}ms`);
    console.log(`Metadata:`, data.metadata || {});
    console.log(`Sources Found: ${data.sources?.length || 0}`);
    
    if (data.sources?.length > 0) {
      console.log(`Source Titles: ${data.sources.map(s => s.title).join(', ')}`);
    }
    
    // Analyze for agentic behavior
    const searchCount = data.metadata?.searchCount || 0;
    const executionTime = data.metadata?.executionTime || responseTime;
    
    console.log(`\n🤖 Agentic Analysis:`);
    console.log(`   Search Count (by results): ${searchCount}`);
    console.log(`   Execution Time: ${executionTime}ms`);
    console.log(`   Avg Time per Search: ${searchCount > 0 ? Math.round(executionTime / searchCount) : 'N/A'}ms`);
    
    if (searchCount > 1) {
      console.log(`   ✅ Multiple searches performed - shows iterative behavior`);
    } else if (searchCount === 1) {
      console.log(`   ⚬ Single search performed - basic tool use`);
    } else {
      console.log(`   ❌ No searches recorded - potential telemetry issue`);
    }
    
    return {
      query,
      searchCount,
      sourceCount: data.sources?.length || 0,
      executionTime,
      responseTime
    };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

async function runIterationTests() {
  console.log('🔬 ITERATION BEHAVIOR ANALYSIS');
  console.log('=====================================');
  
  const tests = [
    {
      query: "Show me all your products", 
      description: "Broad Query (should find many results)"
    },
    {
      query: "Do you have brake pads?", 
      description: "Product Category Query"
    },
    {
      query: "What pumps do you have?", 
      description: "Another Product Category Query"
    },
    {
      query: "Compare your hydraulic pumps with electric pumps", 
      description: "Comparison Query (should trigger multiple searches)"
    },
    {
      query: "Find me parts for construction equipment", 
      description: "Broad Category Query"
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testQuery(test.query, test.description);
    if (result) {
      results.push(result);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 SUMMARY ANALYSIS');
  console.log('=====================================');
  
  const avgSearchCount = results.reduce((sum, r) => sum + r.searchCount, 0) / results.length;
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  const testsWithMultipleSearches = results.filter(r => r.searchCount > 1).length;
  const testsWithResults = results.filter(r => r.sourceCount > 0).length;
  
  console.log(`Average Search Count: ${avgSearchCount.toFixed(1)}`);
  console.log(`Average Execution Time: ${Math.round(avgExecutionTime)}ms`);
  console.log(`Tests with Multiple Searches: ${testsWithMultipleSearches}/${results.length}`);
  console.log(`Tests with Results Found: ${testsWithResults}/${results.length}`);
  
  console.log('\n🔍 KEY FINDINGS:');
  
  if (avgSearchCount > 1.5) {
    console.log('✅ System shows good iterative search behavior');
  } else if (avgSearchCount > 0.5) {
    console.log('⚬ System shows basic search behavior');
  } else {
    console.log('❌ System shows limited search behavior or telemetry issues');
  }
  
  if (testsWithResults < results.length * 0.5) {
    console.log('⚠️  Many queries found no results - may indicate database/indexing issues');
  }
  
  if (avgExecutionTime > 10000) {
    console.log('⚠️  High execution times - may indicate performance issues');
  }
  
  console.log('\n📝 DETAILED RESULTS:');
  results.forEach(r => {
    console.log(`"${r.query.substring(0, 40)}..." → ${r.searchCount} searches, ${r.sourceCount} results, ${r.executionTime}ms`);
  });
}

runIterationTests().catch(console.error);