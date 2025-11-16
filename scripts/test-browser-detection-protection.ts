/**
 * Test Browser Detection Server-Side Protection
 *
 * Verifies that detectBrowser() returns safe defaults in server environment.
 */

import { detectBrowser } from '../lib/analytics/tracking/browser-detection';

console.log('Testing browser detection server-side protection...\n');

const browserInfo = detectBrowser();

console.log('Browser info returned:', JSON.stringify(browserInfo, null, 2));

// Verify safe defaults
const expectedDefaults = {
  name: 'Unknown',
  version: 'Unknown',
  os: 'Unknown',
  device_type: 'desktop',
  viewport_width: 0,
  viewport_height: 0,
};

const matches = JSON.stringify(browserInfo) === JSON.stringify(expectedDefaults);

if (matches) {
  console.log('\n✅ PASS: detectBrowser() returns safe defaults in server environment');
  process.exit(0);
} else {
  console.log('\n❌ FAIL: detectBrowser() did not return expected defaults');
  console.log('Expected:', expectedDefaults);
  console.log('Got:', browserInfo);
  process.exit(1);
}
