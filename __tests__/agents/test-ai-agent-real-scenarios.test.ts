/**
 * End-to-End AI Agent Testing - Real Scenarios
 *
 * Refactored from 322 LOC to 121 LOC (37% reduction)
 * Scenario definitions moved to real-scenarios/scenario-definitions.ts (267 LOC)
 *
 * Tests the AI agent's behavior in realistic user conversations to verify:
 * 1. Tool selection (does it choose the right tools?)
 * 2. Strategy (breadth first, then depth when needed?)
 * 3. Upselling (does it see and suggest related products?)
 * 4. Comparison (can it compare multiple products?)
 * 5. Intelligence (does it make good decisions about when to deep-dive?)
 */

import { createServiceRoleClient } from './lib/supabase-server';
import { scenarios, TestScenario } from './real-scenarios/scenario-definitions';

async function testScenario(scenario: TestScenario, conversationId: string): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SCENARIO: ${scenario.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`User: "${scenario.userMessage}"`);
  console.log(`\nExpected Behavior:`);
  scenario.expectedBehavior.forEach(b => console.log(`  - ${b}`));
  console.log(`\nExpected Tools: ${scenario.expectedTools.join(', ')}`);

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: scenario.userMessage,
        conversationId,
        session_id: conversationId,
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

  const conversationId = `test-${Date.now()}`;
  console.log(`\nConversation ID: ${conversationId}`);

  for (const scenario of scenarios) {
    await testScenario(scenario, conversationId);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('ALL TESTS COMPLETE');
  console.log(`${'='.repeat(80)}\n`);
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
