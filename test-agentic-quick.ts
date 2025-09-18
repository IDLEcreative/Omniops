#!/usr/bin/env tsx

/**
 * Quick Agentic Search Test
 * Tests core agentic behaviors with shorter timeouts
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3000';
const SESSION_ID = uuidv4();

async function testChat(message: string, conversationId?: string) {
  console.log(`\n📤 Query: "${message}"`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat-intelligent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: SESSION_ID,
        conversation_id: conversationId,
        domain: 'thompsonseparts.co.uk',
        config: {
          ai: {
            maxSearchIterations: 3,
            searchTimeout: 5000
          }
        }
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Analyze the response for agentic behaviors
    const analysis = analyzeResponse(message, data);
    
    console.log(`📥 Response: ${data.message.substring(0, 200)}...`);
    console.log(`📊 Metadata:`, data.metadata || 'None');
    console.log(`🔍 Sources: ${data.sources?.length || 0} found`);
    console.log(`🤖 Agentic Score: ${analysis.score}/100`);
    console.log(`   ${analysis.evidence.join('\n   ')}`);
    
    return { ...data, agenticAnalysis: analysis };
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

function analyzeResponse(query: string, response: any): { score: number; evidence: string[] } {
  const evidence: string[] = [];
  let score = 0;
  
  // Check 1: Multiple search iterations (shows adaptive behavior)
  if (response.metadata?.searchCount > 5) {
    score += 20;
    evidence.push('✓ Multiple searches performed (adaptive behavior)');
  } else if (response.metadata?.searchCount > 0) {
    score += 10;
    evidence.push('⚬ Single search performed (basic tool use)');
  }
  
  // Check 2: Execution time suggests reasoning (>3s indicates multiple steps)
  if (response.metadata?.executionTime > 3000) {
    score += 15;
    evidence.push('✓ Extended processing time suggests reasoning');
  }
  
  // Check 3: Sources provided (shows information gathering)
  if (response.sources && response.sources.length > 0) {
    score += 15;
    evidence.push(`✓ ${response.sources.length} sources gathered`);
    
    // Bonus: Diverse relevance scores suggest ranking/evaluation
    const relevanceScores = response.sources.map((s: any) => s.relevance);
    const uniqueScores = new Set(relevanceScores).size;
    if (uniqueScores > 1) {
      score += 10;
      evidence.push('✓ Sources have varied relevance (quality assessment)');
    }
  }
  
  // Check 4: Response acknowledges uncertainty or limitations
  const uncertaintyPhrases = [
    "I couldn't find", "no results", "don't have", "unable to locate",
    "based on available", "from what I can see", "appears to"
  ];
  
  if (uncertaintyPhrases.some(phrase => response.message.toLowerCase().includes(phrase))) {
    score += 10;
    evidence.push('✓ Acknowledges search limitations (self-awareness)');
  }
  
  // Check 5: Response structure suggests synthesis
  if (response.message.includes('1.') || response.message.includes('•')) {
    score += 10;
    evidence.push('✓ Structured response (information synthesis)');
  }
  
  // Check 6: Specific answer to specific question
  if (query.toLowerCase().includes('how many') && /\d+/.test(response.message)) {
    score += 20;
    evidence.push('✓ Provides specific count (query understanding)');
  } else if (query.includes('?') && response.message.length > 100) {
    score += 10;
    evidence.push('✓ Detailed answer to question');
  }
  
  return { score, evidence };
}

async function runTests() {
  console.log(`
🔬 QUICK AGENTIC SEARCH TEST
=====================================
Testing: ${BASE_URL}/api/chat-intelligent
Domain: thompsonseparts.co.uk
`);

  const tests = [
    {
      name: "Test 1: Specific Product Search",
      query: "Do you have the Cifa K38XRZ pump?"
    },
    {
      name: "Test 2: Counting Query (Should trigger comprehensive search)",
      query: "How many Cifa products do you have?"
    },
    {
      name: "Test 3: Ambiguous Query (Should refine)",
      query: "pumps"
    },
    {
      name: "Test 4: No Results Expected (Should recognize failure)",
      query: "Do you have unicorn rainbow generators?"
    },
    {
      name: "Test 5: Complex Multi-Part Query",
      query: "What Cifa pumps do you have under £1000 that are currently in stock?"
    }
  ];

  let totalScore = 0;
  let conversationId: string | undefined;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${test.name}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = await testChat(test.query, conversationId);
    
    if (result) {
      conversationId = result.conversation_id;
      totalScore += result.agenticAnalysis.score;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const avgScore = totalScore / tests.length;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 FINAL AGENTIC ASSESSMENT`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Overall Score: ${avgScore.toFixed(1)}/100`);
  
  if (avgScore >= 70) {
    console.log(`🏆 Classification: HIGHLY AGENTIC`);
    console.log(`   System demonstrates autonomous reasoning and adaptation`);
  } else if (avgScore >= 40) {
    console.log(`⚡ Classification: PARTIALLY AGENTIC`);
    console.log(`   System shows some adaptive behaviors but limited reasoning`);
  } else {
    console.log(`🔧 Classification: TOOL-CALLING SYSTEM`);
    console.log(`   System primarily executes predetermined search patterns`);
  }
  
  console.log(`\n💡 Recommendations:`);
  
  if (avgScore < 30) {
    console.log(`   • Add iterative search refinement`);
    console.log(`   • Implement result quality assessment`);
    console.log(`   • Enable dynamic strategy selection`);
  } else if (avgScore < 60) {
    console.log(`   • Enhance query understanding and reformulation`);
    console.log(`   • Add confidence scoring to results`);
    console.log(`   • Implement learning from search patterns`);
  } else {
    console.log(`   • Consider adding memory across sessions`);
    console.log(`   • Implement predictive search strategies`);
    console.log(`   • Add explanation of reasoning process`);
  }
}

// Run the tests
runTests().catch(console.error);