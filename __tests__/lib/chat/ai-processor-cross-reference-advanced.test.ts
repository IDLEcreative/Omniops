/**
 * AI Processor - Cross-Reference Advanced Tests
 *
 * Tests advanced cross-reference formatting functionality:
 * - Complete enriched product formatting
 * - Multiple enriched products
 * - Edge cases and error handling
 *
 * See ai-processor-cross-reference-basic.test.ts for basic formatting tests
 */

import { formatToolResultsForAI } from '@/lib/chat/ai-processor-tool-executor';
import {
  createToolExecutionResult,
  createWooCommerceToolResult,
} from './helpers/cross-reference-test-helpers';

describe('AI Processor - Cross-Reference Advanced', () => {
  describe('Complete enriched product formatting', () => {
    it('should format complete enriched product result', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Hydraulic Pump A4VTG90',
        url: 'https://example.com/product',
        content: 'Industrial hydraulic pump. Detailed specifications from website.',
        similarity: 0.95,
        matchedPageUrl: 'https://example.com/products/pump-details',
        sources: {
          liveData: true,
          scrapedContent: true,
          relatedContent: true,
        },
        relatedPages: [
          {
            title: 'Installation Guide',
            url: 'https://example.com/install',
            similarity: 0.85,
          },
        ],
      });

      const formatted = formatToolResultsForAI([toolResult]);
      const content = formatted[0].content;

      // Verify all enrichment elements are present
      expect(content).toContain('Found 1 results');
      expect(content).toContain('Hydraulic Pump A4VTG90');
      expect(content).toContain('URL: https://example.com/product');
      expect(content).toContain('Learn more: https://example.com/products/pump-details');
      expect(content).toContain('Sources: Live catalog, Website content, Related pages');
      expect(content).toContain('Related pages:');
      expect(content).toContain('1. Installation Guide (85% relevant)');
      expect(content).toContain('Content: Industrial hydraulic pump');
      expect(content).toContain('Relevance: 95.0%');
    });

    it('should handle multiple enriched products', () => {
      const toolResult = createToolExecutionResult({
        toolName: 'woocommerce_operations',
        toolArgs: { operation: 'searchProducts' },
        result: {
          success: true,
          results: [
            {
              url: 'https://example.com/product1',
              title: 'Product 1',
              content: 'Description 1',
              similarity: 0.95,
              metadata: {
                matchedPageUrl: 'https://example.com/details1',
                sources: { liveData: true, scrapedContent: true, relatedContent: false },
              },
            },
            {
              url: 'https://example.com/product2',
              title: 'Product 2',
              content: 'Description 2',
              similarity: 0.90,
              metadata: {
                matchedPageUrl: 'https://example.com/details2',
                sources: { liveData: true, scrapedContent: true, relatedContent: false },
              },
            },
          ],
          source: 'woocommerce-api',
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);
      const content = formatted[0].content;

      expect(content).toContain('Found 2 results');
      expect(content).toContain('1. Product 1');
      expect(content).toContain('2. Product 2');
      expect(content).toContain('Learn more: https://example.com/details1');
      expect(content).toContain('Learn more: https://example.com/details2');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing metadata gracefully', () => {
      const toolResult = createToolExecutionResult({
        toolName: 'woocommerce_operations',
        toolArgs: { operation: 'searchProducts' },
        result: {
          success: true,
          results: [
            {
              url: 'https://example.com/product',
              title: 'Product',
              content: 'Description',
              similarity: 0.9,
              // No metadata
            },
          ],
          source: 'woocommerce-api',
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('Product');
      expect(formatted[0].content).not.toContain('Learn more:');
      expect(formatted[0].content).not.toContain('Sources:');
    });

    it('should handle empty results array with proper message', () => {
      const toolResult = createToolExecutionResult({
        toolName: 'woocommerce_operations',
        toolArgs: { operation: 'searchProducts', query: 'nonexistent' },
        result: {
          success: true,
          results: [], // Empty
          source: 'woocommerce-api',
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('nonexistent');
      expect(formatted[0].content).toMatch(/couldn't find any information/i);
    });

    it('should handle null metadata object', () => {
      const toolResult = createToolExecutionResult({
        toolName: 'woocommerce_operations',
        toolArgs: { operation: 'searchProducts' },
        result: {
          success: true,
          results: [
            {
              url: 'https://example.com/product',
              title: 'Product',
              content: 'Description',
              similarity: 0.9,
              metadata: null as any,
            },
          ],
          source: 'woocommerce-api',
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('Product');
      expect(formatted[0].content).not.toContain('Learn more:');
    });

    it('should truncate long content appropriately', () => {
      const longContent = 'A'.repeat(500);
      const toolResult = createToolExecutionResult({
        toolName: 'search_website_content',
        toolArgs: { query: 'test' },
        result: {
          success: true,
          results: [
            {
              url: 'https://example.com/page',
              title: 'Page',
              content: longContent,
              similarity: 0.9,
            },
          ],
          source: 'website-search',
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);

      // Content should be truncated to 200 chars
      expect(formatted[0].content).toContain('Content: ' + 'A'.repeat(200) + '...');
      expect(formatted[0].content).not.toContain('A'.repeat(201));
    });
  });
});
