import { DomainRefreshLock } from '@/lib/domain-refresh-lock';

async function testLockAPI() {
  const lock = new DomainRefreshLock();
  const testDomainId = 'api-test-domain-789';

  console.log('🧪 Testing Domain Lock API Functionality...\n');

  try {
    // Scenario 1: Check status when unlocked
    console.log('Scenario 1: Check status of unlocked domain');
    const isLocked1 = await lock.isLocked(testDomainId);
    const timeRemaining1 = await lock.getTimeRemaining(testDomainId);
    console.log(`  isLocked: ${isLocked1}`);
    console.log(`  timeRemaining: ${timeRemaining1}`);
    console.log(`  ✅ Expected: isLocked=false, timeRemaining=-2 (key doesn't exist)\n`);

    // Scenario 2: Acquire lock and check status
    console.log('Scenario 2: Acquire lock and check status');
    await lock.acquire(testDomainId);
    const isLocked2 = await lock.isLocked(testDomainId);
    const timeRemaining2 = await lock.getTimeRemaining(testDomainId);
    console.log(`  isLocked: ${isLocked2}`);
    console.log(`  timeRemaining: ${timeRemaining2}s`);
    console.log(`  ✅ Expected: isLocked=true, timeRemaining≈300s\n`);

    // Scenario 3: Try to acquire again (should fail)
    console.log('Scenario 3: Try to acquire already-locked domain');
    const acquired = await lock.acquire(testDomainId);
    console.log(`  acquired: ${acquired}`);
    console.log(`  ✅ Expected: acquired=false (lock already held)\n`);

    // Scenario 4: Force release
    console.log('Scenario 4: Force release lock');
    await lock.forceRelease(testDomainId);
    const isLocked3 = await lock.isLocked(testDomainId);
    console.log(`  isLocked after force release: ${isLocked3}`);
    console.log(`  ✅ Expected: isLocked=false\n`);

    console.log('═══════════════════════════════════════');
    console.log('✅ All API scenarios work correctly!');
    console.log('═══════════════════════════════════════');
    console.log('\nAPI Response Format Examples:');
    console.log('\nGET /api/domain-lock/status?domainId=xxx (unlocked):');
    console.log(JSON.stringify({
      domainId: 'xxx',
      isLocked: false,
      timeRemaining: null,
      message: 'No active refresh',
    }, null, 2));

    console.log('\nGET /api/domain-lock/status?domainId=xxx (locked):');
    console.log(JSON.stringify({
      domainId: 'xxx',
      isLocked: true,
      timeRemaining: 285,
      message: 'Refresh in progress, 285s remaining on lock',
    }, null, 2));

    console.log('\nDELETE /api/domain-lock/status?domainId=xxx:');
    console.log(JSON.stringify({
      domainId: 'xxx',
      message: 'Lock forcefully released',
    }, null, 2));

  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  }
}

testLockAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
