/**
 * Store Configuration & Analytics Operations Tests (4 operations)
 */

import { testOperation } from './test-runner';
import type { TestResult } from './types';

export async function runStoreOperations(domain: string): Promise<TestResult[]> {
  console.log('\n' + '='.repeat(80));
  console.log('CATEGORY: STORE CONFIGURATION (3 operations)');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  // 22. get_store_info
  results.push(await testOperation(
    'get_store_info',
    'Store',
    'get_store_info',
    {},
    domain
  ));

  // 23. get_shipping_methods
  results.push(await testOperation(
    'get_shipping_methods',
    'Store',
    'get_shipping_methods',
    {},
    domain
  ));

  // 24. get_payment_gateways
  results.push(await testOperation(
    'get_payment_gateways',
    'Store',
    'get_payment_gateways',
    {},
    domain
  ));

  return results;
}

export async function runAnalyticsOperations(domain: string): Promise<TestResult[]> {
  console.log('\n' + '='.repeat(80));
  console.log('CATEGORY: ANALYTICS (1 operation)');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  // 25. get_sales_report
  results.push(await testOperation(
    'get_sales_report',
    'Analytics',
    'get_sales_report',
    { period: 'week' },
    domain
  ));

  return results;
}
