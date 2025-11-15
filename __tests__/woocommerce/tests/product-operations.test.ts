/**
 * Product Operations Tests (10 operations)
 */

import { testOperation } from './test-runner';
import type { TestResult } from './types';

export async function runProductOperations(domain: string): Promise<TestResult[]> {
  console.log('\n' + '='.repeat(80));
  console.log('CATEGORY: PRODUCT OPERATIONS (10 operations)');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  // 1. get_products
  results.push(await testOperation(
    'get_products',
    'Product',
    'get_products',
    { limit: 5 },
    domain
  ));

  // 2. get_product_by_id
  results.push(await testOperation(
    'get_product_by_id',
    'Product',
    'get_product_by_id',
    { productId: 77424 },
    domain
  ));

  // 3. get_product_by_sku
  results.push(await testOperation(
    'get_product_by_sku',
    'Product',
    'get_product_by_sku',
    { sku: 'A4VTG90' },
    domain
  ));

  // 4. get_product_variations
  results.push(await testOperation(
    'get_product_variations',
    'Product',
    'get_product_variations',
    { productId: 77424 },
    domain
  ));

  // 5. get_product_categories
  results.push(await testOperation(
    'get_product_categories',
    'Product',
    'get_product_categories',
    {},
    domain
  ));

  // 6. search_products
  results.push(await testOperation(
    'search_products',
    'Product',
    'search_products',
    { query: 'pump', limit: 5 },
    domain
  ));

  // 7. check_product_stock
  results.push(await testOperation(
    'check_product_stock',
    'Product',
    'check_product_stock',
    { productId: 77424 },
    domain
  ));

  // 8. get_product_reviews
  results.push(await testOperation(
    'get_product_reviews',
    'Product',
    'get_product_reviews',
    { productId: 77424 },
    domain
  ));

  // 9. get_related_products
  results.push(await testOperation(
    'get_related_products',
    'Product',
    'get_related_products',
    { productId: 77424, limit: 5 },
    domain
  ));

  // 10. get_low_stock_products
  results.push(await testOperation(
    'get_low_stock_products',
    'Product',
    'get_low_stock_products',
    { threshold: 10, limit: 5 },
    domain
  ));

  return results;
}
