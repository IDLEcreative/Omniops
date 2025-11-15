/**
 * Test runner utility for WooCommerce operations
 */

import { executeWooCommerceOperation } from '../../../lib/chat/woocommerce-tool';
import type { TestResult } from './types';

/**
 * Execute a single operation test
 */
export async function testOperation(
  name: string,
  category: string,
  operation: string,
  params: any,
  domain: string
): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log(`\nTesting: ${name} (${operation})`);
    const result = await executeWooCommerceOperation(operation, params, domain);
    const duration = Date.now() - start;

    if (result.success) {
      console.log(`✅ PASS - ${name} (${duration}ms)`);
      return {
        operation: name,
        category,
        status: 'PASS',
        duration,
        message: result.message || 'Success'
      };
    } else {
      console.log(`⚠️  VALIDATION - ${name}: ${result.message}`);
      return {
        operation: name,
        category,
        status: 'VALIDATION',
        duration,
        message: result.message || 'Validation failure'
      };
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    const errorMsg = error?.message || String(error);
    console.log(`❌ FAIL - ${name}: ${errorMsg}`);
    return {
      operation: name,
      category,
      status: 'FAIL',
      duration,
      message: 'Operation failed',
      error: errorMsg
    };
  }
}
