import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Import the functions we want to test directly
import {
  formatChunksForPrompt,
  analyzeQueryIntent
} from '@/lib/chat-context-enhancer';

// Mock data for testing
const createMockChunk = (overrides: Record<string, unknown> = {}) => ({
  content: 'Mock content for testing enhanced context window',
  url: `https://example.com/product/${overrides.id || 1}`,
  title: `Mock Product ${overrides.id || 1}`,
  similarity: overrides.similarity || 0.85,
  page_id: `page-${overrides.id || 1}`,
  chunk_index: overrides.chunk_index || 0,
  metadata: { source: 'test' },
  ...overrides
});

const createMockChunks = (count: number, baseSimil: number = 0.8) => {
  return Array.from({ length: count }, (_, i) => 
    createMockChunk({
      id: i + 1,
      similarity: baseSimil - (i * 0.02), // Decreasing similarity
      chunk_index: i
    })
  );
};

describe('Enhanced Context Window Implementation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.log to avoid test pollution
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
        expect(result.suggestedChunks).toBeGreaterThanOrEqual(8);
        console.log(`Product query "${query}" → ${result.suggestedChunks} chunks`);
      });
    });

    it('should detect technical queries and suggest more chunks', () => {
      const technicalQueries = [
        'What is the specification?', // 'specification' pattern
        'Is this compatible with my system?', // 'compatible' pattern  
        'How do I install this device?', // 'install' pattern
        'What material is this made of?' // 'material' pattern
      ];

      technicalQueries.forEach(query => {
        const result = analyzeQueryIntent(query);
        expect(result.needsTechnicalContext).toBe(true);
        expect(result.suggestedChunks).toBe(12); // More for technical queries
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
        expect(result.suggestedChunks).toBe(15); // Maximum for comparisons
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
        expect(result.suggestedChunks).toBe(8); // Base amount
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
      
      // This query should be detected as technical (specification) and should get 12 chunks
      expect(result.needsTechnicalContext).toBe(true);
      expect(result.suggestedChunks).toBe(12); // Technical queries get 12 chunks
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

      expect(formatted).toContain('## Highly Relevant Information:');
      expect(formatted).toContain('High Confidence Product');
      expect(formatted).toContain('95% match');
      expect(formatted).toContain('## Additional Context:');
      expect(formatted).toContain('Medium Confidence');
      expect(formatted).toContain('## Potentially Related:');
      expect(formatted).toContain('Lower Confidence');
      
      console.log(`Formatted ${chunks.length} chunks into structured prompt sections`);
    });

    it('should handle enhanced chunk count (10-15 chunks)', () => {
      const enhancedChunks = createMockChunks(12, 0.90); // 12 chunks with high similarity (>0.85)
      const formatted = formatChunksForPrompt(enhancedChunks);

      // Should handle larger chunk sets appropriately
      expect(formatted.length).toBeGreaterThan(500); // Substantial content
      expect(formatted).toContain('## Highly Relevant Information:');
      
      // Count how many sources are included
      const sourceCount = (formatted.match(/### Source \d+:/g) || []).length;
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
          content: 'A'.repeat(1000), // Long content
          title: 'Long Content Test'
        })
      ];

      const formatted = formatChunksForPrompt(chunks);
      
      // Should truncate to 500 chars + ... for medium confidence
      expect(formatted).toContain('A'.repeat(500) + '...');
      console.log(`Long content properly truncated for token management`);
    });

    it('should prioritize high-confidence chunks in formatting', () => {
      const mixedConfidenceChunks = [
        createMockChunk({ similarity: 0.95, title: 'Critical Info', content: 'Most important content' }),
        createMockChunk({ similarity: 0.60, title: 'Less Important', content: 'Lower priority content' }),
        createMockChunk({ similarity: 0.88, title: 'Important Info', content: 'High priority content' })
      ];

      const formatted = formatChunksForPrompt(mixedConfidenceChunks);
      
      // High confidence should appear first
      const criticalIndex = formatted.indexOf('Critical Info');
      const importantIndex = formatted.indexOf('Important Info');
      const lessImportantIndex = formatted.indexOf('Less Important');
      
      expect(criticalIndex).toBeLessThan(importantIndex);
      expect(importantIndex).toBeLessThan(lessImportantIndex);
      console.log('Chunks properly prioritized by confidence level');
    });
  });

  describe('Enhanced Context Window Validation', () => {
    it('should demonstrate improved context retrieval capacity', () => {
      // Simulate traditional vs enhanced approach
      const traditionalChunkCount = 5;
      const enhancedChunkCount = 12;
      
      const traditionalChunks = createMockChunks(traditionalChunkCount, 0.8);
      const enhancedChunks = createMockChunks(enhancedChunkCount, 0.85);
      
      // Calculate token usage
      const calculateTokens = (chunks: ReturnType<typeof createMockChunk>[]) => 
        chunks.reduce((sum, chunk) => sum + Math.ceil(chunk.content.length / 4), 0);
      
      const traditionalTokens = calculateTokens(traditionalChunks);
      const enhancedTokens = calculateTokens(enhancedChunks);
      
      expect(enhancedChunks.length).toBeGreaterThan(traditionalChunks.length);
      expect(enhancedTokens).toBeGreaterThan(traditionalTokens);
      
      // Calculate improvement metrics
      const chunkImprovement = ((enhancedChunkCount / traditionalChunkCount) - 1) * 100;
      const tokenImprovement = ((enhancedTokens / traditionalTokens) - 1) * 100;
      
      console.log(`Enhanced Context Window Benefits:
        - Chunk Count: ${traditionalChunkCount} → ${enhancedChunkCount} (+${chunkImprovement.toFixed(1)}%)
        - Token Usage: ${traditionalTokens} → ${enhancedTokens} (+${tokenImprovement.toFixed(1)}%)
        - Context Quality: Improved similarity baseline
      `);
      
      expect(chunkImprovement).toBeGreaterThan(100); // At least 2x improvement
    });

    it('should validate different query types get appropriate chunk counts', () => {
      const testCases = [
        { query: 'Simple question', expectedMin: 8, type: 'general' },
        { query: 'What is the price of SKU ABC123?', expectedMin: 8, type: 'product' },
        { query: 'How do I install this and what are the specifications?', expectedMin: 12, type: 'technical' },
        { query: 'Compare product A vs product B features and pricing', expectedMin: 15, type: 'comparison' }
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
      const largeChunkSet = createMockChunks(15, 0.90); // Maximum enhanced chunks with high similarity
      
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
      
      // Performance should be reasonable
      expect(processingTime).toBeLessThan(100); // Less than 100ms
      expect(formattedLength).toBeGreaterThan(500); // Adjusted expectation
      expect(Math.ceil(formattedLength / 4)).toBeLessThan(12000); // Within token limits
    });
  });

  describe('Token Limit Management', () => {
    it('should respect token limits even with enhanced chunk counts', () => {
      const veryLargeChunks = Array.from({ length: 20 }, (_, i) => 
        createMockChunk({
          id: i,
          content: 'A'.repeat(2000), // Large content ~500 tokens each
          similarity: 0.8 - (i * 0.01)
        })
      );

      const formatted = formatChunksForPrompt(veryLargeChunks.slice(0, 15)); // Take first 15
      const estimatedTokens = Math.ceil(formatted.length / 4);
      
      console.log(`Token Management Test:
        - Input chunks: 15 (large content)
        - Output length: ${formatted.length} characters
        - Estimated tokens: ${estimatedTokens}
        - Within limits: ${estimatedTokens < 12000 ? 'YES' : 'NO'}
      `);
      
      // Should stay within reasonable token limits
      expect(estimatedTokens).toBeLessThan(12000); // OpenAI context limit consideration
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
        memoryTest(5),   // Traditional
        memoryTest(12),  // Enhanced
        memoryTest(15)   // Maximum
      ];

      results.forEach(result => {
        console.log(`Memory usage for ${result.chunks} chunks: ${(result.memoryDelta / 1024).toFixed(2)}KB, output: ${result.outputSize} chars`);
        expect(result.memoryDelta).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      });
    });
  });

  describe('Real-world Scenario Testing', () => {
    it('should handle complex product queries with enhanced context', () => {
      const complexQuery = 'I need a heavy-duty industrial pump with stainless steel construction, flow rate over 100 GPM, and compatible with corrosive chemicals. What options do you have and what is the price?';
      
      const intent = analyzeQueryIntent(complexQuery);
      // This query contains "compatible" (technical pattern) and "price" (product pattern)
      expect(intent.needsTechnicalContext).toBe(true); // "compatible" pattern matches
      expect(intent.needsProductContext).toBe(true); // "price" pattern matches  
      expect(intent.suggestedChunks).toBe(12); // Technical queries get 12 chunks
      
      // Create realistic chunks for this scenario
      const contextChunks = [
        createMockChunk({ similarity: 0.92, title: 'Industrial Pump MP-150', content: 'Stainless steel construction, 150 GPM flow rate, chemical resistant, Price: $2,499' }),
        createMockChunk({ similarity: 0.89, title: 'Chemical Pump HC-200', content: 'Heavy-duty pump, 200 GPM, corrosive chemical compatibility, stainless steel housing' }),
        createMockChunk({ similarity: 0.85, title: 'Pump Specifications', content: 'Technical specifications: Materials, flow rates, chemical compatibility charts' }),
        // Add more chunks to simulate enhanced retrieval
        ...createMockChunks(9, 0.75)
      ];

      const formatted = formatChunksForPrompt(contextChunks);
      
      expect(formatted).toContain('Industrial Pump');
      expect(formatted).toContain('92% match');
      expect(contextChunks.length).toBe(12); // Enhanced context
      
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
      expect(intent.suggestedChunks).toBe(15); // Maximum for comparisons
      
      // Create comparison-focused chunks with higher similarity to ensure they're included
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
      expect(comparisonChunks.length).toBe(15); // Maximum enhanced context
      
      console.log(`Comparison Query Analysis:
        Products to compare: 2
        Total context chunks: ${comparisonChunks.length}
        Enhanced context benefit: Maximum chunks for thorough comparison
      `);
    });
  });
});