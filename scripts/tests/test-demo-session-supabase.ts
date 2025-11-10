#!/usr/bin/env npx tsx

/**
 * Test Demo Session Flow - Supabase Only
 *
 * This script tests the demo session flow WITHOUT Redis
 * to simulate production environment where Redis might not be available.
 */

import { saveDemoSession, getDemoSession, deleteDemoSession, DemoSessionData } from '@/lib/demo-session-store';

const TEST_SESSION_ID = `test_supabase_${Date.now()}_${Math.random().toString(36).substring(7)}`;

// Temporarily disable Redis for this test
const originalRedisUrl = process.env.REDIS_URL;

async function runTest() {
  try {
    // Disable Redis to force Supabase usage
    delete process.env.REDIS_URL;

    console.log('🧪 Starting Demo Session Flow Test (Supabase Only)\n');
    console.log(`Test Session ID: ${TEST_SESSION_ID}\n`);
    console.log('⚠️  Redis disabled - forcing Supabase storage\n');

    // Step 1: Create test session data
    console.log('📝 Step 1: Creating test session data...');
    const testSessionData: DemoSessionData = {
      url: 'https://example.com',
      domain: 'example.com',
      pages: [
        {
          url: 'https://example.com',
          title: 'Example Page',
          content: 'This is test content for Supabase'
        }
      ],
      chunks: ['chunk1', 'chunk2', 'chunk3'],
      embeddings: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.7, 0.8, 0.9]],
      metadata: { test: true, storage: 'supabase' },
      created_at: Date.now(),
      expires_at: Date.now() + (10 * 60 * 1000), // 10 minutes
      message_count: 0,
      max_messages: 20
    };
    console.log('✅ Test session data created\n');

    // Step 2: Save the session
    console.log('💾 Step 2: Saving session to Supabase...');
    await saveDemoSession(TEST_SESSION_ID, testSessionData);
    console.log('✅ Session saved\n');

    // Wait for Supabase to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Retrieve the session
    console.log('🔍 Step 3: Retrieving session from Supabase...');
    const retrievedSession = await getDemoSession(TEST_SESSION_ID);
    console.log('✅ Session retrieved\n');

    // Step 4: Verify session data
    console.log('✔️  Step 4: Verifying session data...');
    if (!retrievedSession) {
      console.error('❌ FAILED: Session not found in Supabase!');
      console.log('\n🔍 Debugging Info:');
      console.log('- Session ID:', TEST_SESSION_ID);
      console.log('- REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
      console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
      console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
      process.exit(1);
    }

    const checks = [
      { name: 'URL', expected: testSessionData.url, actual: retrievedSession.url },
      { name: 'Domain', expected: testSessionData.domain, actual: retrievedSession.domain },
      { name: 'Message count', expected: 0, actual: retrievedSession.message_count },
    ];

    let allChecksPassed = true;
    for (const check of checks) {
      if (check.expected === check.actual) {
        console.log(`  ✅ ${check.name}: ${check.actual}`);
      } else {
        console.log(`  ❌ ${check.name}: Expected ${check.expected}, got ${check.actual}`);
        allChecksPassed = false;
      }
    }

    if (!allChecksPassed) {
      console.error('\n❌ FAILED: Supabase data verification failed');
      process.exit(1);
    }
    console.log('✅ All data verification checks passed\n');

    // Step 5: Update message count
    console.log('🔄 Step 5: Updating message count...');
    retrievedSession.message_count = 5;
    await saveDemoSession(TEST_SESSION_ID, retrievedSession);
    console.log('✅ Message count updated\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Re-retrieve and verify update
    console.log('🔍 Step 6: Re-retrieving session...');
    const updatedSession = await getDemoSession(TEST_SESSION_ID);
    if (!updatedSession) {
      console.error('❌ FAILED: Updated session not found!');
      process.exit(1);
    }

    if (updatedSession.message_count !== 5) {
      console.error(`❌ FAILED: Message count not updated (expected 5, got ${updatedSession.message_count})`);
      process.exit(1);
    }
    console.log(`✅ Message count verified: ${updatedSession.message_count}\n`);

    // Step 7: Cleanup
    console.log('🗑️  Step 7: Cleaning up...');
    await deleteDemoSession(TEST_SESSION_ID);
    console.log('✅ Session deleted\n');

    console.log('🎉 ALL TESTS PASSED!');
    console.log('\n✅ Demo session flow works correctly with Supabase storage');

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error);
    console.log('\n🔍 Error Details:');
    console.log('- Message:', error instanceof Error ? error.message : String(error));
    console.log('- Stack:', error instanceof Error ? error.stack : 'N/A');
    process.exit(1);
  } finally {
    // Restore Redis URL
    if (originalRedisUrl) {
      process.env.REDIS_URL = originalRedisUrl;
    }
  }
}

runTest();
