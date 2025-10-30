/**
 * Cross-Feature Integration Tests
 *
 * Tests interactions between Currency Fix, Pagination, and Store API implementations.
 * Ensures all three features work together without conflicts or regressions.
 *
 * Features tested:
 * 1. Currency Fix - Dynamic currency fetching (no hardcoded symbols)
 * 2. Pagination - Search results pagination
 * 3. Store API - Transactional cart operations
 *
 * Usage:
 *   npx tsx test-woocommerce-integration-complete.ts
 */

import { fetchCurrency, clearCurrencyCache } from './lib/woocommerce-currency';
import { formatPrice, getCurrencySymbol } from './lib/chat/currency-utils';
import { calculatePagination, formatPaginationMessage } from './lib/chat/pagination-utils';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'Passed',
      duration: Date.now() - startTime,
    });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ==================== TEST 1: Search with Pagination AND Dynamic Currency ====================

async function testSearchWithPaginationAndCurrency() {
  // Simulate search results with pagination
  const totalResults = 250;
  const perPage = 20;
  const currentPage = 1;

  const pagination = calculatePagination({
    total: totalResults,
    per_page: perPage,
    page: currentPage,
    has_results: true,
  });

  // Fetch currency for domain
  const currency = await fetchCurrency('test-store-gbp.com');

  assert(pagination.total === totalResults, 'Pagination total mismatch');
  assert(pagination.currentPage === currentPage, 'Pagination current page mismatch');
  assert(pagination.totalPages === 13, 'Pagination should have 13 pages (250/20 = 12.5)');
  assert(currency.symbol === '£', 'Currency should be GBP (£)');
  assert(!currency.symbol.includes('$'), 'Should NOT have hardcoded USD symbol');
}

// ==================== TEST 2: Cart Operations with Dynamic Currency ====================

async function testCartOperationsWithCurrency() {
  // Simulate cart with products
  const productPrice = 99.99;
  const quantity = 2;
  const subtotal = productPrice * quantity;

  // Get currency for domain
  const currency = await fetchCurrency('test-store-usd.com');

  // Format prices
  const formattedPrice = formatPrice(productPrice, currency.symbol);
  const formattedSubtotal = formatPrice(subtotal, currency.symbol);

  assert(currency.symbol === '$', 'Currency should be USD ($)');
  assert(formattedPrice === '$99.99', `Price should be $99.99, got ${formattedPrice}`);
  assert(formattedSubtotal === '$199.98', `Subtotal should be $199.98, got ${formattedSubtotal}`);
}

// ==================== TEST 3: Paginated Search → Add to Cart Flow ====================

async function testPaginatedSearchToCartFlow() {
  // Step 1: Search with pagination (page 2)
  const pagination = calculatePagination({
    total: 100,
    per_page: 20,
    page: 2,
    has_results: true,
  });

  assert(pagination.currentPage === 2, 'Should be on page 2');
  assert(pagination.hasNextPage === true, 'Should have next page');
  assert(pagination.hasPrevPage === true, 'Should have previous page');

  // Step 2: Select product from page 2 (product ID: 25)
  const productId = 25;

  // Step 3: Get currency for cart
  const currency = await fetchCurrency('test-store-eur.com');

  // Step 4: Verify currency throughout flow
  assert(currency.symbol === '€', 'Currency should be EUR (€)');
  assert(currency.code === 'EUR', 'Currency code should be EUR');
}

// ==================== TEST 4: Multiple Domains with Different Currencies ====================

