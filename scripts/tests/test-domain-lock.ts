import { DomainRefreshLock } from '@/lib/domain-refresh-lock';

async function testDomainLock() {
  const lock = new DomainRefreshLock();
  const testDomainId = 'test-domain-123';
  let passedTests = 0;
  const totalTests = 5;

  console.log('🧪 Testing Domain Refresh Lock...\n');

  try {
    // Test 1: Acquire lock
    console.log('Test 1: First acquire should succeed');
    const acquired1 = await lock.acquire(testDomainId);
    if (acquired1) {
      console.log('✅ PASS - Lock acquired successfully\n');
      passedTests++;
    } else {
      console.log('❌ FAIL - First acquire should have succeeded\n');
    }

    // Test 2: Second acquire should fail (lock already held)
    console.log('Test 2: Second acquire should be blocked');
    const acquired2 = await lock.acquire(testDomainId);
    if (!acquired2) {
      console.log('✅ PASS - Second acquire blocked as expected\n');
      passedTests++;
    } else {
      console.log('❌ FAIL - Second acquire should have been blocked\n');
    }

    // Test 3: Check lock status
    console.log('Test 3: Lock status check');
    const isLocked = await lock.isLocked(testDomainId);
    const timeRemaining = await lock.getTimeRemaining(testDomainId);
    if (isLocked && timeRemaining > 0 && timeRemaining <= 300) {
      console.log(`✅ PASS - Lock status correct (${timeRemaining}s remaining)\n`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Lock status incorrect (isLocked: ${isLocked}, timeRemaining: ${timeRemaining})\n`);
    }

    // Test 4: Release lock
    console.log('Test 4: Lock release');
    await lock.release(testDomainId);
    const isLockedAfter = await lock.isLocked(testDomainId);
    if (!isLockedAfter) {
      console.log('✅ PASS - Lock released successfully\n');
      passedTests++;
    } else {
      console.log('❌ FAIL - Lock should have been released\n');
    }

    // Test 5: Can acquire after release
    console.log('Test 5: Acquire after release');
    const acquired3 = await lock.acquire(testDomainId);
    if (acquired3) {
      console.log('✅ PASS - Can acquire lock after release\n');
      passedTests++;
    } else {
      console.log('❌ FAIL - Should be able to acquire after release\n');
    }

    // Cleanup
    await lock.release(testDomainId);
    console.log('🧹 Cleanup complete\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log(`Test Results: ${passedTests}/${totalTests} passed`);
    console.log('═══════════════════════════════════════');

    if (passedTests === totalTests) {
      console.log('✅ All tests PASSED! Domain lock is working correctly.\n');
      process.exit(0);
    } else {
      console.log(`❌ ${totalTests - passedTests} test(s) FAILED!\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test execution error:', error);
    // Cleanup on error
    try {
      await lock.release(testDomainId);
    } catch (cleanupError) {
      console.error('Failed to cleanup lock:', cleanupError);
    }
    process.exit(1);
  }
}

// Run tests
testDomainLock().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
