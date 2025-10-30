/**
 * End-to-End Session Management Test
 * Tests the CartSessionManager with Redis backend
 */

import { CartSessionManager } from './lib/cart-session-manager';
import { getRedisClient } from './lib/redis';

async function testSessionManagement() {
  console.log('🧪 SESSION MANAGEMENT E2E TEST\n');
  console.log('='.repeat(60));

  const sessionManager = new CartSessionManager();
  const domain = 'thompsonseparts.co.uk';
  const results = {
    passed: 0,
    failed: 0,
    tests: [] as { name: string; status: 'PASS' | 'FAIL'; message?: string }[]
  };

  function logTest(name: string, passed: boolean, message?: string) {
    const status = passed ? 'PASS' : 'FAIL';
    results.tests.push({ name, status, message });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}${message ? ': ' + message : ''}`);
    }
  }

  try {
    // Test 1: Create authenticated user session
    console.log('\n📝 Test 1: Create Authenticated User Session');
    const userSession = await sessionManager.getSession('user123', domain);
    logTest(
      'User session created',
      userSession !== null && userSession.userId === 'user123' && !userSession.isGuest
    );
    logTest(
      'Session has nonce',
      userSession.nonce !== null && userSession.nonce.length > 0
    );
    logTest(
      'Session has expiration',
      userSession.expiresAt !== null
    );

    // Test 2: Create guest session
    console.log('\n📝 Test 2: Create Guest Session');
    const guestId = sessionManager.generateGuestId();
    const guestSession = await sessionManager.getSession(guestId, domain);
    logTest(
      'Guest session created',
      guestSession !== null && guestSession.userId === guestId && guestSession.isGuest
    );
    logTest(
      'Guest ID has correct format',
      guestId.startsWith('guest_')
    );

    // Test 3: Verify session persistence (retrieve same session)
    console.log('\n📝 Test 3: Verify Session Persistence');
    const retrievedSession = await sessionManager.getSession('user123', domain);
    logTest(
      'Session persistence works',
      retrievedSession.nonce === userSession.nonce
    );

    // Test 4: Check session existence
    console.log('\n📝 Test 4: Check Session Existence');
    const exists = await sessionManager.hasSession('user123', domain);
    logTest('Session exists check works', exists === true);

    const notExists = await sessionManager.hasSession('nonexistent', domain);
    logTest('Non-existent session check works', notExists === false);

    // Test 5: Get session TTL
    console.log('\n📝 Test 5: Get Session TTL');
    const ttl = await sessionManager.getSessionTTL('user123', domain);
    logTest(
      'Session TTL is valid',
      ttl > 0 && ttl <= 86400
    );

    // Test 6: Update session
    console.log('\n📝 Test 6: Update Session');
    const updatedSession = await sessionManager.updateSession(
      'user123',
      domain,
      { nonce: 'updated-nonce-12345' }
    );
    logTest(
      'Session update works',
      updatedSession !== null && updatedSession.nonce === 'updated-nonce-12345'
    );

    // Test 7: Extend session
    console.log('\n📝 Test 7: Extend Session');
    const oldTtl = await sessionManager.getSessionTTL('user123', domain);
    await sessionManager.extendSession('user123', domain, 3600); // Add 1 hour
    const newTtl = await sessionManager.getSessionTTL('user123', domain);
    logTest(
      'Session extension works',
      newTtl > oldTtl
    );

    // Test 8: List domain sessions
    console.log('\n📝 Test 8: List Domain Sessions');
    const sessions = await sessionManager.listDomainSessions(domain);
    logTest(
      'List domain sessions works',
      sessions.length >= 2 // At least user123 and guest
    );

    // Test 9: Clear session
    console.log('\n📝 Test 9: Clear Session');
    await sessionManager.clearSession('user123', domain);
    const clearedExists = await sessionManager.hasSession('user123', domain);
    logTest('Session cleared successfully', clearedExists === false);

    // Test 10: Concurrent session creation (stress test)
    console.log('\n📝 Test 10: Concurrent Session Creation (50 users)');
    const startTime = Date.now();
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(sessionManager.getSession(`user-${i}`, domain));
    }
    const concurrentSessions = await Promise.all(promises);
    const duration = Date.now() - startTime;

    logTest(
      'Concurrent session creation works',
      concurrentSessions.length === 50
    );
    logTest(
      'All sessions unique',
      new Set(concurrentSessions.map(s => s.nonce)).size === 50
    );
    logTest(
      'Performance acceptable',
      duration < 5000,
      `${duration}ms for 50 sessions (avg: ${(duration / 50).toFixed(2)}ms/session)`
    );

    // Cleanup concurrent sessions
    for (let i = 0; i < 50; i++) {
      await sessionManager.clearSession(`user-${i}`, domain);
    }
    await sessionManager.clearSession(guestId, domain);

  } catch (error) {
    console.error('\n💥 Fatal error during session management tests:', error);
    results.failed++;
    results.tests.push({
      name: 'Fatal error',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  - ${t.name}${t.message ? ': ' + t.message : ''}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
testSessionManagement().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
