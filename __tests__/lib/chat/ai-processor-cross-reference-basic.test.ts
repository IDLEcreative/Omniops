/**
 * AI Processor - Cross-Reference Basic Tests
 *
 * Tests basic cross-reference formatting functionality:
 * - Learn more link display
 * - Sources display
 * - Related pages display
 *
 * See ai-processor-cross-reference-advanced.test.ts for:
 * - Complete enriched product formatting
 * - Multiple products
 * - Edge cases
 */

import { formatToolResultsForAI } from '@/lib/chat/ai-processor-tool-executor';
import {
  createToolExecutionResult,
  createWooCommerceToolResult,
} from './helpers/cross-reference-test-helpers';

describe('AI Processor - Cross-Reference Basic', () => {
  describe('Learn more link display', () => {
    it('should display Learn more link when matchedPageUrl present', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
        matchedPageUrl: 'https://example.com/products/test-product-details',
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('Learn more:');
      expect(formatted[0].content).toContain('https://example.com/products/test-product-details');
    });

    it('should not show Learn more if matchedPageUrl same as main URL', () => {
      const sameUrl = 'https://example.com/product';
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: sameUrl,
        content: 'Description',
        similarity: 0.9,
        matchedPageUrl: sameUrl,
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).not.toContain('Learn more:');
    });

    it('should not show Learn more when no matchedPageUrl', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).not.toContain('Learn more:');
    });
  });

  describe('Sources display', () => {
    it('should display all sources when all present', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
        sources: {
          liveData: true,
          scrapedContent: true,
          relatedContent: true,
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('Sources:');
      expect(formatted[0].content).toContain('Live catalog');
      expect(formatted[0].content).toContain('Website content');
      expect(formatted[0].content).toContain('Related pages');
    });

    it('should display only live catalog when others are false', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
        sources: {
          liveData: true,
          scrapedContent: false,
          relatedContent: false,
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('Sources:');
      expect(formatted[0].content).toContain('Live catalog');
      expect(formatted[0].content).not.toContain('Website content');
      expect(formatted[0].content).not.toContain('Related pages');
    });

    it('should display live catalog and website content only', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
        sources: {
          liveData: true,
          scrapedContent: true,
          relatedContent: false,
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('Sources:');
      expect(formatted[0].content).toContain('Live catalog, Website content');
      expect(formatted[0].content).not.toContain('Related pages');
    });

    it('should not display sources section when no sources metadata', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).not.toContain('Sources:');
    });
  });

  describe('Related pages display', () => {
    it('should display related pages with similarity percentages', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
        relatedPages: [
          {
            title: 'Installation Guide',
            url: 'https://example.com/guide',
            similarity: 0.85,
          },
          {
            title: 'Maintenance Tips',
            url: 'https://example.com/maintenance',
            similarity: 0.75,
          },
        ],
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('Related pages:');
      expect(formatted[0].content).toContain('1. Installation Guide (85% relevant)');
      expect(formatted[0].content).toContain('2. Maintenance Tips (75% relevant)');
    });

    it('should not display related pages when array is empty', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
        relatedPages: [],
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).not.toContain('Related pages:');
    });

    it('should not display related pages when not present in metadata', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).not.toContain('Related pages:');
    });

    it('should format similarity percentages correctly', () => {
      const toolResult = createWooCommerceToolResult({
        title: 'Test Product',
        url: 'https://example.com/product',
        content: 'Description',
        similarity: 0.9,
        relatedPages: [
          {
            title: 'Page 1',
            url: 'https://example.com/page1',
            similarity: 0.987, // Should round to 99%
          },
          {
            title: 'Page 2',
            url: 'https://example.com/page2',
            similarity: 0.724, // Should round to 72%
          },
        ],
      });

      const formatted = formatToolResultsForAI([toolResult]);

      expect(formatted[0].content).toContain('99% relevant');
      expect(formatted[0].content).toContain('72% relevant');
    });
  });

  describe('Non-enriched content', () => {
    it('should display normal results without enrichment', () => {
      const toolResult = createToolExecutionResult({
        toolName: 'search_website_content',
        toolArgs: { query: 'test' },
        result: {
          success: true,
          results: [
            {
              url: 'https://example.com/page',
              title: 'Normal Page',
              content: 'Regular content without enrichment',
              similarity: 0.80,
            },
          ],
          source: 'website-search',
        },
      });

      const formatted = formatToolResultsForAI([toolResult]);
      const content = formatted[0].content;

      expect(content).toContain('Found 1 results');
      expect(content).toContain('Normal Page');
      expect(content).not.toContain('Learn more:');
      expect(content).not.toContain('Sources:');
      expect(content).not.toContain('Related pages:');
    });
  });
});
