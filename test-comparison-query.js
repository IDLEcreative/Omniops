#!/usr/bin/env node

/**
 * Test the specific comparison query about mixer drums
 */

import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3001';
const SESSION_ID = uuidv4();

async function testComparisonQuery() {
  console.log('🔬 Testing Comparison Query: "What\'s the difference between 1000L and 2000L mixer drums?"');
  console.log('=====================================');
  
  const query = "What's the difference between your 1000L and 2000L mixer drums?";
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/chat-intelligent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: SESSION_ID,
        domain: 'thompsonseparts.co.uk',
        config: {
          ai: {
            maxSearchIterations: 3,
            searchTimeout: 10000
          }
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    console.log(`\n📤 Query: "${query}"`);
    console.log(`📥 Response Time: ${responseTime}ms`);
    console.log(`📊 Metadata:`, data.metadata || 'None');
    console.log(`🔍 Sources: ${data.sources?.length || 0} found`);
    console.log(`\n📝 Response:`);
    console.log(data.message);
    
    if (data.sources && data.sources.length > 0) {
      console.log(`\n🔗 Sources Found:`);
      data.sources.forEach((source, idx) => {
        console.log(`  ${idx + 1}. ${source.title} (relevance: ${source.relevance?.toFixed(2) || 'N/A'})`);
        console.log(`     ${source.url}`);
      });
    }
    
    // Analyze agentic behavior
    console.log(`\n🤖 Agentic Analysis:`);
    const searchCount = data.metadata?.searchCount || 0;
    console.log(`   Search Iterations: ${searchCount}`);
    console.log(`   Execution Time: ${data.metadata?.executionTime || responseTime}ms`);
    
    // Check for comparison-specific behaviors
    const responseText = data.message.toLowerCase();
    const hasComparison = responseText.includes('difference') || 
                          responseText.includes('compare') || 
                          responseText.includes('versus') ||
                          responseText.includes('1000l') && responseText.includes('2000l');
    
    const hasBothTerms = responseText.includes('1000') && responseText.includes('2000');
    const hasMultipleSearches = searchCount > 1;
    
    console.log(`   Contains Comparison Language: ${hasComparison ? '✅' : '❌'}`);
    console.log(`   References Both Terms (1000L & 2000L): ${hasBothTerms ? '✅' : '❌'}`);
    console.log(`   Multiple Search Iterations: ${hasMultipleSearches ? '✅' : '❌'}`);
    
    if (hasMultipleSearches) {
      console.log(`   🎯 GOOD: System performed multiple searches for comparison`);
    } else {
      console.log(`   ⚠️  ISSUE: System only performed ${searchCount} search(es) - may not be truly comparing`);
    }
    
    if (!hasBothTerms) {
      console.log(`   ⚠️  ISSUE: Response doesn't reference both 1000L and 2000L - may not have found comparison data`);
    }
    
    if (data.sources?.length === 0) {
      console.log(`   ❌ CRITICAL: No sources found - system likely has no data to compare`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Also test with the optimized intelligent endpoint
async function testWithOptimizedEndpoint() {
  console.log('\n🔬 Testing with Optimized Intelligent Endpoint');
  console.log('=====================================');
  
  const query = "What's the difference between your 1000L and 2000L mixer drums?";
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/chat-intelligent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: SESSION_ID + '_opt',
        domain: 'thompsonseparts.co.uk',
        config: {
          ai: {
            maxSearchIterations: 3,
            searchTimeout: 10000
          }
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    console.log(`📊 Optimized Response Time: ${responseTime}ms`);
    console.log(`🔍 Sources: ${data.sources?.length || 0} found`);
    console.log(`📈 Search Count: ${data.metadata?.searchCount || 0}`);
    
    if (data.metadata?.searchCount > 1) {
      console.log(`✅ Multiple searches performed - shows iterative behavior`);
    } else {
      console.log(`⚠️  Single search only - limited iterative behavior`);
    }
    
  } catch (error) {
    console.error(`❌ Error with optimized endpoint: ${error.message}`);
  }
}

async function runTests() {
  await testComparisonQuery();
  await testWithOptimizedEndpoint();
  
  console.log('\n📋 Summary:');
  console.log('- Comparison queries require multiple searches to find both products');
  console.log('- Current system should search for "1000L mixer drum" and "2000L mixer drum" separately');
  console.log('- Success depends on having actual product data in the database');
  console.log('- Check if maxSearchIterations is being enforced correctly');
}

runTests().catch(console.error);