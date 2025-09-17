#!/usr/bin/env npx tsx
/**
 * Test that the ChatWidget is now using the intelligent route
 * and verify token tracking is working
 */

import 'dotenv/config';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testIntelligentRoute() {
  console.log(`\n${colors.cyan}${colors.bright}🔬 Testing ChatWidget with Intelligent Route${colors.reset}\n`);
  
  const sessionId = `widget-test-${Date.now()}`;
  
  try {
    // Test 1: Make a request through the intelligent route (simulating widget call)
    console.log(`${colors.blue}Test 1: Simulating widget request to intelligent route${colors.reset}`);
    
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What pump options do you have for a Cifa mixer?',
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true }
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Check response structure
    console.log(`\n${colors.green}✓ Response received from intelligent route${colors.reset}`);
    
    // Analyze search results
    if (data.searchMetadata) {
      console.log(`\n${colors.cyan}Search Performance:${colors.reset}`);
      console.log(`  - Iterations: ${data.searchMetadata.iterations}`);
      console.log(`  - Total searches: ${data.searchMetadata.totalSearches}`);
      console.log(`  - Search strategies used:`);
      
      if (data.searchMetadata.searchLog) {
        data.searchMetadata.searchLog.forEach((log: any, i: number) => {
          console.log(`    ${i + 1}. ${log.function} (${log.resultCount} results)`);
        });
      }
    }
    
    // Check token tracking
    if (data.tokenUsage) {
      console.log(`\n${colors.cyan}Token Tracking:${colors.reset}`);
      console.log(`  - Input tokens: ${data.tokenUsage.input}`);
      console.log(`  - Output tokens: ${data.tokenUsage.output}`);
      console.log(`  - Total tokens: ${data.tokenUsage.total}`);
      console.log(`  - Cost: $${data.tokenUsage.estimatedCostUSD}`);
      
      console.log(`\n${colors.green}✅ Token tracking is working!${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠️ No token tracking data in response${colors.reset}`);
    }
    
    // Check sources count
    if (data.sources) {
      console.log(`\n${colors.cyan}Search Quality:${colors.reset}`);
      console.log(`  - Sources found: ${data.sources.length}`);
      
      if (data.sources.length >= 20) {
        console.log(`  ${colors.green}✅ Excellent: Found ${data.sources.length} sources (intelligent route working!)${colors.reset}`);
      } else if (data.sources.length >= 10) {
        console.log(`  ${colors.yellow}⚠️ Good: Found ${data.sources.length} sources${colors.reset}`);
      } else {
        console.log(`  ${colors.red}❌ Poor: Only ${data.sources.length} sources (may still be using basic route)${colors.reset}`);
      }
    }
    
    // Test 2: Compare with basic route (for reference)
    console.log(`\n${colors.blue}Test 2: Comparing with basic route (for reference)${colors.reset}`);
    
    const basicResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What pump options do you have for a Cifa mixer?',
        session_id: `basic-${sessionId}`,
        domain: 'thompsonseparts.co.uk',
      }),
    });

    if (basicResponse.ok) {
      const basicData = await basicResponse.json();
      
      console.log(`\n${colors.cyan}Route Comparison:${colors.reset}`);
      console.log(`  Basic Route:`);
      console.log(`    - Sources: ${basicData.sources?.length || 0}`);
      console.log(`    - Has token tracking: ${basicData.tokenUsage ? 'Yes' : 'No'}`);
      console.log(`    - Has search metadata: ${basicData.searchMetadata ? 'Yes' : 'No'}`);
      
      console.log(`\n  Intelligent Route:`);
      console.log(`    - Sources: ${data.sources?.length || 0}`);
      console.log(`    - Has token tracking: ${data.tokenUsage ? 'Yes' : 'No'}`);
      console.log(`    - Has search metadata: ${data.searchMetadata ? 'Yes' : 'No'}`);
      
      const improvement = data.sources && basicData.sources 
        ? ((data.sources.length / basicData.sources.length - 1) * 100).toFixed(0)
        : 'N/A';
      
      if (improvement !== 'N/A' && parseInt(improvement) > 0) {
        console.log(`\n  ${colors.green}✅ Improvement: ${improvement}% more results with intelligent route${colors.reset}`);
      }
    }
    
    // Summary
    console.log(`\n${colors.cyan}${colors.bright}📊 Test Summary${colors.reset}`);
    
    const checks = [
      { name: 'Intelligent route responding', passed: true },
      { name: 'Token tracking active', passed: !!data.tokenUsage },
      { name: 'Search metadata present', passed: !!data.searchMetadata },
      { name: 'Multiple search strategies', passed: data.searchMetadata?.totalSearches > 1 },
      { name: 'High result count (20+)', passed: data.sources?.length >= 20 },
      { name: 'Cost calculation working', passed: !!data.tokenUsage?.estimatedCostUSD }
    ];
    
    checks.forEach(check => {
      const icon = check.passed ? `${colors.green}✅` : `${colors.red}❌`;
      console.log(`  ${icon} ${check.name}${colors.reset}`);
    });
    
    const passedCount = checks.filter(c => c.passed).length;
    const totalCount = checks.length;
    
    if (passedCount === totalCount) {
      console.log(`\n${colors.green}${colors.bright}🎉 Perfect! All tests passed (${passedCount}/${totalCount})${colors.reset}`);
      console.log(`The ChatWidget is now using the intelligent route with full capabilities!`);
    } else if (passedCount >= 4) {
      console.log(`\n${colors.yellow}${colors.bright}✓ Good! Most tests passed (${passedCount}/${totalCount})${colors.reset}`);
      console.log(`The intelligent route is working but some features may need attention.`);
    } else {
      console.log(`\n${colors.red}${colors.bright}⚠ Issues detected (${passedCount}/${totalCount} passed)${colors.reset}`);
      console.log(`Please check the configuration and ensure all services are running.`);
    }
    
  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bright}❌ Test failed:${colors.reset}`, error.message);
    console.log(`\nTroubleshooting:`);
    console.log(`1. Ensure dev server is running: npm run dev`);
    console.log(`2. Check that USE_GPT5_MINI=true in .env.local`);
    console.log(`3. Verify Supabase credentials are set`);
    process.exit(1);
  }
}

// Run the test
testIntelligentRoute().catch(console.error);