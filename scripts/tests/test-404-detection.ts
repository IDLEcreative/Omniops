async function test404Detection() {
  console.log('🧪 Testing 404 Detection\n');

  // This simulates different error scenarios
  const testCases = [
    { error: new Error('404 Not Found'), expected: 'deleted' },
    { error: new Error('410 Gone'), expected: 'deleted' },
    { error: new Error('500 Internal Server Error'), expected: 'failed' },
    { error: new Error('Connection timeout'), expected: 'failed' },
    { error: new Error('PAGE_NOT_FOUND'), expected: 'deleted' },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((test, i) => {
    const errorMessage = test.error.message;

    // Simulate the detection logic from scraper-worker.js
    const is404 =
      errorMessage.includes('404') ||
      errorMessage.includes('Not Found') ||
      errorMessage.includes('PAGE_NOT_FOUND');

    const isDeleted =
      errorMessage.includes('410') ||
      errorMessage.includes('Gone');

    const status = (is404 || isDeleted) ? 'deleted' : 'failed';

    const pass = status === test.expected;

    if (pass) {
      passed++;
      console.log(`Test ${i + 1}: ✅ PASS`);
    } else {
      failed++;
      console.log(`Test ${i + 1}: ❌ FAIL`);
    }

    console.log(`  Error: "${errorMessage}"`);
    console.log(`  Expected: ${test.expected}, Got: ${status}`);
    console.log('');
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

test404Detection().catch(console.error);
