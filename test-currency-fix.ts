/**
 * Currency Fix Verification Test
 *
 * Tests that currency is fetched dynamically and no hardcoded symbols remain.
 */

import { getCurrency, formatPrice, clearCurrencyCache, getCurrencyCacheStats } from './lib/woocommerce-currency';
import { getCurrencySymbol, formatPriceRange } from './lib/chat/currency-utils';
import type { WooCommerceOperationParams } from './lib/chat/woocommerce-tool-types';

// Mock WooCommerce API
const mockWooCommerceAPI = {
  getCurrentCurrency: async () => ({
    code: 'GBP',
    name: 'British Pound',
    symbol: '£'
  })
};

// Mock WooCommerce API for USD
const mockWooCommerceAPIUSD = {
  getCurrentCurrency: async () => ({
    code: 'USD',
    name: 'US Dollar',
    symbol: '$'
  })
};

async function runTests() {
  console.log('🧪 Testing Currency Fix Implementation\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Currency fetching for GBP
  try {
    const currency = await getCurrency(mockWooCommerceAPI as any, 'store-gbp.com');
    if (currency.code === 'GBP' && currency.symbol === '£') {
      console.log('✅ Test 1: GBP currency fetch - PASSED');
      passedTests++;
    } else {
      console.log(`❌ Test 1: GBP currency fetch - FAILED (got ${currency.code}, ${currency.symbol})`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Test 1: GBP currency fetch - FAILED (${error})`);
    failedTests++;
  }

  // Test 2: Currency fetching for USD
  try {
    const currency = await getCurrency(mockWooCommerceAPIUSD as any, 'store-usd.com');
    if (currency.code === 'USD' && currency.symbol === '$') {
      console.log('✅ Test 2: USD currency fetch - PASSED');
      passedTests++;
    } else {
      console.log(`❌ Test 2: USD currency fetch - FAILED (got ${currency.code}, ${currency.symbol})`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Test 2: USD currency fetch - FAILED (${error})`);
    failedTests++;
  }

  // Test 3: Currency caching
  try {
    clearCurrencyCache();
    const stats1 = getCurrencyCacheStats();
    await getCurrency(mockWooCommerceAPI as any, 'store-cache-test.com');
    const stats2 = getCurrencyCacheStats();

    if (stats2.size === 1 && stats2.domains.includes('store-cache-test.com')) {
      console.log('✅ Test 3: Currency caching - PASSED');
      passedTests++;
    } else {
      console.log(`❌ Test 3: Currency caching - FAILED (cache size: ${stats2.size})`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Test 3: Currency caching - FAILED (${error})`);
    failedTests++;
  }

  // Test 4: formatPrice helper (from currency-utils)
  try {
    const params: WooCommerceOperationParams = {
      currency: { code: 'GBP', symbol: '£', name: 'British Pound' }
    };
    const { formatPrice: formatPriceUtil } = await import('./lib/chat/currency-utils');
    const formatted = formatPriceUtil(100.50, params);
    if (formatted === '£100.50') {
      console.log('✅ Test 4: formatPrice helper - PASSED');
      passedTests++;
    } else {
      console.log(`❌ Test 4: formatPrice helper - FAILED (got "${formatted}")`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Test 4: formatPrice helper - FAILED (${error})`);
    failedTests++;
  }

  // Test 5: getCurrencySymbol from params
  try {
    const params: WooCommerceOperationParams = {
      currency: { code: 'EUR', symbol: '€', name: 'Euro' }
    };
    const symbol = getCurrencySymbol(params);
    if (symbol === '€') {
      console.log('✅ Test 5: getCurrencySymbol from params - PASSED');
      passedTests++;
    } else {
      console.log(`❌ Test 5: getCurrencySymbol from params - FAILED (got "${symbol}")`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Test 5: getCurrencySymbol from params - FAILED (${error})`);
    failedTests++;
  }

  // Test 6: formatPriceRange helper
  try {
    const params: WooCommerceOperationParams = {
      currency: { code: 'USD', symbol: '$', name: 'US Dollar' }
    };
    const range = formatPriceRange(50, 200, params);
    if (range === '$50-$200') {
      console.log('✅ Test 6: formatPriceRange helper - PASSED');
      passedTests++;
    } else {
      console.log(`❌ Test 6: formatPriceRange helper - FAILED (got "${range}")`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Test 6: formatPriceRange helper - FAILED (${error})`);
    failedTests++;
  }

  // Test 7: Default fallback to USD
  try {
    const params: WooCommerceOperationParams = {};
    const symbol = getCurrencySymbol(params);
    if (symbol === '$') {
      console.log('✅ Test 7: Default fallback to USD - PASSED');
      passedTests++;
    } else {
      console.log(`❌ Test 7: Default fallback to USD - FAILED (got "${symbol}")`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Test 7: Default fallback to USD - FAILED (${error})`);
    failedTests++;
  }

  // Test 8: Verify no hardcoded symbols in code
  try {
    const fs = require('fs');
    const path = require('path');

    const filesToCheck = [
      'lib/chat/cart-operations.ts',
      'lib/chat/product-operations/product-search-operations.ts',
      'lib/chat/product-operations/product-variation-operations.ts',
      'lib/chat/product-operations/stock-operations.ts',
      'lib/chat/order-operations/order-history.ts',
      'lib/chat/order-operations/order-refunds-cancellation.ts',
      'lib/chat/store-operations.ts',
      'lib/chat/analytics-operations.ts',
      'lib/chat/report-operations.ts',
      'lib/chat/woocommerce-tool-formatters.ts'
    ];

    let hardcodedFound = false;
    for (const file of filesToCheck) {
      const content = fs.readFileSync(file, 'utf-8');
      // Check for £ outside of comments and template literals with currencySymbol
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
        // Check for £ not followed by currencySymbol template
        if (line.includes('£') && !line.includes('currencySymbol') && !line.includes('${currencySymbol}')) {
          console.log(`   Found hardcoded £ in ${file}:${i + 1}: ${line.trim()}`);
          hardcodedFound = true;
        }
      }
    }

    if (!hardcodedFound) {
      console.log('✅ Test 8: No hardcoded currency symbols - PASSED');
      passedTests++;
    } else {
      console.log('❌ Test 8: No hardcoded currency symbols - FAILED');
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Test 8: No hardcoded currency symbols - FAILED (${error})`);
    failedTests++;
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`${'='.repeat(50)}`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Currency fix is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
