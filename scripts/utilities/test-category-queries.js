#!/usr/bin/env node

/**
 * Test script for category query handling in the chat system
 * Tests how the system handles general category queries vs specific products
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';
const DOMAIN = 'thompsonseparts.co.uk';

const TEST_SCENARIOS = [
  {
    name: 'Cifa Mixer Pump Query',
    query: 'Need a pump for my Cifa mixer',
    expectedCategory: 'https://www.thompsonseparts.co.uk/product-category/cifa-truck-mixer-parts/cifa-hydraulic-parts/',
    description: 'Should show Cifa hydraulic parts category'
  },
  {
    name: 'Sheet Roller Bar Query',
    query: 'sheet roller bar',
    expectedCategory: 'https://www.thompsonseparts.co.uk/product-category/tipper-trailer-sheeting-systems-spares/tipper-sheet-system-arm-parts-flip-over/',
    description: 'Should show tipper sheet system arm parts category'
  },
  {
    name: 'Starter Charger Query',
    query: 'starter charger',
    expectedCategory: 'https://www.thompsonseparts.co.uk/product-category/workshop-tools-equipment/battery-starters-chargers-power-packs/',
    description: 'Should show battery starters & chargers category'
  },
  {
    name: 'Body Filler Query',
    query: 'Body Filler',
    expectedCategory: 'https://www.thompsonseparts.co.uk/product-category/automotive-industrial-coatings-ancillaries/body-fillers-stoppers/',
    description: 'Should show body fillers & stoppers category'
  }
];

async function sendChatMessage(query) {
  console.log(`\n🔍 Testing query: "${query}"`);
  console.log('-'.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Origin-Domain': DOMAIN
      },
      body: JSON.stringify({
        message: query,
        conversation_id: generateConversationId(),
        session_id: generateSessionId()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error testing query "${query}":`, error.message);
    return { error: error.message };
  }
}

function generateConversationId() {
  // Generate a proper UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateSessionId() {
  return 'session-' + Math.random().toString(36).substring(2, 15);
}

function analyzeResponse(response, expectedCategory) {
  const analysis = {
    hasError: !!response.error,
    message: response.message || '',
    containsProducts: false,
    containsCategories: false,
    containsExpectedCategory: false,
    asksQuestions: false,
    urls: []
  };

  if (response.error) {
    analysis.error = response.error;
    return analysis;
  }

  const message = analysis.message.toLowerCase();
  
  // Check for question patterns
  analysis.asksQuestions = /\?/.test(analysis.message) || 
    /what.*type|which.*kind|can you.*specify|need more|tell me more/i.test(message);

  // Extract URLs from the response
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const urls = analysis.message.match(urlRegex) || [];
  analysis.urls = urls;

  // Check if contains individual products
  analysis.containsProducts = urls.some(url => url.includes('/product/'));

  // Check if contains category pages
  analysis.containsCategories = urls.some(url => url.includes('/product-category/'));

  // Check if contains the expected category
  if (expectedCategory) {
    analysis.containsExpectedCategory = urls.some(url => 
      url.toLowerCase().includes(expectedCategory.toLowerCase().split('/product-category/')[1])
    );
  }

  return analysis;
}

function printAnalysis(scenario, analysis) {
  console.log(`\n📊 Analysis for "${scenario.name}":`);
  console.log(`Expected: ${scenario.description}`);
  
  if (analysis.hasError) {
    console.log(`❌ Error: ${analysis.error}`);
    return;
  }

  console.log(`✅ Response received (${analysis.message.length} chars)`);
  console.log(`🤔 Asks questions: ${analysis.asksQuestions ? 'Yes' : 'No'}`);
  console.log(`🛍️  Shows products: ${analysis.containsProducts ? 'Yes' : 'No'} (${analysis.urls.filter(url => url.includes('/product/')).length} products)`);
  console.log(`📂 Shows categories: ${analysis.containsCategories ? 'Yes' : 'No'} (${analysis.urls.filter(url => url.includes('/product-category/')).length} categories)`);
  console.log(`🎯 Expected category: ${analysis.containsExpectedCategory ? 'Yes ✅' : 'No ❌'}`);

  if (analysis.urls.length > 0) {
    console.log(`\n🔗 URLs found (${analysis.urls.length}):`);
    analysis.urls.forEach((url, index) => {
      const isProduct = url.includes('/product/');
      const isCategory = url.includes('/product-category/');
      const type = isProduct ? '🛍️ Product' : isCategory ? '📂 Category' : '🌐 Other';
      console.log(`  ${index + 1}. ${type}: ${url}`);
    });
  }

  // Show first 200 characters of response
  console.log(`\n💬 Response preview:`);
  const preview = analysis.message.substring(0, 200) + (analysis.message.length > 200 ? '...' : '');
  console.log(`"${preview}"`)
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  let report = `# Chat Category Query Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Test Environment:** ${API_BASE}\n`;
  report += `**Domain:** ${DOMAIN}\n\n`;

  report += `## Summary\n\n`;
  const total = results.length;
  const successful = results.filter(r => !r.analysis.hasError).length;
  const withExpectedCategory = results.filter(r => r.analysis.containsExpectedCategory).length;
  const askingQuestions = results.filter(r => r.analysis.asksQuestions).length;
  const showingProducts = results.filter(r => r.analysis.containsProducts).length;
  const showingCategories = results.filter(r => r.analysis.containsCategories).length;

  report += `- **Total Tests:** ${total}\n`;
  report += `- **Successful:** ${successful}/${total}\n`;
  report += `- **Shows Expected Category:** ${withExpectedCategory}/${total}\n`;
  report += `- **Asks Questions First:** ${askingQuestions}/${total}\n`;
  report += `- **Shows Products:** ${showingProducts}/${total}\n`;
  report += `- **Shows Categories:** ${showingCategories}/${total}\n\n`;

  report += `## Detailed Results\n\n`;

  results.forEach((result, index) => {
    const { scenario, analysis } = result;
    report += `### ${index + 1}. ${scenario.name}\n\n`;
    report += `**Query:** "${scenario.query}"\n\n`;
    report += `**Expected:** ${scenario.description}\n\n`;

    if (analysis.hasError) {
      report += `**Status:** ❌ Error\n`;
      report += `**Error:** ${analysis.error}\n\n`;
      return;
    }

    report += `**Status:** ✅ Success\n\n`;
    report += `**Behavior Analysis:**\n`;
    report += `- Asks questions first: ${analysis.asksQuestions ? '✅ Yes' : '❌ No'}\n`;
    report += `- Shows products: ${analysis.containsProducts ? '✅ Yes' : '❌ No'} (${analysis.urls.filter(url => url.includes('/product/')).length} products)\n`;
    report += `- Shows categories: ${analysis.containsCategories ? '✅ Yes' : '❌ No'} (${analysis.urls.filter(url => url.includes('/product-category/')).length} categories)\n`;
    report += `- Shows expected category: ${analysis.containsExpectedCategory ? '✅ Yes' : '❌ No'}\n\n`;

    if (analysis.urls.length > 0) {
      report += `**URLs Returned:**\n`;
      analysis.urls.forEach((url, urlIndex) => {
        const isProduct = url.includes('/product/');
        const isCategory = url.includes('/product-category/');
        const type = isProduct ? 'Product' : isCategory ? 'Category' : 'Other';
        report += `${urlIndex + 1}. ${type}: ${url}\n`;
      });
      report += `\n`;
    }

    report += `**Response Preview:**\n`;
    report += `\`\`\`\n${analysis.message.substring(0, 300)}${analysis.message.length > 300 ? '...' : ''}\n\`\`\`\n\n`;
    report += `---\n\n`;
  });

  report += `## Current vs Expected Behavior\n\n`;
  report += `### Current Behavior\n`;
  if (showingProducts > showingCategories) {
    report += `- System primarily shows individual products rather than category pages\n`;
  } else if (showingCategories > showingProducts) {
    report += `- System primarily shows category pages rather than individual products\n`;
  } else {
    report += `- System shows a mix of products and categories\n`;
  }
  
  if (askingQuestions > 0) {
    report += `- System sometimes asks clarifying questions before showing results\n`;
  } else {
    report += `- System immediately shows results without asking questions\n`;
  }

  report += `\n### Expected Behavior\n`;
  report += `- For general category queries, should show relevant category pages\n`;
  report += `- Should guide users to appropriate product categories rather than individual products\n`;
  report += `- Should include full category page URLs for better navigation\n\n`;

  report += `### Recommendations\n`;
  if (withExpectedCategory < total) {
    report += `- Improve category matching to show the most relevant category pages\n`;
  }
  if (showingProducts > showingCategories) {
    report += `- Prioritize category pages over individual products for general queries\n`;
  }
  report += `- Consider asking clarifying questions for ambiguous queries\n`;
  report += `- Ensure category URLs are complete and lead to the most relevant sections\n`;

  return report;
}

async function runTests() {
  console.log('🚀 Starting Chat Category Query Tests');
  console.log(`🌐 Testing against: ${API_BASE}`);
  console.log(`🏢 Domain: ${DOMAIN}`);
  console.log(`📋 Total scenarios: ${TEST_SCENARIOS.length}`);

  const results = [];

  for (const scenario of TEST_SCENARIOS) {
    const response = await sendChatMessage(scenario.query);
    const analysis = analyzeResponse(response, scenario.expectedCategory);
    
    printAnalysis(scenario, analysis);
    
    results.push({
      scenario,
      response,
      analysis
    });

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 GENERATING REPORT');
  console.log('='.repeat(80));

  const report = generateReport(results);
  
  // Save report to file
  const fs = await import('fs');
  const reportFileName = `/Users/jamesguy/Omniops/chat-category-query-test-report.md`;
  fs.writeFileSync(reportFileName, report);
  
  console.log(`\n✅ Test completed!`);
  console.log(`📄 Report saved to: ${reportFileName}`);
  
  // Print summary
  const total = results.length;
  const successful = results.filter(r => !r.analysis.hasError).length;
  const withExpectedCategory = results.filter(r => r.analysis.containsExpectedCategory).length;
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`- Tests run: ${total}`);
  console.log(`- Successful: ${successful}/${total}`);
  console.log(`- Expected categories shown: ${withExpectedCategory}/${total}`);
  
  if (withExpectedCategory === total) {
    console.log(`🎉 All tests passed!`);
  } else {
    console.log(`⚠️  Some improvements needed.`);
  }
}

// Run the tests
runTests().catch(console.error);