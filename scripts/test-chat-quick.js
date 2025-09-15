#!/usr/bin/env node

/**
 * Quick Chat Response Tester
 * 
 * A simple Node.js script to test chat responses without TypeScript compilation.
 * Usage: node scripts/test-chat-quick.js
 */

import { v4: uuidv4  } from 'uuid';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  domain: 'thompsonseparts.co.uk',
  sessionId: uuidv4(),
};

// Test queries from user feedback
const TEST_QUERIES = [
  {
    name: 'Cifa Mixer Pump',
    query: 'Need a pump for my Cifa mixer',
    expect: 'Multiple pump options shown immediately'
  },
  {
    name: 'Teng Torque Wrenches',
    query: 'Teng torque wrenches',
    expect: 'No external links, only internal results'
  },
  {
    name: 'Kinshofer Kit',
    query: 'Kinshofer pin & bush kit',
    expect: 'Concise response, no external links'
  },
  {
    name: 'SKU Test',
    query: 'DC66-10P',
    expect: 'Specific product recognition'
  },
  {
    name: 'Sheet Roller Bar',
    query: 'sheet roller bar',
    expect: 'Show products first, minimal questions'
  },
  {
    name: 'Starter Charger Price',
    query: 'Price on a starter charger',
    expect: 'GBP currency, no external links'
  },
  {
    name: 'Body Filler Price',
    query: 'Price on Body Filler',
    expect: 'UK products, no American products/links'
  }
];

async function testQuery(query, name) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`Query: "${query}"`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: TEST_CONFIG.sessionId,
        domain: TEST_CONFIG.domain,
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true }
          }
        }
      }),
    });

    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.message;

    // Quick analysis
    const wordCount = message.split(/\s+/).filter(w => w.length > 0).length;
    const hasExternalLinks = /\]\(https?:\/\/(?!thompsonseparts\.co\.uk)/g.test(message);
    const gbpCount = (message.match(/£\d+/g) || []).length;
    const usdCount = (message.match(/\$\d+/g) || []).length;
    const linkCount = (message.match(/\]\([^)]+\)/g) || []).length;
    const questionCount = (message.match(/\?/g) || []).length;

    // Results
    console.log(`✓ Response received in ${responseTime}ms`);
    console.log(`📊 Words: ${wordCount} | Links: ${linkCount} | Questions: ${questionCount}`);
    console.log(`💰 Currency: £${gbpCount} | $${usdCount}`);
    console.log(`🔗 External links: ${hasExternalLinks ? '❌ YES' : '✅ NO'}`);
    console.log(`📝 Preview: ${message.substring(0, 150)}...`);

    // Flag concerns
    const concerns = [];
    if (hasExternalLinks) concerns.push('External links found');
    if (wordCount > 150) concerns.push(`Too verbose (${wordCount} words)`);
    if (usdCount > 0 && gbpCount === 0) concerns.push('USD instead of GBP');
    if (questionCount > 2 && linkCount === 0) concerns.push('Too many questions without products');

    if (concerns.length > 0) {
      console.log(`⚠️ Concerns: ${concerns.join(', ')}`);
    } else {
      console.log(`✅ No major concerns`);
    }

    return {
      success: true,
      responseTime,
      wordCount,
      hasExternalLinks,
      concerns: concerns.length
    };

  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Quick Chat Response Test');
  console.log(`Testing against: ${TEST_CONFIG.baseUrl}`);
  console.log(`Domain: ${TEST_CONFIG.domain}`);
  
  const results = [];
  
  for (const test of TEST_QUERIES) {
    const result = await testQuery(test.query, test.name);
    results.push({ ...result, name: test.name });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const avgTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / successful;
  
  console.log(`Tests: ${results.length} | Success: ${successful} | Failed: ${failed}`);
  console.log(`Average response time: ${Math.round(avgTime)}ms`);
  
  const externalLinkCount = results.filter(r => r.hasExternalLinks).length;
  const concernCount = results.reduce((sum, r) => sum + (r.concerns || 0), 0);
  
  console.log(`Tests with external links: ${externalLinkCount}`);
  console.log(`Total concerns raised: ${concernCount}`);

  if (externalLinkCount > 0) {
    console.log('\n❌ External links found in:');
    results
      .filter(r => r.hasExternalLinks)
      .forEach(r => console.log(`   • ${r.name}`));
  }

  console.log('\n' + '='.repeat(60));
  
  return results;
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, testQuery };;