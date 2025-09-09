#!/usr/bin/env npx tsx

/**
 * Chat Response Test Suite
 * 
 * This script tests the chat system's responses to various queries based on user feedback.
 * It simulates chat requests to the API endpoint and analyzes the responses for:
 * - Response length/verbosity
 * - External link presence
 * - Number of products shown vs available
 * - Currency usage
 * - Question asking vs product showing behavior
 */

import { ChatRequest, ChatResponse } from './types/api';
import { v4 as uuidv4 } from 'uuid';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  domain: 'thompsonseparts.co.uk',
  sessionId: uuidv4(),
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// Test scenarios based on user feedback
const TEST_SCENARIOS = [
  {
    id: 'cifa_mixer_pump',
    query: 'Need a pump for my Cifa mixer',
    description: 'Check if it shows all Cifa pumps or just one',
    expectedBehavior: 'Should show multiple Cifa pump options immediately',
    concerns: ['Limited product display', 'Not showing full inventory']
  },
  {
    id: 'teng_torque_wrenches',
    query: 'Teng torque wrenches',
    description: 'Check if external sites are suggested',
    expectedBehavior: 'Should only show internal products/pages, no external links',
    concerns: ['External site recommendations', 'Competitor links']
  },
  {
    id: 'kinshofer_pin_bush',
    query: 'Kinshofer pin & bush kit',
    description: 'Check response length and external links',
    expectedBehavior: 'Concise response with internal links only',
    concerns: ['Response too verbose', 'External links present']
  },
  {
    id: 'sku_recognition',
    query: 'DC66-10P',
    description: 'Test SKU recognition',
    expectedBehavior: 'Should recognize and show specific product by SKU',
    concerns: ['SKU not recognized', 'Generic response instead of specific product']
  },
  {
    id: 'sheet_roller_bar',
    query: 'sheet roller bar',
    description: 'Check if it asks too many questions vs showing category',
    expectedBehavior: 'Should show available products first, minimal questioning',
    concerns: ['Too many clarifying questions', 'Not showing available options']
  },
  {
    id: 'starter_charger_price',
    query: 'Price on a starter charger',
    description: 'Check currency (should be GBP not USD) and external links',
    expectedBehavior: 'Show GBP prices, no external links',
    concerns: ['USD instead of GBP', 'External site links']
  },
  {
    id: 'body_filler_price',
    query: 'Price on Body Filler',
    description: 'Check for American products and external links',
    expectedBehavior: 'Show UK/relevant products only, no external links',
    concerns: ['American products suggested', 'External links to competitors']
  }
];

// Analysis functions
interface ResponseAnalysis {
  wordCount: number;
  characterCount: number;
  bulletPoints: number;
  externalLinks: string[];
  internalLinks: string[];
  currency: {
    gbp: number;
    usd: number;
    euro: number;
  };
  productCount: number;
  questionsAsked: number;
  immediateProductShow: boolean;
  responseTime: number;
}

function analyzeResponse(response: string, responseTime: number): ResponseAnalysis {
  const analysis: ResponseAnalysis = {
    wordCount: response.split(/\s+/).filter(word => word.length > 0).length,
    characterCount: response.length,
    bulletPoints: (response.match(/[•\*\-]\s/g) || []).length,
    externalLinks: [],
    internalLinks: [],
    currency: {
      gbp: (response.match(/£\d+/g) || []).length,
      usd: (response.match(/\$\d+/g) || []).length,
      euro: (response.match(/€\d+/g) || []).length,
    },
    productCount: 0,
    questionsAsked: (response.match(/\?/g) || []).length,
    immediateProductShow: false,
    responseTime
  };

  // Extract links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(response)) !== null) {
    const url = match[2];
    if (url.includes('thompsonseparts.co.uk') || url.startsWith('/')) {
      analysis.internalLinks.push(url);
    } else {
      analysis.externalLinks.push(url);
    }
  }

  // Count products (rough heuristic - links with product-like names)
  analysis.productCount = analysis.internalLinks.filter(link => 
    link.includes('product') || 
    link.includes('part') || 
    link.includes('pump') || 
    link.includes('tool') ||
    link.includes('kit')
  ).length;

  // Check if products are shown immediately (first 100 characters contain product links)
  analysis.immediateProductShow = response.substring(0, 200).includes('](');

  return analysis;
}

