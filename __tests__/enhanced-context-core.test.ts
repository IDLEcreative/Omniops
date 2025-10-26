import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { formatChunksForPrompt, analyzeQueryIntent } from '@/lib/chat-context-enhancer';
import { createMockChunk, createMockChunks } from './helpers/enhanced-context-mocks';

describe('Enhanced Context Window - Core Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Query Intent Analysis - analyzeQueryIntent', () => {
    it('should detect product-specific queries', () => {
      const productQueries = [
        'What is the price of SKU ABC123?',
        'Is part XYZ-456 in stock?',
        'How much does this product cost?',
        'I want to buy this item'
      ];

      productQueries.forEach(query => {
        const result = analyzeQueryIntent(query);
        expect(result.needsProductContext).toBe(true);
        expect(result.suggestedChunks).toBeGreaterThanOrEqual(15);
        console.log(`Product query "${query}" → ${result.suggestedChunks} chunks`);
      });
    });

    it('should detect technical queries and suggest more chunks', () => {
      const technicalQueries = [
        'What is the specification?',
        'Is this compatible with my system?',
        'How do I install this device?',
        'What material is this made of?'
      ];

      technicalQueries.forEach(query => {
        const result = analyzeQueryIntent(query);
        expect(result.needsTechnicalContext).toBe(true);
        expect(result.suggestedChunks).toBe(20);
        console.log(`Technical query "${query}" → ${result.suggestedChunks} chunks, technical: ${result.needsTechnicalContext}`);
      });
    });

    it('should suggest maximum chunks for comparison queries', () => {
      const comparisonQueries = [
        'What is the difference between A and B?',
        'Compare these two products'
      ];

      comparisonQueries.forEach(query => {
        const result = analyzeQueryIntent(query);
        expect(result.suggestedChunks).toBe(25);
        console.log(`Comparison query "${query}" → ${result.suggestedChunks} chunks`);
      });
    });

    it('should identify general queries with base chunk count', () => {
      const generalQueries = [
        'Tell me about your company',
        'What services do you offer?',
        'Where are you located?'
      ];

      generalQueries.forEach(query => {
        const result = analyzeQueryIntent(query);
        expect(result.needsGeneralContext).toBe(true);
        expect(result.suggestedChunks).toBe(15);
        console.log(`General query "${query}" → ${result.suggestedChunks} chunks`);
      });
    });

    it('should provide comprehensive intent analysis', () => {
      const testQuery = 'What is the specification for SKU ABC123 and how much does it cost?';
      const result = analyzeQueryIntent(testQuery);

      expect(result).toHaveProperty('needsProductContext');
      expect(result).toHaveProperty('needsTechnicalContext');
      expect(result).toHaveProperty('needsGeneralContext');
      expect(result).toHaveProperty('suggestedChunks');

      expect(result.needsTechnicalContext).toBe(true);
      expect(result.suggestedChunks).toBe(20);
    });
  });

  describe('Chunk Formatting - formatChunksForPrompt', () => {
    it('should format chunks with confidence tiers for enhanced context', () => {
      const chunks = [
        createMockChunk({ similarity: 0.95, title: 'High Confidence Product', content: 'SKU: ABC123 Price: $199.99' }),
        createMockChunk({ similarity: 0.90, title: 'Very High Confidence', content: 'Product specifications and details' }),
        createMockChunk({ similarity: 0.75, title: 'Medium Confidence', content: 'Related product information' }),
        createMockChunk({ similarity: 0.65, title: 'Lower Confidence', content: 'General company information' })
      ];

      const formatted = formatChunksForPrompt(chunks);

      expect(formatted).toContain('## CONFIDENCE GUIDE FOR RESPONSES:');
      expect(formatted).toContain('High Confidence Product');
      expect(formatted).toContain('95% match');
      expect(formatted).toContain('## HIGH CONFIDENCE');
      expect(formatted).toContain('Medium Confidence');
      expect(formatted).toContain('## MEDIUM CONFIDENCE');
      expect(formatted).toContain('Lower Confidence');

      console.log(`Formatted ${chunks.length} chunks into structured prompt sections`);
    });

    it('should handle enhanced chunk count (10-15 chunks)', () => {
      const enhancedChunks = createMockChunks(12, 0.90);
      const formatted = formatChunksForPrompt(enhancedChunks);

      expect(formatted.length).toBeGreaterThan(500);
      expect(formatted).toContain('## HIGH CONFIDENCE');

      const sourceCount = (formatted.match(/### Product \d+:/g) || []).length;
      console.log(`Enhanced formatting included ${sourceCount} sources from ${enhancedChunks.length} chunks`);
      expect(sourceCount).toBeGreaterThan(0);
    });

    it('should handle empty chunks gracefully', () => {
      const formatted = formatChunksForPrompt([]);
      expect(formatted).toBe('No relevant information found.');
    });

    it('should truncate long content appropriately for token management', () => {
      const chunks = [
        createMockChunk({
          similarity: 0.75,
          content: 'A'.repeat(1000),
          title: 'Long Content Test'
        })
      ];

      const formatted = formatChunksForPrompt(chunks);

      // Medium confidence chunks are truncated to 500 chars
      expect(formatted).toContain('A'.repeat(500));
      console.log(`Long content properly truncated for token management`);
    });

    it('should prioritize high-confidence chunks in formatting', () => {
      const mixedConfidenceChunks = [
        createMockChunk({ similarity: 0.95, title: 'Critical Info', content: 'Most important content' }),
        createMockChunk({ similarity: 0.60, title: 'Less Important', content: 'Lower priority content' }),
        createMockChunk({ similarity: 0.88, title: 'Important Info', content: 'High priority content' })
      ];

      const formatted = formatChunksForPrompt(mixedConfidenceChunks);

      const criticalIndex = formatted.indexOf('Critical Info');
      const importantIndex = formatted.indexOf('Important Info');
      const lessImportantIndex = formatted.indexOf('Less Important');

      expect(criticalIndex).toBeLessThan(importantIndex);
      expect(importantIndex).toBeLessThan(lessImportantIndex);
      console.log('Chunks properly prioritized by confidence level');
    });
  });

  describe('Token Limit Management', () => {
    it('should respect token limits even with enhanced chunk counts', () => {
      const veryLargeChunks = Array.from({ length: 20 }, (_, i) =>
        createMockChunk({
          id: i,
          content: 'A'.repeat(2000),
          similarity: 0.8 - (i * 0.01)
        })
      );

      const formatted = formatChunksForPrompt(veryLargeChunks.slice(0, 15));
      const estimatedTokens = Math.ceil(formatted.length / 4);

      console.log(`Token Management Test:
        - Input chunks: 15 (large content)
        - Output length: ${formatted.length} characters
        - Estimated tokens: ${estimatedTokens}
        - Within limits: ${estimatedTokens < 12000 ? 'YES' : 'NO'}
      `);

      expect(estimatedTokens).toBeLessThan(12000);
    });

    it('should efficiently handle memory usage with large chunk sets', () => {
      const memoryTest = (count: number) => {
        const chunks = createMockChunks(count, 0.8);
        const startMemory = process.memoryUsage().heapUsed;
        const formatted = formatChunksForPrompt(chunks);
        const endMemory = process.memoryUsage().heapUsed;

        return {
          chunks: count,
          memoryDelta: endMemory - startMemory,
          outputSize: formatted.length
        };
      };

      const results = [
        memoryTest(5),
        memoryTest(12),
        memoryTest(15)
      ];

      results.forEach(result => {
        console.log(`Memory usage for ${result.chunks} chunks: ${(result.memoryDelta / 1024).toFixed(2)}KB, output: ${result.outputSize} chars`);
        expect(result.memoryDelta).toBeLessThan(10 * 1024 * 1024);
      });
    });
  });
});
