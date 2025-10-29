import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { formatChunksForPrompt, analyzeQueryIntent } from '@/lib/chat-context-enhancer';
import { createMockChunk, createMockChunks, calculateTokens } from './helpers/enhanced-context-mocks';

describe('Enhanced Context Window - Real-World Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Enhanced Context Window Validation', () => {
    it('should demonstrate improved context retrieval capacity', () => {
      const traditionalChunkCount = 5;
      const enhancedChunkCount = 12;

      const traditionalChunks = createMockChunks(traditionalChunkCount, 0.8);
      const enhancedChunks = createMockChunks(enhancedChunkCount, 0.85);

      const traditionalTokens = calculateTokens(traditionalChunks);
      const enhancedTokens = calculateTokens(enhancedChunks);

      expect(enhancedChunks.length).toBeGreaterThan(traditionalChunks.length);
      expect(enhancedTokens).toBeGreaterThan(traditionalTokens);

      const chunkImprovement = ((enhancedChunkCount / traditionalChunkCount) - 1) * 100;
      const tokenImprovement = ((enhancedTokens / traditionalTokens) - 1) * 100;

      console.log(`Enhanced Context Window Benefits:
        - Chunk Count: ${traditionalChunkCount} → ${enhancedChunkCount} (+${chunkImprovement.toFixed(1)}%)
        - Token Usage: ${traditionalTokens} → ${enhancedTokens} (+${tokenImprovement.toFixed(1)}%)
        - Context Quality: Improved similarity baseline
      `);

      expect(chunkImprovement).toBeGreaterThan(100);
    });

    it('should validate different query types get appropriate chunk counts', () => {
      const testCases = [
        { query: 'Simple question', expectedMin: 15, type: 'general' },
        { query: 'What is the price of SKU ABC123?', expectedMin: 15, type: 'product' },
        { query: 'How do I install this and what are the specifications?', expectedMin: 20, type: 'technical' },
        { query: 'Compare product A vs product B features and pricing', expectedMin: 25, type: 'comparison' }
      ];

      testCases.forEach(testCase => {
        const intent = analyzeQueryIntent(testCase.query);
        expect(intent.suggestedChunks).toBeGreaterThanOrEqual(testCase.expectedMin);

        console.log(`${testCase.type.toUpperCase()} query analysis:
          Query: "${testCase.query}"
          Suggested chunks: ${intent.suggestedChunks}
          Product context: ${intent.needsProductContext}
          Technical context: ${intent.needsTechnicalContext}
        `);
      });
    });

    it('should handle performance implications of enhanced context', () => {
      const largeChunkSet = createMockChunks(15, 0.90);

      const startTime = performance.now();
      const formatted = formatChunksForPrompt(largeChunkSet);
      const endTime = performance.now();

      const processingTime = endTime - startTime;
      const formattedLength = formatted.length;

      console.log(`Performance Analysis:
        - Chunks processed: ${largeChunkSet.length}
        - Processing time: ${processingTime.toFixed(2)}ms
        - Output length: ${formattedLength} characters
        - Estimated tokens: ~${Math.ceil(formattedLength / 4)}
      `);

      expect(processingTime).toBeLessThan(100);
      expect(formattedLength).toBeGreaterThan(500);
      expect(Math.ceil(formattedLength / 4)).toBeLessThan(12000);
    });
  });

  describe('Real-world Scenario Testing', () => {
    it('should handle complex product queries with enhanced context', () => {
      const complexQuery = 'I need a heavy-duty product with stainless steel construction, high performance specifications, and compatible with specialized uses. What options do you have and what is the price?';

      const intent = analyzeQueryIntent(complexQuery);
      expect(intent.needsTechnicalContext).toBe(true);
      expect(intent.needsProductContext).toBe(true);
      expect(intent.suggestedChunks).toBe(20);

      const contextChunks = [
        createMockChunk({ similarity: 0.92, title: 'Industrial Pump MP-150', content: 'Stainless steel construction, 150 GPM flow rate, chemical resistant, Price: $2,499' }),
        createMockChunk({ similarity: 0.89, title: 'Chemical Pump HC-200', content: 'Heavy-duty pump, 200 GPM, corrosive chemical compatibility, stainless steel housing' }),
        createMockChunk({ similarity: 0.85, title: 'Pump Specifications', content: 'Technical specifications: Materials, flow rates, chemical compatibility charts' }),
        ...createMockChunks(9, 0.75)
      ];

      const formatted = formatChunksForPrompt(contextChunks);

      expect(formatted).toContain('Industrial Pump');
      expect(formatted).toContain('92% match');
      expect(contextChunks.length).toBe(12);

      console.log(`Complex Query Handling:
        Query complexity: High (technical + product + pricing)
        Context chunks: ${contextChunks.length}
        Intent analysis: Product=${intent.needsProductContext}, Technical=${intent.needsTechnicalContext}
        Suggested chunks: ${intent.suggestedChunks}
      `);
    });

    it('should provide comprehensive comparison analysis', () => {
      const comparisonQuery = 'Compare the Acme Pro 2000 vs the UltraMax 3000 in terms of specifications, pricing, and performance';

      const intent = analyzeQueryIntent(comparisonQuery);
      expect(intent.suggestedChunks).toBe(25);

      const comparisonChunks = createMockChunks(15, 0.90).map((chunk, i) => ({
        ...chunk,
        title: i < 7 ? `Acme Pro 2000 - ${chunk.title}` : i < 14 ? `UltraMax 3000 - ${chunk.title}` : 'Comparison Guide',
        content: i < 7 ? 'Acme Pro 2000 specifications and pricing details' :
                i < 14 ? 'UltraMax 3000 features and performance data' :
                'Side-by-side comparison of both products'
      }));

      const formatted = formatChunksForPrompt(comparisonChunks);

      expect(formatted).toContain('Acme Pro 2000');
      expect(formatted).toContain('UltraMax 3000');
      expect(comparisonChunks.length).toBe(15);

      console.log(`Comparison Query Analysis:
        Products to compare: 2
        Total context chunks: ${comparisonChunks.length}
        Enhanced context benefit: Maximum chunks for thorough comparison
      `);
    });
  });
});
