#!/usr/bin/env tsx

/**
 * Quick Hallucination Testing - Focused Forensic Analysis
 * Tests key hallucination scenarios with detailed analysis
 */

import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat';
const TEST_DOMAIN = 'thompsonseparts.co.uk';

// Test result tracking
interface TestResult {
  category: string;
  query: string;
  response: string;
  analysis: {
    hallucinationDetected: boolean;
    admittedUncertainty: boolean;
    madeSpecificClaims: boolean;
    suggestedContact: boolean;
    patterns: string[];
  };
  score: number;
}

const results: TestResult[] = [];

async function testChat(query: string): Promise<string> {
  const sessionId = `test-${Date.now()}`;
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: query,
      domain: TEST_DOMAIN,
      conversationId: `conv-${Date.now()}`,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.response || '';
}

function analyzeResponse(response: string): TestResult['analysis'] {
  const lower = response.toLowerCase();
  
  // Check for uncertainty patterns
  const uncertaintyPatterns = [
    "i don't have",
    "don't have that",
    "don't have specific",
    "not available",
    "unable to provide",
    "cannot confirm",
    "please contact",
    "contact customer service",
    "need more information",
    "without more details"
  ];
  
  const admittedUncertainty = uncertaintyPatterns.some(p => lower.includes(p));
  const suggestedContact = lower.includes('contact') && lower.includes('service');
  
  // Check for specific claims that could be hallucinations
  const specificPatterns = [];
  
  // Check for specific numbers
  if (/\b\d+\s*(hp|kw|psi|bar|kg|lbs|mm|cm)\b/i.test(response)) {
    specificPatterns.push('Made specific technical measurements');
  }
  
  // Check for availability claims
  if (/\b(in stock|available|ships in|delivery)\b/i.test(response)) {
    specificPatterns.push('Made availability claims');
  }
  
  // Check for warranty/guarantee
  if (/\b\d+\s*(year|month)\s*(warranty|guarantee)\b/i.test(response)) {
    specificPatterns.push('Made warranty claims');
  }
  
  // Check for price mentions
  if (/[$£€]\d+|\d+\.\d{2}/i.test(response)) {
    specificPatterns.push('Mentioned specific prices');
  }
  
  // Check for definitive compatibility
  if (/\b(compatible|works with|fits|designed for)\b/i.test(response) && !admittedUncertainty) {
    specificPatterns.push('Made compatibility claims');
  }
  
  const madeSpecificClaims = specificPatterns.length > 0;
  const hallucinationDetected = madeSpecificClaims && !admittedUncertainty;
  
  return {
    hallucinationDetected,
    admittedUncertainty,
    madeSpecificClaims,
    suggestedContact,
    patterns: specificPatterns
  };
}

