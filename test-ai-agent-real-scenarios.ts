/**
 * End-to-End AI Agent Testing - Real Scenarios
 *
 * Tests the AI agent's behavior in realistic user conversations to verify:
 * 1. Tool selection (does it choose the right tools?)
 * 2. Strategy (breadth first, then depth when needed?)
 * 3. Upselling (does it see and suggest related products?)
 * 4. Comparison (can it compare multiple products?)
 * 5. Intelligence (does it make good decisions about when to deep-dive?)
 */

import { createServiceRoleClient } from './lib/supabase-server';

interface TestScenario {
  name: string;
  userMessage: string;
  expectedBehavior: string[];
  expectedTools: string[];
  checkResponse: (response: string, toolCalls: any[]) => {
    passed: boolean;
    issues: string[];
    strengths: string[];
  };
}

const scenarios: TestScenario[] = [
  {
    name: "Simple Product Query",
    userMessage: "Do you have 10mtr extension cables?",
    expectedBehavior: [
      "Should call search_products or get_product_details",
      "Should find the 10mtr cable",
      "Should mention price (£25.98)",
      "Should mention availability"
    ],
    expectedTools: ["search_products", "get_product_details"],
    checkResponse: (response, toolCalls) => {
      const issues: string[] = [];
      const strengths: string[] = [];

      // Check if AI called appropriate tools
      const calledTools = toolCalls.map(tc => tc.function?.name).filter(Boolean);
      const calledSearchOrDetails = calledTools.some(t =>
        t === 'search_products' || t === 'get_product_details'
      );

      if (!calledSearchOrDetails) {
        issues.push("AI did not call search_products or get_product_details");
      } else {
        strengths.push(`AI called: ${calledTools.join(', ')}`);
      }

      // Check response content
      const lowerResponse = response.toLowerCase();

      if (lowerResponse.includes('10') && lowerResponse.includes('mtr')) {
        strengths.push("Response mentions 10mtr");
      } else {
        issues.push("Response doesn't mention 10mtr");
      }

      if (lowerResponse.includes('25.98') || lowerResponse.includes('£25')) {
        strengths.push("Response includes price");
      } else {
        issues.push("Response missing price information");
      }

      return {
        passed: issues.length === 0,
        issues,
        strengths
      };
    }
  },

  {
    name: "Comparison Request",
    userMessage: "Compare 10mtr vs 20mtr extension cables for me",
    expectedBehavior: [
      "Should call search_products to see both products",
      "MAY call get_complete_page_details for each product",
      "Should compare prices",
      "Should compare features/specs",
      "Should help user decide"
    ],
    expectedTools: ["search_products", "get_product_details", "get_complete_page_details"],
    checkResponse: (response, toolCalls) => {
      const issues: string[] = [];
      const strengths: string[] = [];
      const calledTools = toolCalls.map(tc => tc.function?.name).filter(Boolean);

      // Check tool strategy
      if (calledTools.includes('search_products')) {
        strengths.push("AI used search_products (breadth strategy)");
      }

      if (calledTools.includes('get_complete_page_details')) {
        strengths.push("AI used get_complete_page_details for depth");
      }

      const lowerResponse = response.toLowerCase();

      // Check if both products mentioned
      const mentions10 = lowerResponse.includes('10') && lowerResponse.includes('mtr');
      const mentions20 = lowerResponse.includes('20') && lowerResponse.includes('mtr');

      if (mentions10 && mentions20) {
        strengths.push("Response mentions both products");
      } else {
        if (!mentions10) issues.push("Response missing 10mtr");
        if (!mentions20) issues.push("Response missing 20mtr");
      }

      // Check if comparison is made
      if (lowerResponse.includes('comparison') ||
          lowerResponse.includes('compare') ||
          lowerResponse.includes('difference') ||
          lowerResponse.includes('whereas') ||
          lowerResponse.includes('while')) {
        strengths.push("Response provides comparison language");
      } else {
        issues.push("Response doesn't clearly compare products");
      }

      return {
        passed: issues.length <= 1, // Allow 1 minor issue
        issues,
        strengths
      };
    }
  },

  {
    name: "Upselling Opportunity",
    userMessage: "I need 10mtr cables",
    expectedBehavior: [
      "Should call search_products (sees multiple products)",
      "Should mention 10mtr cable",
      "Should suggest related products (20mtr, 5mtr, accessories)",
      "Should provide helpful alternatives"
    ],
    expectedTools: ["search_products"],
    checkResponse: (response, toolCalls) => {
      const issues: string[] = [];
      const strengths: string[] = [];
      const calledTools = toolCalls.map(tc => tc.function?.name).filter(Boolean);

      if (calledTools.includes('search_products')) {
        strengths.push("AI used search_products (can see related products)");
      } else {
        issues.push("AI didn't use search_products for breadth");
      }

      const lowerResponse = response.toLowerCase();

      // Check for primary product
      if (lowerResponse.includes('10') && lowerResponse.includes('mtr')) {
        strengths.push("Response mentions requested product");
      }

      // Check for upselling/alternatives
      const mentionsAlternatives =
        lowerResponse.includes('also') ||
        lowerResponse.includes('alternative') ||
        lowerResponse.includes('20mtr') ||
        lowerResponse.includes('5mtr') ||
        lowerResponse.includes('addition');

      if (mentionsAlternatives) {
        strengths.push("Response suggests related products (good upselling)");
      } else {
        issues.push("Response missed upselling opportunity");
      }

      return {
        passed: issues.length <= 1,
        issues,
        strengths
      };
    }
  },

  {
    name: "Deep Technical Query",
    userMessage: "Tell me everything about the 10mtr extension cables - full specifications, compatibility, installation",
    expectedBehavior: [
      "Should recognize need for complete details",
      "MAY call get_complete_page_details",
      "Should provide comprehensive information",
      "Should include specs, compatibility, installation details"
    ],
    expectedTools: ["get_product_details", "get_complete_page_details"],
    checkResponse: (response, toolCalls) => {
      const issues: string[] = [];
      const strengths: string[] = [];
      const calledTools = toolCalls.map(tc => tc.function?.name).filter(Boolean);

      // Check if AI called depth tools
      if (calledTools.includes('get_complete_page_details')) {
        strengths.push("AI called get_complete_page_details (smart depth strategy)");
      }

      if (calledTools.includes('get_product_details')) {
        strengths.push("AI called get_product_details");
      }

      const lowerResponse = response.toLowerCase();

      // Check for comprehensive information
      const hasSpecs = lowerResponse.includes('spec') ||
                       lowerResponse.includes('technical') ||
                       lowerResponse.includes('feature');
      const hasCompat = lowerResponse.includes('compat') ||
                        lowerResponse.includes('work') ||
                        lowerResponse.includes('system');
      const hasInstall = lowerResponse.includes('install') ||
                         lowerResponse.includes('connect') ||
                         lowerResponse.includes('setup');

      if (hasSpecs) strengths.push("Response includes specifications");
      else issues.push("Response missing specifications");

      if (hasCompat) strengths.push("Response includes compatibility info");
      else issues.push("Response missing compatibility info");

      if (hasInstall) strengths.push("Response includes installation info");
      else issues.push("Response missing installation info");

      // Check response length (should be comprehensive)
      if (response.length > 300) {
        strengths.push("Response is comprehensive (300+ chars)");
      } else {
        issues.push("Response too short for 'tell me everything' query");
      }

      return {
        passed: issues.length <= 2, // Allow up to 2 issues for complex query
        issues,
        strengths
      };
    }
  },

  {
    name: "Browsing Behavior",
    userMessage: "What cables do you have?",
    expectedBehavior: [
      "Should call search_products with broad query",
      "Should list multiple cable options",
      "Should show variety (10mtr, 20mtr, etc.)",
      "Should invite user to ask for more details"
    ],
    expectedTools: ["search_products"],
    checkResponse: (response, toolCalls) => {
      const issues: string[] = [];
      const strengths: string[] = [];
      const calledTools = toolCalls.map(tc => tc.function?.name).filter(Boolean);

      if (calledTools.includes('search_products')) {
        strengths.push("AI used search_products for browsing");
      } else {
        issues.push("AI should use search_products for broad queries");
      }

      const lowerResponse = response.toLowerCase();

      // Count product mentions
      const mentions10 = lowerResponse.includes('10');
      const mentions20 = lowerResponse.includes('20');
      const mentions5 = lowerResponse.includes('5');
      const productMentions = [mentions10, mentions20, mentions5].filter(Boolean).length;

      if (productMentions >= 2) {
        strengths.push(`Response shows variety (${productMentions} different cables)`);
      } else {
        issues.push("Response should show multiple cable options");
      }

      // Check if inviting follow-up
      if (lowerResponse.includes('more') ||
          lowerResponse.includes('detail') ||
          lowerResponse.includes('specific') ||
          lowerResponse.includes('let me know') ||
          lowerResponse.includes('tell me')) {
        strengths.push("Response invites follow-up questions");
      }

      return {
        passed: issues.length === 0,
        issues,
        strengths
      };
    }
  }
];

