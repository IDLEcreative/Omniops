async function testDeletionRetry() {
  console.log('🧪 Testing Deletion Retry Logic\n');

  // Simulate retry scenarios
  const scenarios = [
    {
      name: 'Success on first attempt',
      attempts: [{ success: true, error: null }],
      expectedResult: 'success',
    },
    {
      name: 'Success on second attempt',
      attempts: [
        { success: false, error: 'Temporary network error' },
        { success: true, error: null },
      ],
      expectedResult: 'success',
    },
    {
      name: 'Fail after 3 attempts',
      attempts: [
        { success: false, error: 'Database locked' },
        { success: false, error: 'Database locked' },
        { success: false, error: 'Database locked' },
      ],
      expectedResult: 'fatal_error',
    },
  ];

  let allTestsPassed = true;

  scenarios.forEach((scenario, i) => {
    console.log(`Test ${i + 1}: ${scenario.name}`);

    let deleteAttempts = 0;
    let deleteSuccess = false;
    let fatalError = false;

    for (const attempt of scenario.attempts) {
      deleteAttempts++;

      if (attempt.success) {
        deleteSuccess = true;
        break;
      } else if (deleteAttempts >= 3) {
        fatalError = true;
        break;
      }
    }

    const actualResult = fatalError
      ? 'fatal_error'
      : deleteSuccess
        ? 'success'
        : 'unknown';
    const pass = actualResult === scenario.expectedResult;

    console.log(`  Expected: ${scenario.expectedResult}, Got: ${actualResult}`);
    console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}\n`);

    if (!pass) allTestsPassed = false;
  });

  console.log('─'.repeat(50));
  console.log(
    `\n${allTestsPassed ? '✅ All tests PASSED' : '❌ Some tests FAILED'}\n`
  );

  return allTestsPassed;
}

testDeletionRetry();
