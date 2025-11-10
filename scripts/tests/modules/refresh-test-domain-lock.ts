/**
 * Phase 3: Domain Lock Testing
 */

import { DomainRefreshLock } from '@/lib/domain-refresh-lock';

export async function testPhase3_DomainLock(logTest: Function): Promise<void> {
  console.log('\n📋 Phase 3: Domain Refresh Lock\n');

  const lock = new DomainRefreshLock();
  const testDomainId = 'test-e2e-domain-' + Date.now();

  try {
    // Test 1: Can acquire lock
    const acquired1 = await lock.acquire(testDomainId);
    logTest(
      'Phase 3',
      'Lock acquisition',
      acquired1,
      acquired1 ? 'PASS: Lock acquired' : 'FAIL: Could not acquire lock'
    );

    // Test 2: Second acquire is blocked
    const acquired2 = await lock.acquire(testDomainId);
    logTest(
      'Phase 3',
      'Lock prevents duplicates',
      !acquired2,
      acquired2 ? 'FAIL: Lock not preventing duplicates!' : 'PASS: Duplicate blocked'
    );

    // Test 3: Can check lock status
    const isLocked = await lock.isLocked(testDomainId);
    logTest(
      'Phase 3',
      'Lock status check',
      isLocked,
      isLocked ? 'PASS: Lock status correct' : 'FAIL: Lock status wrong'
    );

    // Test 4: Can release lock
    await lock.release(testDomainId);
    const isLockedAfter = await lock.isLocked(testDomainId);
    logTest(
      'Phase 3',
      'Lock release',
      !isLockedAfter,
      isLockedAfter ? 'FAIL: Lock not released' : 'PASS: Lock released'
    );

    // Test 5: Can re-acquire after release
    const acquired3 = await lock.acquire(testDomainId);
    logTest(
      'Phase 3',
      'Re-acquisition after release',
      acquired3,
      acquired3 ? 'PASS: Re-acquired successfully' : 'FAIL: Cannot re-acquire'
    );

    // Cleanup
    await lock.release(testDomainId);

  } catch (error) {
    logTest('Phase 3', 'Domain lock', false, `Error: ${error}`);
  }
}
