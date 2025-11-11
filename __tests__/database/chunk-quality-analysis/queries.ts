import { TestQuery } from './types';

export const TEST_DOMAIN = 'test-domain.example.com';

export const TEST_QUERIES: TestQuery[] = [
  {
    name: 'Specific Product with SKU',
    query: '10mtr extension cables for all TS Camera systems',
    expectedType: 'product',
    description: 'Full product description from the product page',
  },
  {
    name: 'SKU Lookup',
    query: '10M-CC',
    expectedType: 'product',
    description: 'Direct SKU code search',
  },
  {
    name: 'Price Query',
    query: 'extension cables price',
    expectedType: 'product',
    description: 'Query combining product feature and pricing intent',
  },
  {
    name: 'Technical Specification',
    query: 'IP69K waterproof connectors',
    expectedType: 'product',
    description: 'Technical spec that appears in product details',
  },
  {
    name: 'Category Query',
    query: 'camera cables',
    expectedType: 'navigation',
    description: 'Broad category that might match navigation',
  },
  {
    name: 'Generic Product Type',
    query: 'extension cables',
    expectedType: 'general',
    description: 'General term that could match many pages',
  },
];
