/**
 * WooCommerce Pagination Test Suite
 * Tests pagination implementation for products, categories, and orders
 *
 * Run with: npx tsx test-pagination.ts
 */

import { calculatePagination, formatPaginationMessage, offsetToPage, pageToOffset } from './lib/chat/pagination-utils';

// Test results tracker
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function test(name: string, fn: () => void | Promise<void>): void {
  const testFn = async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
    }
  };
  testFn();
}

// ============================================================================
// Pagination Utility Tests
// ============================================================================

test('calculatePagination - first page with results', () => {
  const pagination = calculatePagination(1, 20, 100);

  assert(pagination.page === 1, 'Page should be 1');
  assert(pagination.perPage === 20, 'Per page should be 20');
  assert(pagination.total === 100, 'Total should be 100');
  assert(pagination.totalPages === 5, 'Total pages should be 5');
  assert(pagination.hasMore === true, 'Should have more pages');
  assert(pagination.nextPage === 2, 'Next page should be 2');
  assert(pagination.previousPage === undefined, 'Should not have previous page');
});

test('calculatePagination - middle page', () => {
  const pagination = calculatePagination(3, 20, 100);

  assert(pagination.page === 3, 'Page should be 3');
  assert(pagination.totalPages === 5, 'Total pages should be 5');
  assert(pagination.hasMore === true, 'Should have more pages');
  assert(pagination.nextPage === 4, 'Next page should be 4');
  assert(pagination.previousPage === 2, 'Previous page should be 2');
});

test('calculatePagination - last page', () => {
  const pagination = calculatePagination(5, 20, 100);

  assert(pagination.page === 5, 'Page should be 5');
  assert(pagination.hasMore === false, 'Should not have more pages');
  assert(pagination.nextPage === undefined, 'Should not have next page');
  assert(pagination.previousPage === 4, 'Previous page should be 4');
});

test('calculatePagination - partial last page', () => {
  const pagination = calculatePagination(3, 20, 45);

  assert(pagination.totalPages === 3, 'Total pages should be 3 (45/20 = 2.25, rounded up)');
  assert(pagination.hasMore === false, 'Should not have more pages');
});

test('calculatePagination - empty results', () => {
  const pagination = calculatePagination(1, 20, 0);

  assert(pagination.total === 0, 'Total should be 0');
  assert(pagination.totalPages === 0, 'Total pages should be 0');
  assert(pagination.hasMore === false, 'Should not have more pages');
});

test('calculatePagination - enforces minimum page', () => {
  const pagination = calculatePagination(0, 20, 100);

  assert(pagination.page === 1, 'Page should be enforced to minimum of 1');
});

test('calculatePagination - caps per_page at 100', () => {
  const pagination = calculatePagination(1, 200, 1000);

  assert(pagination.perPage === 100, 'Per page should be capped at 100');
});

test('offsetToPage - converts offset 0 to page 1', () => {
  const page = offsetToPage(0, 20);
  assert(page === 1, 'Offset 0 should be page 1');
});

test('offsetToPage - converts offset 20 to page 2', () => {
  const page = offsetToPage(20, 20);
  assert(page === 2, 'Offset 20 with per_page 20 should be page 2');
});

test('offsetToPage - converts offset 50 to page 3', () => {
  const page = offsetToPage(50, 20);
  assert(page === 3, 'Offset 50 with per_page 20 should be page 3');
});

test('pageToOffset - converts page 1 to offset 0', () => {
  const offset = pageToOffset(1, 20);
  assert(offset === 0, 'Page 1 should be offset 0');
});

test('pageToOffset - converts page 2 to offset 20', () => {
  const offset = pageToOffset(2, 20);
  assert(offset === 20, 'Page 2 with per_page 20 should be offset 20');
});

test('pageToOffset - converts page 5 to offset 80', () => {
  const offset = pageToOffset(5, 20);
  assert(offset === 80, 'Page 5 with per_page 20 should be offset 80');
});

test('formatPaginationMessage - includes page info', () => {
  const pagination = calculatePagination(2, 20, 100);
  const message = formatPaginationMessage(pagination);

  assert(message.includes('Page 2 of 5'), 'Message should include page info');
  assert(message.includes('100 total results'), 'Message should include total count');
});

test('formatPaginationMessage - includes next page prompt', () => {
  const pagination = calculatePagination(2, 20, 100);
  const message = formatPaginationMessage(pagination);

  assert(message.includes('page 3'), 'Message should suggest next page');
});

test('formatPaginationMessage - includes previous page prompt', () => {
  const pagination = calculatePagination(3, 20, 100);
  const message = formatPaginationMessage(pagination);

  assert(message.includes('page 2'), 'Message should suggest previous page');
});

test('formatPaginationMessage - no message for empty results', () => {
  const pagination = calculatePagination(1, 20, 0);
  const message = formatPaginationMessage(pagination);

  assert(message === '', 'Message should be empty for zero results');
});

test('formatPaginationMessage - last page has no next prompt', () => {
  const pagination = calculatePagination(5, 20, 100);
  const message = formatPaginationMessage(pagination);

  assert(!message.includes('Want more?'), 'Last page should not suggest next page');
});

// ============================================================================
// Integration Test Scenarios
// ============================================================================

test('Scenario: User searches products with default pagination', () => {
  // Simulating search_products with no page specified
  const page = 1; // defaults to 1
  const perPage = 20; // defaults to 20
  const totalResults = 150; // store has 150 products

  const pagination = calculatePagination(page, perPage, totalResults);

  assert(pagination.totalPages === 8, 'Should calculate 8 pages (150/20 = 7.5, rounded up)');
  assert(pagination.hasMore === true, 'Should indicate more pages available');
});