function detectConcerns(scenario: typeof TEST_SCENARIOS[0], analysis: ResponseAnalysis, response: string): string[] {
  const concerns: string[] = [];

  // Check for external links
  if (analysis.externalLinks.length > 0) {
    concerns.push(`External links found: ${analysis.externalLinks.join(', ')}`);
  }

  // Check for verbosity
  if (analysis.wordCount > 150) {
    concerns.push(`Response too verbose: ${analysis.wordCount} words`);
  }

  // Check for USD currency when GBP expected
  if (analysis.currency.usd > 0 && analysis.currency.gbp === 0) {
    concerns.push(`USD currency found instead of GBP`);
  }

  // Check for excessive questioning
  if (analysis.questionsAsked > 2 && analysis.productCount === 0) {
    concerns.push(`Too many questions (${analysis.questionsAsked}) without showing products`);
  }

  // Scenario-specific checks
  switch (scenario.id) {
    case 'cifa_mixer_pump':
      if (analysis.productCount <= 1) {
        concerns.push(`Limited products shown (${analysis.productCount}), expected multiple Cifa pumps`);
      }
      break;
    
    case 'sku_recognition':
      if (!response.toLowerCase().includes('dc66') && analysis.productCount === 0) {
        concerns.push(`SKU not recognized - no specific product shown`);
      }
      break;
    
    case 'sheet_roller_bar':
      if (!analysis.immediateProductShow && analysis.questionsAsked > 0) {
        concerns.push(`Asked questions before showing available products`);
      }
      break;
  }

  return concerns;
}