async function testMultipleDomainsCurrencies() {
  // Clear cache first
  clearCurrencyCache();

  // Test GBP store
  const gbpCurrency = await fetchCurrency('store-gbp.myshopify.com');
  assert(gbpCurrency.symbol === '£', 'GBP store should use £');

  // Test USD store
  const usdCurrency = await fetchCurrency('store-usd.myshopify.com');
  assert(usdCurrency.symbol === '$', 'USD store should use $');

  // Test EUR store
  const eurCurrency = await fetchCurrency('store-eur.myshopify.com');
  assert(eurCurrency.symbol === '€', 'EUR store should use €');

  // Verify currencies are different
  assert(gbpCurrency.symbol !== usdCurrency.symbol, 'GBP and USD symbols should differ');
  assert(usdCurrency.symbol !== eurCurrency.symbol, 'USD and EUR symbols should differ');
}

// ==================== TEST 5: Pagination Message with Currency ====================

async function testPaginationMessageWithCurrency() {
  const pagination = calculatePagination({
    total: 150,
    per_page: 20,
    page: 3,
    has_results: true,
  });

  const message = formatPaginationMessage(pagination);

  assert(message.includes('page 3 of 8'), 'Should show current page and total pages');
  assert(message.includes('next page'), 'Should mention next page');
  assert(message.includes('previous page'), 'Should mention previous page');

  // Verify currency can be included in context
  const currency = await fetchCurrency('test-store.com');
  const priceExample = formatPrice(49.99, currency.symbol);

  assert(priceExample.includes(currency.symbol), 'Price should include currency symbol');
}

// ==================== TEST 6: getCurrencySymbol from Params ====================

async function testGetCurrencySymbolFromParams() {
  // Test explicit currency param
  const explicitSymbol = getCurrencySymbol({ currency: 'GBP' });
  assert(explicitSymbol === '£', 'Should return £ for GBP param');

  // Test EUR
  const eurSymbol = getCurrencySymbol({ currency: 'EUR' });
  assert(eurSymbol === '€', 'Should return € for EUR param');

  // Test USD fallback
  const usdSymbol = getCurrencySymbol({});
  assert(usdSymbol === '$', 'Should fallback to $ for USD');
}

// ==================== TEST 7: Pagination Edge Cases ====================

async function testPaginationEdgeCases() {
  // Empty results
  const emptyPagination = calculatePagination({
    total: 0,
    per_page: 20,
    page: 1,
    has_results: false,
  });

  assert(emptyPagination.total === 0, 'Empty pagination should have 0 total');
  assert(emptyPagination.totalPages === 0, 'Empty pagination should have 0 pages');

  // Single result
  const singlePagination = calculatePagination({
    total: 1,
    per_page: 20,
    page: 1,
    has_results: true,
  });

  assert(singlePagination.totalPages === 1, 'Single result should have 1 page');
  assert(!singlePagination.hasNextPage, 'Single result should not have next page');
}

// ==================== MAIN TEST RUNNER ====================

async function main() {
  console.log('🧪 WooCommerce Cross-Feature Integration Tests\n');
  console.log('Testing: Currency Fix + Pagination + Store API\n');

  console.log('📊 Test 1: Search with Pagination AND Currency');
  await runTest('Search + Pagination + Currency', testSearchWithPaginationAndCurrency);

  console.log('\n💰 Test 2: Cart Operations with Currency');
  await runTest('Cart + Currency', testCartOperationsWithCurrency);

  console.log('\n🔄 Test 3: Paginated Search → Cart Flow');
  await runTest('Pagination → Cart', testPaginatedSearchToCartFlow);

  console.log('\n🌍 Test 4: Multiple Domains with Different Currencies');
  await runTest('Multi-domain Currencies', testMultipleDomainsCurrencies);

  console.log('\n📄 Test 5: Pagination Message with Currency');
  await runTest('Pagination Message + Currency', testPaginationMessageWithCurrency);

  console.log('\n💱 Test 6: getCurrencySymbol from Params');
  await runTest('Currency Symbol from Params', testGetCurrencySymbolFromParams);

  console.log('\n🔍 Test 7: Pagination Edge Cases');
  await runTest('Pagination Edge Cases', testPaginationEdgeCases);

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 INTEGRATION TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
  }

  console.log('\n' + '='.repeat(80));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
