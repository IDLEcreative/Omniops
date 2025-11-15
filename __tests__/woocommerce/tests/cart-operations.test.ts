/**
 * Cart Operations Tests (5 operations)
 */

import { testOperation } from './test-runner';
import type { TestResult } from './types';

export async function runCartOperations(domain: string): Promise<TestResult[]> {
  console.log('\n' + '='.repeat(80));
  console.log('CATEGORY: CART OPERATIONS (5 operations)');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  // 17. add_to_cart
  results.push(await testOperation(
    'add_to_cart',
    'Cart',
    'add_to_cart',
    { productId: 77424, quantity: 1 },
    domain
  ));

  // 18. get_cart
  results.push(await testOperation(
    'get_cart',
    'Cart',
    'get_cart',
    {},
    domain
  ));

  // 19. remove_from_cart
  results.push(await testOperation(
    'remove_from_cart',
    'Cart',
    'remove_from_cart',
    { productId: 77424 },
    domain
  ));

  // 20. update_cart_quantity
  results.push(await testOperation(
    'update_cart_quantity',
    'Cart',
    'update_cart_quantity',
    { productId: 77424, quantity: 2 },
    domain
  ));

  // 21. apply_coupon_to_cart (expected to fail validation)
  results.push(await testOperation(
    'apply_coupon_to_cart',
    'Cart',
    'apply_coupon_to_cart',
    { couponCode: 'TESTCODE' },
    domain
  ));

  return results;
}
