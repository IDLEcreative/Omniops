/**
 * Test Server-Side Protection for SessionTracker
 *
 * This script verifies that SessionTracker properly throws an error
 * when instantiated in a server environment (no window/navigator).
 */

import { SessionTracker } from '../lib/analytics/session-tracker';

console.log('Testing server-side protection...\n');

try {
  console.log('Attempting to create SessionTracker in Node.js environment...');
  const tracker = new SessionTracker('test-domain.com');
  console.log('❌ FAIL: SessionTracker was created successfully (should have thrown error)');
  process.exit(1);
} catch (error) {
  if (error instanceof Error && error.message.includes('browser environment')) {
    console.log('✅ PASS: SessionTracker correctly threw error in server environment');
    console.log(`Error message: "${error.message}"`);
    process.exit(0);
  } else {
    console.log('❌ FAIL: Unexpected error thrown');
    console.error(error);
    process.exit(1);
  }
}
