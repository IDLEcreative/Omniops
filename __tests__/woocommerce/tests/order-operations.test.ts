/**
 * Order Operations Tests (6 operations)
 */

import { testOperation } from './test-runner';
import type { TestResult } from './types';

export async function runOrderOperations(domain: string): Promise<TestResult[]> {
  console.log('\n' + '='.repeat(80));
  console.log('CATEGORY: ORDER OPERATIONS (6 operations)');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  // 11. get_orders
  results.push(await testOperation(
    'get_orders',
    'Order',
    'get_orders',
    { limit: 5 },
    domain
  ));

  // 12. get_order_by_id (expected to fail validation)
  results.push(await testOperation(
    'get_order_by_id',
    'Order',
    'get_order_by_id',
    { orderId: 99999 },
    domain
  ));

  // 13. lookup_order
  results.push(await testOperation(
    'lookup_order',
    'Order',
    'lookup_order',
    { email: 'test@example.com' },
    domain
  ));

  // 14. get_order_status (expected to fail)
  results.push(await testOperation(
    'get_order_status',
    'Order',
    'get_order_status',
    { orderId: 99999 },
    domain
  ));

  // 15. track_order (expected to fail)
  results.push(await testOperation(
    'track_order',
    'Order',
    'track_order',
    { orderId: 99999 },
    domain
  ));

  // 16. cancel_order (expected to fail)
  results.push(await testOperation(
    'cancel_order',
    'Order',
    'cancel_order',
    { orderId: 99999, reason: 'Customer requested cancellation' },
    domain
  ));

  return results;
}
