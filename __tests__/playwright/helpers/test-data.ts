/**
 * Common test data for E2E tests
 */

export const SPECIAL_SEARCH_QUERIES = [
  { query: 'user@example.com', description: 'email address' },
  { query: '$99.99', description: 'price with currency' },
  { query: '"exact phrase"', description: 'quoted phrase' },
  { query: 'product #12345', description: 'hash symbol' },
  { query: '50% discount', description: 'percentage' }
];

export const TEST_AUTH_COOKIE = {
  name: 'test-auth',
  value: 'authenticated',
  domain: 'localhost',
  path: '/',
};

export const FILTER_BUTTON_SELECTORS = [
  'button:has-text("Filters")',
  'button[aria-label*="filter"]'
];

export const DATE_RANGE_SELECTORS = [
  'select[name="dateRange"]',
  '[data-testid="date-range"]'
];

export const STATUS_CHECKBOX_TEMPLATE = (status: string) => [
  `input[value="${status}"]`,
  `label:has-text("${status}") input[type="checkbox"]`
];

export const APPLY_BUTTON_SELECTORS = [
  'button:has-text("Apply")',
  'button:has-text("Search")',
  'button[type="submit"]'
];
