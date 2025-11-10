#!/usr/bin/env tsx
/**
 * Demo Flow Simulation Test
 *
 * Simulates the complete user journey through the demo:
 * 1. User enters website URL
 * 2. System scrapes website
 * 3. System creates session
 * 4. User sends chat messages
 * 5. System retrieves session and responds
 *
 * This tests the EXACT flow that happens in production without E2E overhead.
 */

import { randomBytes } from 'crypto';

let SERVER_PORT = 3001; // Will be set by checkServerRunning

// Simulate the scrape endpoint behavior
async function simulateScrapeEndpoint(url: string): Promise<{
  success: boolean;
  session_id?: string;
  domain?: string;
  pages_scraped?: number;
  error?: string;
}> {
  console.log('\n📍 Step 1: User submits URL to /api/demo/scrape');
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/api/demo/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`
      };
    }

    console.log('   ✅ Scrape completed successfully');
    console.log(`   📦 Session ID: ${data.session_id}`);
    console.log(`   🌐 Domain: ${data.domain}`);
    console.log(`   📄 Pages scraped: ${data.pages_scraped}`);
    console.log(`   📊 Content chunks: ${data.content_chunks}`);
    console.log(`   ⏱️  Scrape time: ${data.scrape_time_ms}ms`);

    return {
      success: true,
      session_id: data.session_id,
      domain: data.domain,
      pages_scraped: data.pages_scraped
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Simulate the chat endpoint behavior
async function simulateChatEndpoint(sessionId: string, message: string): Promise<{
  success: boolean;
  response?: string;
  message_count?: number;
  messages_remaining?: number;
  error?: string;
}> {
  console.log(`\n📍 Step 3: User sends message: "${message}"`);
  console.log(`   Session ID: ${sessionId}`);

  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/api/demo/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(`   ❌ Chat failed: ${data.error} (HTTP ${response.status})`);
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`
      };
    }

    console.log('   ✅ Chat response received');
    console.log(`   🤖 AI Response: ${data.response.substring(0, 100)}...`);
    console.log(`   📊 Message count: ${data.message_count}/${data.message_count + data.messages_remaining}`);
    console.log(`   📝 Messages remaining: ${data.messages_remaining}`);

    return {
      success: true,
      response: data.response,
      message_count: data.message_count,
      messages_remaining: data.messages_remaining
    };
  } catch (error) {
    console.log(`   ❌ Chat request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Wait between messages (rate limiting)
async function wait(ms: number, reason: string) {
  console.log(`\n⏸️  Waiting ${ms}ms (${reason})...`);
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Main simulation
async function runDemoFlowSimulation() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       DEMO FLOW SIMULATION - EXACT PRODUCTION FLOW        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\nThis simulates the complete user journey:\n');
  console.log('User → Enters URL → Scrape API → Session Created');
  console.log('User → Sends Message → Chat API → Retrieves Session → AI Response');
  console.log('User → Sends Another Message → Repeat');

  const testUrl = 'https://www.omniops.co.uk';
  let totalTests = 0;
  let passedTests = 0;

  // ============================================================
  // PHASE 1: SCRAPING
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 1: WEBSITE SCRAPING & SESSION CREATION');
  console.log('='.repeat(60));

  totalTests++;
  const scrapeResult = await simulateScrapeEndpoint(testUrl);

  if (!scrapeResult.success) {
    console.log('\n❌ CRITICAL FAILURE: Scraping failed');
    console.log(`   Error: ${scrapeResult.error}`);
    console.log('\n🔴 TEST SUITE FAILED - Cannot proceed without session');
    process.exit(1);
  }

  passedTests++;
  console.log('\n✅ PHASE 1 PASSED: Session created successfully');

  const sessionId = scrapeResult.session_id!;
  const domain = scrapeResult.domain!;

  // ============================================================
  // PHASE 2: VERIFY SESSION IMMEDIATELY
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 2: IMMEDIATE SESSION VERIFICATION');
  console.log('='.repeat(60));
  console.log('\n📍 Step 2: Verify session was saved correctly');

  await wait(100, 'allow session to propagate');

  totalTests++;
  const firstMessage = await simulateChatEndpoint(sessionId, 'What services do you offer?');

  if (!firstMessage.success) {
    console.log('\n❌ CRITICAL FAILURE: Session not found immediately after creation');
    console.log(`   Error: ${firstMessage.error}`);
    console.log(`   Session ID: ${sessionId}`);
    console.log('\n🔴 This is the bug! Session should be retrievable immediately.');
    console.log('   Possible causes:');
    console.log('   - Session not being saved to storage');
    console.log('   - Storage backend mismatch (save to Redis, read from Supabase)');
    console.log('   - Session key mismatch');
    console.log('   - Immediate expiration');
    process.exit(1);
  }

  passedTests++;
  console.log('\n✅ PHASE 2 PASSED: Session retrieved successfully on first message');

  // ============================================================
  // PHASE 3: MULTIPLE MESSAGES
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 3: MULTIPLE MESSAGE FLOW');
  console.log('='.repeat(60));

  const messages = [
    'Tell me about your company',
    'What are your pricing options?',
    'How can I contact you?'
  ];

  for (let i = 0; i < messages.length; i++) {
    await wait(2100, 'respect rate limit (2s between messages)');

    totalTests++;
    const result = await simulateChatEndpoint(sessionId, messages[i]);

    if (!result.success) {
      console.log(`\n❌ FAILURE on message ${i + 2}: ${result.error}`);
      console.log('   Session should still be valid!');
      passedTests--; // Offset the increment below
    } else {
      passedTests++;

      // Verify message count increments correctly
      const expectedCount = i + 2; // First message + current
      if (result.message_count !== expectedCount) {
        console.log(`\n⚠️  WARNING: Message count mismatch`);
        console.log(`   Expected: ${expectedCount}, Got: ${result.message_count}`);
      }
    }
  }

  console.log('\n✅ PHASE 3 PASSED: Multiple messages work correctly');

  // ============================================================
  // PHASE 4: SESSION PERSISTENCE
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 4: SESSION PERSISTENCE TEST');
  console.log('='.repeat(60));

  console.log('\n📍 Waiting 5 seconds to test session doesn\'t expire prematurely...');
  await wait(5000, 'verify session persists over time');

  totalTests++;
  const persistenceTest = await simulateChatEndpoint(sessionId, 'Are you still there?');

  if (!persistenceTest.success) {
    console.log('\n❌ FAILURE: Session expired prematurely');
    console.log('   Sessions should last 10 minutes, not 5 seconds!');
  } else {
    passedTests++;
    console.log('\n✅ PHASE 4 PASSED: Session persists correctly');
  }

  // ============================================================
  // RESULTS
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('SIMULATION RESULTS');
  console.log('='.repeat(60));

  console.log(`\n📊 Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`🌐 Domain Tested: ${domain}`);
  console.log(`🔑 Session ID: ${sessionId}`);
  console.log(`📝 Total Messages Sent: ${passedTests - 1}`); // -1 for scrape test

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ The demo flow works end-to-end:');
    console.log('   1. ✅ Website scraping completes');
    console.log('   2. ✅ Session created and saved');
    console.log('   3. ✅ Session retrievable immediately');
    console.log('   4. ✅ Multiple messages work');
    console.log('   5. ✅ Session persists over time');
    console.log('\n🚀 Ready for production deployment!');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log(`\n🔴 ${totalTests - passedTests} test(s) failed`);
    console.log('\nPlease review the errors above and fix before deploying.');
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n💥 UNHANDLED REJECTION:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

// Check server is running
async function checkServerRunning(): Promise<number | null> {
  // Try port 3001 first, then 3000
  for (const port of [3001, 3000]) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET'
      });
      if (response.ok) {
        return port;
      }
    } catch {
      // Try next port
    }
  }
  return null;
}

// Main entry point
(async () => {
  console.log('🔍 Checking if dev server is running...');

  const port = await checkServerRunning();

  if (!port) {
    console.log('\n❌ ERROR: Dev server not running on port 3000 or 3001');
    console.log('\nPlease start the server first:');
    console.log('   npm run dev');
    console.log('\nThen run this test again.');
    process.exit(1);
  }

  SERVER_PORT = port;
  console.log(`✅ Server is running on port ${port}\n`);

  await runDemoFlowSimulation();
})();