test('Scenario: User requests page 2 explicitly', () => {
  // User says: "Show me page 2"
  const page = 2;
  const perPage = 20;
  const totalResults = 150;

  const pagination = calculatePagination(page, perPage, totalResults);

  assert(pagination.page === 2, 'Should be on page 2');
  assert(pagination.previousPage === 1, 'Should have previous page');
  assert(pagination.nextPage === 3, 'Should have next page');
});

test('Scenario: User requests custom per_page=50', () => {
  // User says: "Show me 50 results per page"
  const page = 1;
  const perPage = 50;
  const totalResults = 150;

  const pagination = calculatePagination(page, perPage, totalResults);

  assert(pagination.totalPages === 3, 'Should calculate 3 pages (150/50)');
  assert(pagination.perPage === 50, 'Per page should be 50');
});

test('Scenario: User with 1000+ products requests page 10', () => {
  // Large catalog scenario
  const page = 10;
  const perPage = 100; // max allowed
  const totalResults = 1200;

  const pagination = calculatePagination(page, perPage, totalResults);

  assert(pagination.totalPages === 12, 'Should calculate 12 pages');
  assert(pagination.hasMore === true, 'Should have more pages');
});

test('Scenario: Offset-based pagination (offset=40)', () => {
  // Some API clients prefer offset over page numbers
  const offset = 40;
  const perPage = 20;

  const page = offsetToPage(offset, perPage);
  const pagination = calculatePagination(page, perPage, 150);

  assert(page === 3, 'Offset 40 should map to page 3');
  assert(pagination.page === 3, 'Pagination should be for page 3');
});

test('Scenario: Categories with default limit=100', () => {
  // Categories typically have fewer results
  const page = 1;
  const perPage = 100; // default for categories
  const totalResults = 45; // store has 45 categories

  const pagination = calculatePagination(page, perPage, totalResults);

  assert(pagination.totalPages === 1, 'Should be single page');
  assert(pagination.hasMore === false, 'Should not have more pages');
});

test('Scenario: Categories exceed 100 (need pagination)', () => {
  // Large store with many categories
  const page = 1;
  const perPage = 100;
  const totalResults = 250; // 250 categories

  const pagination = calculatePagination(page, perPage, totalResults);

  assert(pagination.totalPages === 3, 'Should calculate 3 pages');
  assert(pagination.hasMore === true, 'Should indicate more pages');
});

test('Scenario: Customer with many orders (page 3)', () => {
  // Customer has 85 orders, viewing page 3
  const page = 3;
  const perPage = 20;
  const totalResults = 85;

  const pagination = calculatePagination(page, perPage, totalResults);

  assert(pagination.totalPages === 5, 'Should calculate 5 pages (85/20 = 4.25)');
  assert(pagination.hasMore === true, 'Should have more pages');
});

test('Scenario: Empty search results', () => {
  // User searches for product that doesn\'t exist
  const page = 1;
  const perPage = 20;
  const totalResults = 0;

  const pagination = calculatePagination(page, perPage, totalResults);
  const message = formatPaginationMessage(pagination);

  assert(pagination.totalPages === 0, 'Should have 0 pages');
  assert(message === '', 'Should not show pagination message');
});

test('Scenario: Requesting beyond last page (graceful handling)', () => {
  // User requests page 10 but only 5 pages exist
  const page = 10;
  const perPage = 20;
  const totalResults = 100; // only 5 pages

  const pagination = calculatePagination(page, perPage, totalResults);

  assert(pagination.page === 10, 'Should preserve requested page');
  assert(pagination.hasMore === false, 'Should not indicate more pages');
  assert(pagination.nextPage === undefined, 'Should not have next page');
});

// ============================================================================
// Edge Cases
// ============================================================================

test('Edge case: Single result', () => {
  const pagination = calculatePagination(1, 20, 1);

  assert(pagination.totalPages === 1, 'Single result should be 1 page');
  assert(pagination.hasMore === false, 'Should not have more pages');
});

test('Edge case: Exact page boundary (100 results, 20 per page)', () => {
  const pagination = calculatePagination(5, 20, 100);

  assert(pagination.totalPages === 5, 'Should have exactly 5 pages');
  assert(pagination.hasMore === false, 'Page 5 should be last page');
});

test('Edge case: Negative page number (enforced to 1)', () => {
  const pagination = calculatePagination(-5, 20, 100);

  assert(pagination.page === 1, 'Negative page should be enforced to 1');
});

test('Edge case: Zero per_page (enforced to 1)', () => {
  const pagination = calculatePagination(1, 0, 100);

  assert(pagination.perPage === 1, 'Zero per_page should be enforced to 1');
});

test('Edge case: Negative total (enforced to 0)', () => {
  const pagination = calculatePagination(1, 20, -50);

  assert(pagination.total === 0, 'Negative total should be enforced to 0');
  assert(pagination.totalPages === 0, 'Should have 0 pages');
});

test('Edge case: Very large per_page request (capped at 100)', () => {
  const pagination = calculatePagination(1, 999, 1000);

  assert(pagination.perPage === 100, 'Should cap at 100');
  assert(pagination.totalPages === 10, 'Should calculate based on capped value');
});

// ============================================================================
// Run Tests and Report
// ============================================================================

setTimeout(() => {
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('FAILED TESTS');
    console.log('='.repeat(80));
    results.filter(r => !r.passed).forEach(result => {
      console.log(`\n❌ ${result.name}`);
      console.log(`   Error: ${result.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  process.exit(failed > 0 ? 1 : 0);
}, 100);
