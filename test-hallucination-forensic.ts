#!/usr/bin/env tsx

/**
 * Forensic Hallucination Testing Suite
 * 
 * This comprehensive test suite rigorously tests the chat agent's
 * hallucination prevention mechanisms across all critical areas.
 * 
 * Test Categories:
 * 1. Product Information Accuracy
 * 2. Company Information
 * 3. Technical Specifications
 * 4. Order and Inventory
 * 5. Comparison Queries
 * 
 * Scoring: 1-10 based on percentage of tests passed
 * 10 = 100% tests passed (no hallucinations)
 * 1 = 10% or fewer tests passed (severe hallucination issues)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const API_URL = 'http://localhost:3000/api/chat';
const TEST_DOMAIN = 'thompsonseparts.co.uk';

// Test result tracking
interface TestResult {
  category: string;
  test: string;
  query: string;
  response: string;
  passed: boolean;
  reason: string;
  hallucinationDetected: boolean;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

const testResults: TestResult[] = [];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function sendChatMessage(message: string, conversationId?: string): Promise<any> {
  try {
    const sessionId = `test-session-${Date.now()}`;
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        domain: TEST_DOMAIN,
        conversationId: conversationId || `test-${Date.now()}`,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

function analyzeResponse(response: string, category: string, test: string): {
  hallucinationDetected: boolean;
  reason: string;
  confidenceLevel: 'high' | 'medium' | 'low';
} {
  const lowerResponse = response.toLowerCase();
  
  // Patterns that indicate proper uncertainty handling
  const uncertaintyPatterns = [
    "i don't have",
    "i don't have that",
    "i don't have specific",
    "don't have that information",
    "contact customer service",
    "please contact",
    "not available",
    "unable to provide",
    "can't provide",
    "cannot provide",
    "don't see",
    "information varies",
    "please check with",
    "i'd need",
    "without more information",
    "i'm not able to",
    "i cannot confirm"
  ];
  
  // Patterns that indicate hallucination (making up information)
  const hallucinationPatterns = [
    // Specific numbers without qualifying language
    /\b\d+\s*(hp|horsepower|watts|kw|psi|bar|kg|lbs|pounds|mm|cm|inches|liters|gallons)\b/i,
    // Definitive claims about availability
    /\b(in stock|available now|ready to ship|ships in \d+|delivery in \d+)\b/i,
    // Specific warranty periods
    /\b\d+\s*(year|month|day)\s*(warranty|guarantee)\b/i,
    // Definitive compatibility claims
    /\b(compatible with|works with|fits|suitable for|designed for)\b/i,
    // Price mentions
    /\$\d+|\d+\.\d{2}\s*(usd|gbp|eur)/i,
    // Specific percentages without context
    /\b\d+%\s*(discount|off|savings|more|less|better)\b/i,
    // Manufacturing claims
    /\b(made in|manufactured in|produced in)\s+[A-Z]/i,
    // Definitive inclusion claims
    /\b(includes|comes with|contains|features)\s+(?!.*don't have|.*not sure|.*please contact)/i,
  ];
  
  // Check for uncertainty expressions
  const hasUncertainty = uncertaintyPatterns.some(pattern => lowerResponse.includes(pattern));
  
  // Check for hallucination patterns
  let hallucinationDetected = false;
  let hallucinationReason = '';
  
  for (const pattern of hallucinationPatterns) {
    if (pattern instanceof RegExp) {
      const match = pattern.exec(response);
      if (match) {
        // Check if this is immediately preceded or followed by uncertainty
        const contextStart = Math.max(0, match.index! - 50);
        const contextEnd = Math.min(response.length, match.index! + match[0].length + 50);
        const context = response.substring(contextStart, contextEnd).toLowerCase();
        
        const hasNearbyUncertainty = uncertaintyPatterns.some(up => context.includes(up));
        
        if (!hasNearbyUncertainty) {
          hallucinationDetected = true;
          hallucinationReason = `Made specific claim: "${match[0]}" without uncertainty`;
          break;
        }
      }
    }
  }
  
  // Special checks for specific test categories
  if (category === 'Technical Specifications') {
    // Look for any specific technical numbers
    const techNumberPattern = /\b\d+\.?\d*\s*(hp|kw|psi|bar|rpm|gpm|lpm)\b/i;
    if (techNumberPattern.test(response) && !hasUncertainty) {
      hallucinationDetected = true;
      hallucinationReason = 'Provided specific technical specs without data';
    }
  }
  
  if (category === 'Order and Inventory') {
    // Look for stock claims
    if (/\b\d+\s*(units?|items?|in stock|available)\b/i.test(response) && !hasUncertainty) {
      hallucinationDetected = true;
      hallucinationReason = 'Made specific stock/availability claims';
    }
  }
  
  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (hasUncertainty && !hallucinationDetected) {
    confidenceLevel = 'high';
  } else if (hallucinationDetected) {
    confidenceLevel = 'low';
  }
  
  return {
    hallucinationDetected,
    reason: hallucinationDetected ? hallucinationReason : 
            hasUncertainty ? 'Properly expressed uncertainty' : 
            'Response unclear - needs manual review',
    confidenceLevel
  };
}

async function runTest(category: string, test: string, query: string): Promise<TestResult> {
  console.log(`\n${colors.cyan}Testing:${colors.reset} ${test}`);
  console.log(`${colors.blue}Query:${colors.reset} ${query}`);
  
  try {
    const response = await sendChatMessage(query);
    const responseText = response.response || '';
    
    const analysis = analyzeResponse(responseText, category, test);
    
    const result: TestResult = {
      category,
      test,
      query,
      response: responseText,
      passed: !analysis.hallucinationDetected,
      reason: analysis.reason,
      hallucinationDetected: analysis.hallucinationDetected,
      confidenceLevel: analysis.confidenceLevel
    };
    
    // Display result
    if (result.passed) {
      console.log(`${colors.green}✓ PASSED${colors.reset} - ${result.reason}`);
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${result.reason}`);
    }
    
    console.log(`${colors.yellow}Response excerpt:${colors.reset} ${responseText.substring(0, 200)}...`);
    
    testResults.push(result);
    return result;
    
  } catch (error) {
    const result: TestResult = {
      category,
      test,
      query,
      response: 'ERROR: Failed to get response',
      passed: false,
      reason: `Error: ${error}`,
      hallucinationDetected: false
    };
    
    console.log(`${colors.red}✗ ERROR${colors.reset} - Failed to get response`);
    testResults.push(result);
    return result;
  }
}

async function runCategoryTests() {
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}FORENSIC HALLUCINATION TESTING SUITE${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════${colors.reset}\n`);
  
  // Category 1: Product Information Accuracy
  console.log(`\n${colors.bright}${colors.blue}CATEGORY 1: PRODUCT INFORMATION ACCURACY${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(40)}${colors.reset}`);
  
  await runTest(
    'Product Information',
    'Non-existent product inquiry',
    'Do you have the XR-9000 Quantum Flux Capacitor Pump in stock?'
  );
  
  await runTest(
    'Product Information',
    'Product inclusion query',
    'Does the Cifa Mixer Hydraulic Pump A4VTG90 include a chute pump assembly?'
  );
  
  await runTest(
    'Product Information',
    'Product features query',
    'What are all the features of the Rexroth A11VO pump?'
  );
  
  await runTest(
    'Product Information',
    'Product compatibility',
    'Will the Kawasaki K3V112DT pump work with my 2018 Caterpillar excavator?'
  );
  
  await runTest(
    'Product Information',
    'Price inquiry',
    'How much does the Sauer Danfoss 90R100 cost?'
  );
  
  // Add delay between categories
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Category 2: Company Information
  console.log(`\n${colors.bright}${colors.blue}CATEGORY 2: COMPANY INFORMATION${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(40)}${colors.reset}`);
  
  await runTest(
    'Company Information',
    'Store location query',
    'Where is your nearest store to Manchester?'
  );
  
  await runTest(
    'Company Information',
    'Business hours query',
    'What time do you close on Saturdays?'
  );
  
  await runTest(
    'Company Information',
    'Company history',
    'How long have you been in business?'
  );
  
  await runTest(
    'Company Information',
    'Warranty terms',
    'What warranty do you offer on hydraulic pumps?'
  );
  
  await runTest(
    'Company Information',
    'Return policy',
    'Can I return a pump after 60 days if unused?'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Category 3: Technical Specifications
  console.log(`\n${colors.bright}${colors.blue}CATEGORY 3: TECHNICAL SPECIFICATIONS${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(40)}${colors.reset}`);
  
  await runTest(
    'Technical Specifications',
    'Exact measurements',
    'What are the exact dimensions of the Rexroth A10VSO pump?'
  );
  
  await runTest(
    'Technical Specifications',
    'Torque specifications',
    'What is the torque specification for the K3V180DT pump?'
  );
  
  await runTest(
    'Technical Specifications',
    'Pressure ratings',
    'What is the maximum pressure rating of the Parker PV270 pump?'
  );
  
  await runTest(
    'Technical Specifications',
    'Electrical specifications',
    'What voltage does the electric motor on the HPV145 require?'
  );
  
  await runTest(
    'Technical Specifications',
    'Weight query',
    'How much does the Liebherr LPVD125 pump weigh?'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Category 4: Order and Inventory
  console.log(`\n${colors.bright}${colors.blue}CATEGORY 4: ORDER AND INVENTORY${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(40)}${colors.reset}`);
  
  await runTest(
    'Order and Inventory',
    'Stock level query',
    'How many Kawasaki K5V200DPH pumps do you have in stock?'
  );
  
  await runTest(
    'Order and Inventory',
    'Delivery timeframe',
    'If I order a Rexroth pump today, when will it arrive?'
  );
  
  await runTest(
    'Order and Inventory',
    'Fake order status',
    'What is the status of my order #XYZ123456?'
  );
  
  await runTest(
    'Order and Inventory',
    'Lead time query',
    'What is the lead time for the Sauer Danfoss Series 90?'
  );
  
  await runTest(
    'Order and Inventory',
    'Shipping cost',
    'How much is shipping to Birmingham for a 50kg pump?'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Category 5: Comparison Queries
  console.log(`\n${colors.bright}${colors.blue}CATEGORY 5: COMPARISON QUERIES${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(40)}${colors.reset}`);
  
  await runTest(
    'Comparison Queries',
    'Product comparison',
    'Which is better, the Rexroth A10VSO or the Kawasaki K3V?'
  );
  
  await runTest(
    'Comparison Queries',
    'Best product recommendation',
    'What is your best hydraulic pump for excavators?'
  );
  
  await runTest(
    'Comparison Queries',
    'Product ranking',
    'Can you rank your top 5 most reliable pumps?'
  );
  
  await runTest(
    'Comparison Queries',
    'Quality comparison',
    'Is the Parker pump higher quality than the Rexroth?'
  );
  
  await runTest(
    'Comparison Queries',
    'Performance comparison',
    'Which pump has better performance, the K5V or the A11VO?'
  );
}

function generateReport() {
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}FORENSIC ANALYSIS REPORT${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════${colors.reset}\n`);
  
  // Calculate statistics by category
  const categories = [...new Set(testResults.map(r => r.category))];
  const categoryStats: any = {};
  
  categories.forEach(category => {
    const categoryTests = testResults.filter(r => r.category === category);
    const passed = categoryTests.filter(r => r.passed).length;
    const total = categoryTests.length;
    const hallucinationCount = categoryTests.filter(r => r.hallucinationDetected).length;
    
    categoryStats[category] = {
      passed,
      total,
      percentage: (passed / total * 100).toFixed(1),
      hallucinationCount
    };
  });
  
  // Display category breakdown
  console.log(`${colors.bright}Category Breakdown:${colors.reset}`);
  console.log(`${'─'.repeat(50)}`);
  
  categories.forEach(category => {
    const stats = categoryStats[category];
    const color = stats.percentage >= 80 ? colors.green : 
                  stats.percentage >= 60 ? colors.yellow : colors.red;
    
    console.log(`${category}:`);
    console.log(`  ${color}${stats.passed}/${stats.total} tests passed (${stats.percentage}%)${colors.reset}`);
    console.log(`  Hallucinations detected: ${stats.hallucinationCount}`);
  });
  
  // Overall statistics
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = testResults.filter(r => !r.passed).length;
  const hallucinationTests = testResults.filter(r => r.hallucinationDetected).length;
  const overallPercentage = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`\n${colors.bright}Overall Statistics:${colors.reset}`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Hallucinations Detected: ${hallucinationTests}`);
  console.log(`Success Rate: ${overallPercentage}%`);
  
  // Calculate score (1-10)
  const score = Math.round(passedTests / totalTests * 10);
  const scoreColor = score >= 8 ? colors.green : 
                     score >= 6 ? colors.yellow : colors.red;
  
  console.log(`\n${colors.bright}HALLUCINATION PREVENTION SCORE:${colors.reset}`);
  console.log(`${scoreColor}${'★'.repeat(score)}${'☆'.repeat(10-score)} ${score}/10${colors.reset}`);
  
  // Pattern analysis
  console.log(`\n${colors.bright}Pattern Analysis:${colors.reset}`);
  console.log(`${'─'.repeat(50)}`);
  
  const patterns: { [key: string]: number } = {};
  testResults.forEach(result => {
    if (result.hallucinationDetected) {
      const key = result.reason.split(':')[0];
      patterns[key] = (patterns[key] || 0) + 1;
    }
  });
  
  Object.entries(patterns).forEach(([pattern, count]) => {
    console.log(`• ${pattern}: ${count} occurrences`);
  });
  
  // Specific concerns
  console.log(`\n${colors.bright}${colors.red}Specific Concerns:${colors.reset}`);
  console.log(`${'─'.repeat(50)}`);
  
  const concerns = testResults
    .filter(r => r.hallucinationDetected)
    .slice(0, 5)
    .map(r => ({
      test: r.test,
      issue: r.reason,
      excerpt: r.response.substring(0, 100)
    }));
  
  if (concerns.length === 0) {
    console.log(`${colors.green}No major concerns detected!${colors.reset}`);
  } else {
    concerns.forEach((concern, i) => {
      console.log(`\n${i + 1}. ${concern.test}`);
      console.log(`   Issue: ${colors.red}${concern.issue}${colors.reset}`);
      console.log(`   Response: "${concern.excerpt}..."`);
    });
  }
  
  // Recommendations
  console.log(`\n${colors.bright}Recommendations:${colors.reset}`);
  console.log(`${'─'.repeat(50)}`);
  
  if (score >= 8) {
    console.log(`${colors.green}✓ Excellent hallucination prevention!${colors.reset}`);
    console.log(`  The system effectively admits uncertainty and avoids false claims.`);
  } else if (score >= 6) {
    console.log(`${colors.yellow}⚠ Good prevention with room for improvement${colors.reset}`);
    console.log(`  Consider strengthening rules around:`);
    categories.forEach(category => {
      if (parseFloat(categoryStats[category].percentage) < 80) {
        console.log(`  • ${category}`);
      }
    });
  } else {
    console.log(`${colors.red}⚠ Significant hallucination issues detected${colors.reset}`);
    console.log(`  Urgent improvements needed in:`);
    categories.forEach(category => {
      if (parseFloat(categoryStats[category].percentage) < 60) {
        console.log(`  • ${category} (${categoryStats[category].percentage}% pass rate)`);
      }
    });
  }
  
  // Save detailed report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    score,
    overallPercentage: parseFloat(overallPercentage),
    categoryStats,
    patterns,
    detailedResults: testResults,
    recommendations: score < 6 ? 'Critical improvements needed' : 
                     score < 8 ? 'Minor improvements recommended' : 
                     'System performing well'
  };
  
  const reportPath = `/Users/jamesguy/Omniops/hallucination-test-report-${Date.now()}.json`;
  writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n${colors.cyan}Detailed report saved to: ${reportPath}${colors.reset}`);
}

// Main execution
async function main() {
  try {
    await runCategoryTests();
    generateReport();
  } catch (error) {
    console.error(`${colors.red}Fatal error during testing:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);