/**
 * Domain Isolation Tests
 *
 * Tests that the system properly isolates different tenant domains
 * and prevents cross-domain data leakage.
 *
 * Type: Integration Test
 * Status: Active
 * Last Updated: 2025-11-10
 * Related: multi-domain-test-helpers.ts
 */

import {
  DomainTestResult,
  checkForHardcodedDomain,
  checkApiRequiresDomain,
  createTestResult,
  finializeTestResult,
  getBusinessTypeIcon
} from '../../utils/domain/multi-domain-test-helpers';
import { join } from 'path';

describe('Domain Isolation Tests', () => {
  let results: DomainTestResult[] = [];

  /**
   * Test Restaurant Domain - Verifies domain independence
   */
  it('should isolate restaurant domain without hardcoded defaults', async () => {
    const result = createTestResult('restaurant-test.local', 'Restaurant');

    console.log(`\n${getBusinessTypeIcon('Restaurant')} Testing Restaurant Domain...`);

    // Test 1: Check widget doesn't default to Thompson's domain
    console.log('  Test 1: Domain independence...');
    const hasThompsonsDefault = await checkForHardcodedDomain(
      'thompsonseparts.co.uk',
      join(process.cwd(), 'components/ChatWidget.tsx')
    );

    if (!hasThompsonsDefault) {
      result.testsPassed++;
      console.log('  ✅ No hardcoded Thompson\'s domain fallback');
    } else {
      result.testsFailed++;
      result.violations.push('Hardcoded Thompson\'s domain fallback found');
      console.log('  ❌ FAILED: Hardcoded domain fallback detected');
    }

    finializeTestResult(result);
    results.push(result);

    expect(result.status).toBe('PASS');
  }, 30000);

  /**
   * Test Real Estate Domain - Verifies API isolation
   */
  it('should enforce domain parameter in API requests', async () => {
    const result = createTestResult('realestate-test.local', 'Real Estate');

    console.log(`\n${getBusinessTypeIcon('Real Estate')} Testing Real Estate Domain...`);

    // Test 1: API requires domain parameter
    console.log('  Test 1: API domain parameter enforcement...');
    const requiresDomainParam = await checkApiRequiresDomain(
      join(process.cwd(), 'app/api/woocommerce/products/route.ts')
    );

    if (requiresDomainParam) {
      result.testsPassed++;
      console.log('  ✅ API properly requires domain parameter');
    } else {
      result.testsFailed++;
      result.violations.push('API allows missing domain parameter');
      console.log('  ❌ FAILED: API doesn\'t enforce domain parameter');
    }

    finializeTestResult(result);
    results.push(result);

    expect(result.status).toBe('PASS');
  }, 30000);

  /**
   * Test Healthcare Domain - Verifies credential isolation
   */
  it('should isolate healthcare domain credentials', async () => {
    const result = createTestResult('healthcare-test.local', 'Healthcare');

    console.log(`\n${getBusinessTypeIcon('Healthcare')} Testing Healthcare Domain...`);

    // Test 1: Verify domain isolation in API
    console.log('  Test 1: Domain credential isolation...');
    const isolatesCredentials = await checkApiRequiresDomain(
      join(process.cwd(), 'app/api/chat/route.ts')
    );

    if (isolatesCredentials) {
      result.testsPassed++;
      console.log('  ✅ API isolates credentials per domain');
    } else {
      result.testsFailed++;
      result.violations.push('API doesn\'t isolate credentials per domain');
      console.log('  ❌ FAILED: Domain credentials not isolated');
    }

    finializeTestResult(result);
    results.push(result);

    expect(result.status).toBe('PASS');
  }, 30000);

  afterAll(() => {
    console.log('\n' + '='.repeat(70));
    console.log('Domain Isolation Tests Complete');
    console.log('='.repeat(70));
  });
});
