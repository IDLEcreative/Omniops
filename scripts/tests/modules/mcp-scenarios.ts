/**
 * Test Scenarios for MCP Comparison
 *
 * Comprehensive test cases covering exact SKU matches, semantic search,
 * multiple results, edge cases, and error handling.
 */

import { ComparisonTestCase } from './mcp-types';

export const TEST_CASES: ComparisonTestCase[] = [
  // ========== Exact SKU Matches ==========
  {
    id: 'exact_sku_1',
    description: 'Exact SKU match - should use fast path',
    userQuery: 'Do you have part number A4VTG90?',
    expectedBehavior: 'Returns exact product match',
    category: 'exact_sku',
    metadata: { expectedSKU: 'A4VTG90' }
  },
  {
    id: 'exact_sku_2',
    description: 'SKU with spaces',
    userQuery: 'Show me A4VTG 90',
    expectedBehavior: 'Normalizes SKU and finds match',
    category: 'exact_sku',
    metadata: { expectedSKU: 'A4VTG90' }
  },
  {
    id: 'exact_sku_3',
    description: 'SKU in lowercase',
    userQuery: 'do you stock a4vtg90?',
    expectedBehavior: 'Case-insensitive SKU matching',
    category: 'exact_sku',
    metadata: { expectedSKU: 'A4VTG90' }
  },
  {
    id: 'exact_sku_4',
    description: 'SKU with dashes',
    userQuery: 'I need BP-001',
    expectedBehavior: 'Matches SKU with special characters',
    category: 'exact_sku',
    metadata: { expectedSKU: 'BP-001' }
  },

  // ========== Semantic Product Search ==========
  {
    id: 'semantic_1',
    description: 'Generic product search',
    userQuery: 'I need hydraulic pumps',
    expectedBehavior: 'Returns relevant pump products',
    category: 'semantic_search'
  },
  {
    id: 'semantic_2',
    description: 'Feature-based search',
    userQuery: 'Show me high pressure pumps for industrial use',
    expectedBehavior: 'Returns pumps with high pressure ratings',
    category: 'semantic_search'
  },
  {
    id: 'semantic_3',
    description: 'Application-based search',
    userQuery: 'What do you recommend for concrete pumping?',
    expectedBehavior: 'Returns products suitable for concrete',
    category: 'semantic_search'
  },
  {
    id: 'semantic_4',
    description: 'Compatibility query',
    userQuery: 'What products work with ZF5 systems?',
    expectedBehavior: 'Returns compatible products',
    category: 'semantic_search'
  },
  {
    id: 'semantic_5',
    description: 'Technical specification search',
    userQuery: 'I need a pump with 3000 PSI minimum',
    expectedBehavior: 'Returns products meeting spec',
    category: 'semantic_search'
  },

  // ========== Multiple Results ==========
  {
    id: 'multi_result_1',
    description: 'Category browse',
    userQuery: 'Show me all available pumps',
    expectedBehavior: 'Returns paginated pump results',
    category: 'multi_result'
  },
  {
    id: 'multi_result_2',
    description: 'Filtered search',
    userQuery: 'Show me pumps under $500',
    expectedBehavior: 'Returns price-filtered results',
    category: 'multi_result'
  },
  {
    id: 'multi_result_3',
    description: 'Brand-specific search',
    userQuery: 'What Cifa products do you have?',
    expectedBehavior: 'Returns brand-filtered results',
    category: 'multi_result'
  },
  {
    id: 'multi_result_4',
    description: 'Broad category query',
    userQuery: 'Show me parts',
    expectedBehavior: 'Returns general parts listing',
    category: 'multi_result'
  },

  // ========== Edge Cases ==========
  {
    id: 'edge_case_1',
    description: 'Ambiguous query',
    userQuery: 'parts',
    expectedBehavior: 'Asks for clarification or returns top results',
    category: 'edge_case'
  },
  {
    id: 'edge_case_2',
    description: 'Non-existent product',
    userQuery: 'Do you have flying carpets?',
    expectedBehavior: 'Politely indicates product not found',
    category: 'edge_case'
  },
  {
    id: 'edge_case_3',
    description: 'Very long query',
    userQuery: 'I am looking for a high-quality industrial hydraulic pump that can handle at least 3000 PSI with a flow rate of 20 GPM and is compatible with ZF5 transmission systems for use in concrete pumping applications',
    expectedBehavior: 'Extracts key requirements and searches',
    category: 'edge_case'
  },
  {
    id: 'edge_case_4',
    description: 'Special characters in query',
    userQuery: 'Do you have pump with 3/4" NPT connection?',
    expectedBehavior: 'Handles special chars correctly',
    category: 'edge_case'
  },
  {
    id: 'edge_case_5',
    description: 'Multi-word product name',
    userQuery: 'Looking for Rexroth A4VTG variable displacement pump',
    expectedBehavior: 'Matches full product name',
    category: 'edge_case'
  },

  // ========== Error Handling ==========
  {
    id: 'error_handling_1',
    description: 'Misspelled product',
    userQuery: 'Do you have hydrualic pumps?',
    expectedBehavior: 'Tolerates typos and suggests corrections',
    category: 'error_handling'
  },
  {
    id: 'error_handling_2',
    description: 'Mixed language query',
    userQuery: 'Necesito bombas hydraulicas',
    expectedBehavior: 'Handles mixed language gracefully',
    category: 'error_handling'
  },
  {
    id: 'error_handling_3',
    description: 'Stock availability question',
    userQuery: 'Is A4VTG90 in stock?',
    expectedBehavior: 'Searches product and provides info',
    category: 'error_handling'
  },
];