async function makeApiRequest(query: string, conversationId?: string): Promise<{ response: ChatResponse, time: number }> {
  const startTime = Date.now();
  
  const requestBody: ChatRequest = {
    message: query,
    session_id: TEST_CONFIG.sessionId,
    domain: TEST_CONFIG.domain,
    conversation_id: conversationId,
    config: {
      features: {
        woocommerce: { enabled: true },
        websiteScraping: { enabled: true }
      }
    }
  };

  let lastError;
  for (let attempt = 0; attempt < TEST_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      const endTime = Date.now();
      
      return { 
        response: data, 
        time: endTime - startTime 
      };
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < TEST_CONFIG.maxRetries - 1) {
        console.log(`Retrying in ${TEST_CONFIG.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay));
      }
    }
  }

  throw lastError;
}

function formatAnalysis(scenario: typeof TEST_SCENARIOS[0], analysis: ResponseAnalysis, concerns: string[], response: string): string {
  const status = concerns.length === 0 ? '✅ PASS' : '❌ ISSUES FOUND';
  
  return `
${status} - ${scenario.id.toUpperCase()}
Query: "${scenario.query}"
Description: ${scenario.description}

📊 METRICS:
• Response Time: ${analysis.responseTime}ms
• Word Count: ${analysis.wordCount} words
• Character Count: ${analysis.characterCount} chars
• Bullet Points: ${analysis.bulletPoints}
• Questions Asked: ${analysis.questionsAsked}
• Products Shown: ${analysis.productCount}
• Immediate Product Display: ${analysis.immediateProductShow ? 'Yes' : 'No'}

🔗 LINKS:
• Internal Links: ${analysis.internalLinks.length} (${analysis.internalLinks.slice(0, 3).join(', ')}${analysis.internalLinks.length > 3 ? '...' : ''})
• External Links: ${analysis.externalLinks.length} ${analysis.externalLinks.length > 0 ? `(${analysis.externalLinks.join(', ')})` : ''}

💰 CURRENCY:
• GBP (£): ${analysis.currency.gbp}
• USD ($): ${analysis.currency.usd}
• EUR (€): ${analysis.currency.euro}

${concerns.length > 0 ? `
⚠️ CONCERNS DETECTED:
${concerns.map(c => `• ${c}`).join('\n')}
` : ''}

📝 RESPONSE PREVIEW:
${response.substring(0, 300)}${response.length > 300 ? '...' : ''}

---
`;
}

async function runTestSuite(): Promise<void> {
  console.log('🚀 Starting Chat Response Test Suite');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Domain: ${TEST_CONFIG.domain}`);
  console.log(`Session ID: ${TEST_CONFIG.sessionId}`);
  console.log('');

  const results: Array<{
    scenario: typeof TEST_SCENARIOS[0];
    analysis: ResponseAnalysis;
    concerns: string[];
    response: string;
    success: boolean;
  }> = [];

  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    console.log(`\n[${i + 1}/${TEST_SCENARIOS.length}] Testing: ${scenario.id}`);
    console.log(`Query: "${scenario.query}"`);

    try {
      const { response, time } = await makeApiRequest(scenario.query);
      const analysis = analyzeResponse(response.message, time);
      const concerns = detectConcerns(scenario, analysis, response.message);

      results.push({
        scenario,
        analysis,
        concerns,
        response: response.message,
        success: concerns.length === 0
      });

      console.log(`✓ Completed in ${time}ms`);
    } catch (error) {
      console.error(`✗ Failed:`, error);
      results.push({
        scenario,
        analysis: {
          wordCount: 0, characterCount: 0, bulletPoints: 0,
          externalLinks: [], internalLinks: [], currency: { gbp: 0, usd: 0, euro: 0 },
          productCount: 0, questionsAsked: 0, immediateProductShow: false,
          responseTime: 0
        },
        concerns: [`API request failed: ${error}`],
        response: '',
        success: false
      });
    }
  }

  // Generate comprehensive report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80));

  results.forEach(result => {
    console.log(formatAnalysis(result.scenario, result.analysis, result.concerns, result.response));
  });

  // Summary statistics
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const avgResponseTime = results.reduce((sum, r) => sum + r.analysis.responseTime, 0) / results.length;
  const avgWordCount = results.reduce((sum, r) => sum + r.analysis.wordCount, 0) / results.length;
  const totalExternalLinks = results.reduce((sum, r) => sum + r.analysis.externalLinks.length, 0);

  console.log('\n📈 SUMMARY STATISTICS');
  console.log('='.repeat(40));
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successful} (${Math.round(successful/results.length * 100)}%)`);
  console.log(`Failed: ${failed} (${Math.round(failed/results.length * 100)}%)`);
  console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
  console.log(`Average Word Count: ${Math.round(avgWordCount)} words`);
  console.log(`Total External Links Found: ${totalExternalLinks}`);

  // Key findings
  console.log('\n🔍 KEY FINDINGS');
  console.log('='.repeat(40));
  
  const externalLinkTests = results.filter(r => r.analysis.externalLinks.length > 0);
  if (externalLinkTests.length > 0) {
    console.log(`❌ External Links Found in ${externalLinkTests.length} tests:`);
    externalLinkTests.forEach(test => {
      console.log(`   • ${test.scenario.id}: ${test.analysis.externalLinks.join(', ')}`);
    });
  } else {
    console.log(`✅ No external links found in any responses`);
  }

  const currencyIssues = results.filter(r => r.analysis.currency.usd > 0 && r.analysis.currency.gbp === 0);
  if (currencyIssues.length > 0) {
    console.log(`❌ USD Currency Issues in ${currencyIssues.length} tests:`);
    currencyIssues.forEach(test => {
      console.log(`   • ${test.scenario.id}: Found ${test.analysis.currency.usd} USD references`);
    });
  } else {
    console.log(`✅ No USD currency issues found`);
  }

  const verboseResponses = results.filter(r => r.analysis.wordCount > 150);
  if (verboseResponses.length > 0) {
    console.log(`⚠️ Verbose Responses (>150 words) in ${verboseResponses.length} tests:`);
    verboseResponses.forEach(test => {
      console.log(`   • ${test.scenario.id}: ${test.analysis.wordCount} words`);
    });
  } else {
    console.log(`✅ All responses are concise (<150 words)`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Test suite completed!');
  
  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  runTestSuite().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export { runTestSuite, TEST_SCENARIOS, analyzeResponse, detectConcerns };