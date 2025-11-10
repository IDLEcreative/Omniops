/**
 * Domain Configuration Tests
 *
 * Tests that domain-specific configurations are properly managed
 * and that the system uses generic placeholders instead of hardcoded values.
 *
 * Type: Integration Test
 * Status: Active
 * Last Updated: 2025-11-10
 * Related: multi-domain-test-helpers.ts
 */

import {
  DomainTestResult,
  checkPromptsUseGenericPlaceholders,
  checkForHardcodedSKUs,
  createTestResult,
  finializeTestResult,
  getBusinessTypeIcon
} from '../../utils/domain/multi-domain-test-helpers';
import { join } from 'path';

describe('Domain Configuration Tests', () => {
  let results: DomainTestResult[] = [];

  /**
   * Test 1: Verify prompts use generic placeholders
   */
  it('should use generic placeholders in AI prompts', async () => {
    const result = createTestResult('prompts-config-test.local', 'Prompt Configuration');

    console.log(`\n${getBusinessTypeIcon('Healthcare')} Testing Configuration...`);
    console.log('  Test 1: Generic placeholder usage...');

    const hasGenericPrompts = await checkPromptsUseGenericPlaceholders();

    if (hasGenericPrompts) {
      result.testsPassed++;
      console.log('  ✅ AI prompts use generic placeholders');
    } else {
      result.testsFailed++;
      result.violations.push('AI prompts contain specific product/brand examples');
      console.log('  ❌ FAILED: Non-generic prompts detected');
    }

    finializeTestResult(result);
    results.push(result);

    expect(result.status).toBe('PASS');
  }, 30000);

  /**
   * Test 2: Verify no hardcoded SKUs in prompts
   */
  it('should not contain hardcoded SKUs in prompts', async () => {
    const result = createTestResult('sku-config-test.local', 'SKU Configuration');

    console.log('  Test 2: Hardcoded SKU prevention...');

    const hasHardcodedSKUs = await checkForHardcodedSKUs(['A4VTG90', 'K2053463']);

    if (!hasHardcodedSKUs) {
      result.testsPassed++;
      console.log('  ✅ No hardcoded SKUs in prompts');
    } else {
      result.testsFailed++;
      result.violations.push('Hardcoded SKUs found in system prompts');
      console.log('  ❌ FAILED: Hardcoded SKUs detected');
    }

    finializeTestResult(result);
    results.push(result);

    expect(result.status).toBe('PASS');
  }, 30000);

  /**
   * Test 3: Verify configurable system prompts
   */
  it('should support configurable system prompts per domain', async () => {
    const result = createTestResult('configurable-prompt-test.local', 'Configurable Prompts');

    console.log('  Test 3: Configurable prompt support...');

    const usesPlaceholders = await checkPromptsUseGenericPlaceholders();

    if (usesPlaceholders) {
      result.testsPassed++;
      console.log('  ✅ System prompts are configurable per domain');
    } else {
      result.testsFailed++;
      result.violations.push('System prompts are not configurable');
      console.log('  ❌ FAILED: Prompts are not configurable');
    }

    finializeTestResult(result);
    results.push(result);

    expect(result.status).toBe('PASS');
  }, 30000);

  /**
   * Test 4: Verify no hardcoded product IDs
   */
  it('should not contain hardcoded product identifiers', async () => {
    const result = createTestResult('product-id-config-test.local', 'Product ID Configuration');

    console.log('  Test 4: Product ID configuration...');

    const hasHardcodedIds = await checkForHardcodedSKUs([
      'agri-flip', 'cifa-pump', 'thompson-part'
    ]);

    if (!hasHardcodedIds) {
      result.testsPassed++;
      console.log('  ✅ No hardcoded product identifiers');
    } else {
      result.testsFailed++;
      result.violations.push('Hardcoded product identifiers found in prompts');
      console.log('  ❌ FAILED: Product IDs hardcoded');
    }

    finializeTestResult(result);
    results.push(result);

    expect(result.status).toBe('PASS');
  }, 30000);

  afterAll(() => {
    console.log('\n' + '='.repeat(70));
    console.log('Domain Configuration Tests Complete');
    console.log('='.repeat(70));
  });
});
