/**
 * End-to-End Full Integration Test
 * Tests Currency + Pagination + Store API working together
 */

// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { executeWooCommerceOperation } from './lib/chat/woocommerce-tool';
import { getDynamicStoreAPIClient } from './lib/woocommerce-dynamic';

async function testFullIntegration() {
  console.log('🧪 FULL INTEGRATION E2E TEST\n');
  console.log('Currency + Pagination + Store API Integration');
  console.log('='.repeat(60));

  const domain = 'thompsonseparts.co.uk';
  const userId = 'integration-test-' + Date.now();

  const results = {
    passed: 0,
    failed: 0,
    tests: [] as { name: string; status: 'PASS' | 'FAIL'; message?: string }[]
  };

  function logTest(name: string, passed: boolean, message?: string) {
    const status = passed ? 'PASS' : 'FAIL';
    results.tests.push({ name, status, message });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
      if (message) console.log(`   ${message}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}`);
      if (message) console.log(`   ${message}`);
    }
  }

  try {
    // Feature 1: Dynamic Currency
    console.log('\n📝 Feature 1: Dynamic Currency (No Hardcoding)');
    const searchResult = await executeWooCommerceOperation(
      'search_products',
      {
        query: 'pump',
        page: 1,
        per_page: 20,
        domain,
      },
      domain
    );

    logTest(
      'Product search succeeds',
      searchResult.success === true,
      searchResult.message
    );

    // Verify currency is NOT hardcoded
    const hasCurrency = searchResult.currency !== undefined && searchResult.currency !== null;
    logTest(
      'Currency code present',
      hasCurrency,
      `Currency: ${searchResult.currency || 'MISSING'}`
    );

    const hasCurrencySymbol = searchResult.currencySymbol !== undefined && searchResult.currencySymbol !== null;
    logTest(
      'Currency symbol present',
      hasCurrencySymbol,
      `Symbol: ${searchResult.currencySymbol || 'MISSING'}`
    );

    // Verify it's GBP for Thompson's Parts
    const isGBP = searchResult.currency === 'GBP' && searchResult.currencySymbol === '£';
    logTest(
      'Currency matches store configuration',
      isGBP,
      `Expected GBP/£, got ${searchResult.currency}/${searchResult.currencySymbol}`
    );

    // Feature 2: Pagination Metadata
    console.log('\n📝 Feature 2: Pagination Metadata');

    const hasPagination = searchResult.data?.pagination !== undefined;
    logTest(
      'Pagination metadata included',
      hasPagination,
      hasPagination ? 'Pagination object present' : 'Pagination missing'
    );

    if (hasPagination) {
      const pagination = searchResult.data.pagination;
      const hasCurrentPage = pagination.current_page !== undefined;
      const hasTotalPages = pagination.total_pages !== undefined;
      const hasTotalProducts = pagination.total_products !== undefined;
      const hasPerPage = pagination.per_page !== undefined;

      logTest('Pagination has current_page', hasCurrentPage, `Current page: ${pagination.current_page}`);
      logTest('Pagination has total_pages', hasTotalPages, `Total pages: ${pagination.total_pages}`);
      logTest('Pagination has total_products', hasTotalProducts, `Total products: ${pagination.total_products}`);
      logTest('Pagination has per_page', hasPerPage, `Per page: ${pagination.per_page}`);

      // Verify pagination values are reasonable
      logTest(
        'Pagination values are valid',
        pagination.current_page > 0 && pagination.total_pages >= 0 && pagination.per_page > 0,
        'All pagination values are positive'
      );
    }

    // Feature 3: Store API Integration
    console.log('\n📝 Feature 3: Store API + Currency Integration');

    // Get Store API client
    const storeAPI = await getDynamicStoreAPIClient(domain, userId);

    if (searchResult.success && searchResult.data?.products?.length > 0) {
      const firstProduct = searchResult.data.products[0];
      console.log(`   Using product: ${firstProduct.name} (ID: ${firstProduct.id})`);

      // Add to cart and verify currency is included
      const addResult = await executeWooCommerceOperation(
        'add_to_cart',
        {
          productId: firstProduct.id.toString(),
          quantity: 1,
          domain,
          storeAPI,
        },
        domain
      );

      logTest(
        'Add to cart succeeds',
        addResult.success === true,
        addResult.message
      );

      logTest(
        'Cart operation includes currency',
        addResult.currency !== undefined && addResult.currencySymbol !== undefined,
        `Currency: ${addResult.currency || 'MISSING'}, Symbol: ${addResult.currencySymbol || 'MISSING'}`
      );

      // Verify currency consistency between search and cart
      const currencyConsistent = addResult.currency === searchResult.currency;
      logTest(
        'Currency consistent across operations',
        currencyConsistent,
        currencyConsistent ? 'Currency matches between search and cart' : `Mismatch: ${searchResult.currency} vs ${addResult.currency}`
      );

      // Get cart and verify currency in response
      const cartResult = await executeWooCommerceOperation(
        'get_cart',
        { domain, storeAPI },
        domain
      );

      logTest(
        'Get cart succeeds',
        cartResult.success === true,
        cartResult.message
      );

      // Check if message includes currency symbol
      const messageHasCurrency = cartResult.message.includes('£') || cartResult.message.includes('GBP');
      logTest(
        'Cart message includes currency symbol',
        messageHasCurrency,
        messageHasCurrency ? 'Currency symbol found in message' : 'Currency symbol not in message'
      );

      // Cleanup: remove from cart
      await executeWooCommerceOperation(
        'remove_from_cart',
        {
          productId: firstProduct.id.toString(),
          domain,
          storeAPI,
        },
        domain
      );
    } else {
      logTest(
        'Product available for cart test',
        false,
        'No products found in search results'
      );
    }

    // Feature 4: Multi-page Navigation
    console.log('\n📝 Feature 4: Multi-Page Navigation');

    if (searchResult.data?.pagination?.total_pages > 1) {
      const page2Result = await executeWooCommerceOperation(
        'search_products',
        {
          query: 'pump',
          page: 2,
          per_page: 20,
          domain,
        },
        domain
      );

      logTest(
        'Page 2 navigation works',
        page2Result.success === true,
        page2Result.message
      );

      logTest(
        'Page 2 has different products',
        JSON.stringify(page2Result.data?.products) !== JSON.stringify(searchResult.data?.products),
        'Products differ between pages'
      );

      logTest(
        'Page 2 has currency',
        page2Result.currency !== undefined,
        `Currency: ${page2Result.currency}`
      );

      logTest(
        'Page 2 has pagination',
        page2Result.data?.pagination?.current_page === 2,
        `Current page: ${page2Result.data?.pagination?.current_page}`
      );
    } else {
      console.log('   ⚠️  Skipped: Only 1 page of results available');
    }

  } catch (error) {
    console.error('\n💥 Fatal error during integration tests:', error);
    results.failed++;
    results.tests.push({
      name: 'Fatal error',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  - ${t.name}${t.message ? ': ' + t.message : ''}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
testFullIntegration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