async function testScenario(scenario: TestScenario, conversationId: string): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SCENARIO: ${scenario.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`User: "${scenario.userMessage}"`);
  console.log(`\nExpected Behavior:`);
  scenario.expectedBehavior.forEach(b => console.log(`  - ${b}`));
  console.log(`\nExpected Tools: ${scenario.expectedTools.join(', ')}`);

  try {
    // Call the chat API
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: scenario.userMessage,
        conversationId,
        session_id: conversationId, // Required field
        domain: 'thompsonseparts.co.uk'
      })
    });

    if (!response.ok) {
      console.error(`\n❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText.substring(0, 500)}`);
      return;
    }

    const data = await response.json();
    const aiResponse = data.response || data.message || '';
    const toolCalls = data.metadata?.toolCalls || [];

    console.log(`\n--- AI RESPONSE ---`);
    console.log(aiResponse);

    console.log(`\n--- TOOLS CALLED ---`);
    if (toolCalls.length === 0) {
      console.log('(No tools called)');
    } else {
      toolCalls.forEach((tc: any, i: number) => {
        const toolName = tc.function?.name || tc.name || 'unknown';
        const args = JSON.stringify(tc.function?.arguments || tc.arguments || {});
        console.log(`${i + 1}. ${toolName}`);
        console.log(`   Args: ${args.substring(0, 100)}${args.length > 100 ? '...' : ''}`);
      });
    }

    // Run test checks
    const result = scenario.checkResponse(aiResponse, toolCalls);

    console.log(`\n--- TEST RESULTS ---`);
    console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (result.strengths.length > 0) {
      console.log(`\n✅ Strengths:`);
      result.strengths.forEach(s => console.log(`  - ${s}`));
    }

    if (result.issues.length > 0) {
      console.log(`\n⚠️ Issues:`);
      result.issues.forEach(i => console.log(`  - ${i}`));
    }

  } catch (error: any) {
    console.error(`\n❌ TEST ERROR: ${error.message}`);
    console.error(error.stack);
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  AI AGENT REAL-WORLD TESTING - End-to-End Scenarios                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\nTesting AI agent behavior with the dual strategy:');
  console.log('  - Breadth: 15 scattered chunks (comparisons, upselling)');
  console.log('  - Depth: Optional get_complete_page_details (when AI decides)');

  // Check if dev server is running
  console.log('\n⏳ Checking if dev server is running on http://localhost:3000...');
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health');
    if (healthCheck.ok) {
      console.log('✅ Dev server is running!');
    }
  } catch (error) {
    console.error('\n❌ ERROR: Dev server is not running!');
    console.error('Please run: npm run dev');
    console.error('Then run this test again.\n');
    process.exit(1);
  }

  // Create a conversation ID for continuity
  const conversationId = `test-${Date.now()}`;
  console.log(`\nConversation ID: ${conversationId}`);

  // Run each scenario
  for (const scenario of scenarios) {
    await testScenario(scenario, conversationId);

    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('ALL TESTS COMPLETE');
  console.log(`${'='.repeat(80)}\n`);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
