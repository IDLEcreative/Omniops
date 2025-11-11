import { executeWooCommerceOperation } from '../../../lib/chat/woocommerce-tool';
import { DOMAIN } from './constants';
import { OperationTest, TestResult } from './types';

export async function runOperation(test: OperationTest): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log(`\nTesting: ${test.name} (${test.operation})`);
    const result = await executeWooCommerceOperation(test.operation, test.params, DOMAIN);
    const duration = Date.now() - start;

    if (result.success) {
      console.log(`✅ PASS - ${test.name} (${duration}ms)`);
      return {
        operation: test.name,
        category: test.category,
        status: 'PASS',
        duration,
        message: result.message || 'Success',
      };
    }

    console.log(`⚠️  VALIDATION - ${test.name}: ${result.message}`);
    return {
      operation: test.name,
      category: test.category,
      status: 'VALIDATION',
      duration: Date.now() - start,
      message: result.message || 'Validation failure',
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    const errorMsg = error?.message || String(error);
    console.log(`❌ FAIL - ${test.name}: ${errorMsg}`);
    return {
      operation: test.name,
      category: test.category,
      status: 'FAIL',
      duration,
      message: 'Operation failed',
      error: errorMsg,
    };
  }
}