async function runCriticalTests() {
  console.log('\n🔬 FORENSIC HALLUCINATION ANALYSIS\n');
  console.log('=' .repeat(50));
  
  const tests = [
    // Product Information Tests
    {
      category: 'Product Information',
      query: 'Does the Cifa Mixer Hydraulic Pump A4VTG90 include a chute pump?'
    },
    {
      category: 'Product Information',
      query: 'Tell me about the XR-9000 Quantum Flux pump you have'
    },
    {
      category: 'Product Information',
      query: 'What comes included with the Rexroth A10VSO pump package?'
    },
    
    // Technical Specifications
    {
      category: 'Technical Specs',
      query: 'What is the exact horsepower rating of the Kawasaki K3V112DT?'
    },
    {
      category: 'Technical Specs',
      query: 'What are the dimensions and weight of the Parker PV270?'
    },
    
    // Inventory & Availability
    {
      category: 'Inventory',
      query: 'How many Sauer Danfoss pumps do you have in stock right now?'
    },
    {
      category: 'Inventory',
      query: 'When will the Liebherr pump be back in stock?'
    },
    
    // Pricing
    {
      category: 'Pricing',
      query: 'How much does the Rexroth A11VO cost?'
    },
    
    // Warranty & Policy
    {
      category: 'Warranty',
      query: 'What warranty comes with hydraulic pumps?'
    },
    
    // Comparisons
    {
      category: 'Comparison',
      query: 'Which is better quality, Parker or Rexroth pumps?'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📋 Test: ${test.category}`);
    console.log(`   Query: "${test.query}"`);
    
    try {
      const response = await testChat(test.query);
      const analysis = analyzeResponse(response);
      
      // Calculate score (0-10)
      let score = 10;
      if (analysis.hallucinationDetected) score -= 5;
      if (!analysis.admittedUncertainty && analysis.madeSpecificClaims) score -= 3;
      if (!analysis.suggestedContact && analysis.patterns.length > 0) score -= 2;
      
      results.push({
        category: test.category,
        query: test.query,
        response,
        analysis,
        score
      });
      
      // Display analysis
      console.log(`   Response: "${response.substring(0, 150)}..."`);
      console.log(`   Analysis:`);
      console.log(`     • Hallucination Detected: ${analysis.hallucinationDetected ? '❌ YES' : '✅ NO'}`);
      console.log(`     • Admitted Uncertainty: ${analysis.admittedUncertainty ? '✅ YES' : '❌ NO'}`);
      console.log(`     • Made Specific Claims: ${analysis.madeSpecificClaims ? '⚠️ YES' : '✅ NO'}`);
      console.log(`     • Suggested Contact: ${analysis.suggestedContact ? '✅ YES' : '❌ NO'}`);
      
      if (analysis.patterns.length > 0) {
        console.log(`     • Patterns Found:`);
        analysis.patterns.forEach(p => console.log(`       - ${p}`));
      }
      
      console.log(`   Score: ${score}/10`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.push({
        category: test.category,
        query: test.query,
        response: 'ERROR',
        analysis: {
          hallucinationDetected: false,
          admittedUncertainty: false,
          madeSpecificClaims: false,
          suggestedContact: false,
          patterns: []
        },
        score: 0
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

function generateReport() {
  console.log('\n' + '=' .repeat(50));
  console.log('📊 FORENSIC ANALYSIS SUMMARY');
  console.log('=' .repeat(50));
  
  // Calculate overall statistics
  const validResults = results.filter(r => r.response !== 'ERROR');
  const totalTests = validResults.length;
  const hallucinations = validResults.filter(r => r.analysis.hallucinationDetected).length;
  const uncertaintyAdmissions = validResults.filter(r => r.analysis.admittedUncertainty).length;
  const contactSuggestions = validResults.filter(r => r.analysis.suggestedContact).length;
  
  const avgScore = validResults.reduce((sum, r) => sum + r.score, 0) / totalTests;
  
  console.log('\n📈 Overall Metrics:');
  console.log(`   • Tests Run: ${totalTests}`);
  console.log(`   • Hallucinations Detected: ${hallucinations} (${(hallucinations/totalTests*100).toFixed(1)}%)`);
  console.log(`   • Uncertainty Admissions: ${uncertaintyAdmissions} (${(uncertaintyAdmissions/totalTests*100).toFixed(1)}%)`);
  console.log(`   • Contact Suggestions: ${contactSuggestions} (${(contactSuggestions/totalTests*100).toFixed(1)}%)`);
  console.log(`   • Average Score: ${avgScore.toFixed(1)}/10`);
  
  // Category breakdown
  console.log('\n📂 Category Breakdown:');
  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(cat => {
    const catResults = validResults.filter(r => r.category === cat);
    if (catResults.length === 0) return;
    
    const catHallucinations = catResults.filter(r => r.analysis.hallucinationDetected).length;
    const catAvgScore = catResults.reduce((sum, r) => sum + r.score, 0) / catResults.length;
    
    console.log(`\n   ${cat}:`);
    console.log(`     • Tests: ${catResults.length}`);
    console.log(`     • Hallucinations: ${catHallucinations}`);
    console.log(`     • Avg Score: ${catAvgScore.toFixed(1)}/10`);
  });
  
  // Pattern frequency
  console.log('\n🔍 Common Patterns:');
  const allPatterns: { [key: string]: number } = {};
  validResults.forEach(r => {
    r.analysis.patterns.forEach(p => {
      allPatterns[p] = (allPatterns[p] || 0) + 1;
    });
  });
  
  Object.entries(allPatterns)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
      console.log(`   • ${pattern}: ${count} occurrences`);
    });
  
  // Final grade
  console.log('\n🏆 FINAL HALLUCINATION PREVENTION SCORE:');
  const finalScore = Math.round(avgScore);
  const grade = finalScore >= 9 ? 'A+' :
                finalScore >= 8 ? 'A' :
                finalScore >= 7 ? 'B' :
                finalScore >= 6 ? 'C' :
                finalScore >= 5 ? 'D' : 'F';
  
  console.log(`   ${'★'.repeat(finalScore)}${'☆'.repeat(10-finalScore)} ${finalScore}/10 (Grade: ${grade})`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (hallucinations > 0) {
    console.log('   ⚠️ Hallucinations detected - strengthen uncertainty rules');
  }
  if (uncertaintyAdmissions < totalTests * 0.7) {
    console.log('   ⚠️ Low uncertainty admission rate - AI may be overconfident');
  }
  if (contactSuggestions < totalTests * 0.5) {
    console.log('   ⚠️ Not suggesting customer service enough for unclear queries');
  }
  if (avgScore >= 8) {
    console.log('   ✅ Good hallucination prevention overall');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      hallucinations,
      uncertaintyAdmissions,
      contactSuggestions,
      avgScore,
      grade
    },
    patterns: allPatterns,
    details: results
  };
  
  const filepath = `/Users/jamesguy/Omniops/hallucination-forensic-${Date.now()}.json`;
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\n📁 Full report saved to: ${filepath}`);
}

// Main execution
async function main() {
  try {
    await runCriticalTests();
    generateReport();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error);