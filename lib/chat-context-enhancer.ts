/**
 * Chat Context Enhancer
 * Improves chat accuracy by providing more relevant context to the AI
 */

import { searchSimilarContentEnhanced } from './enhanced-embeddings';
import { smartSearch } from './search-wrapper';
import { synonymExpander } from './synonym-expander-dynamic';

interface ContextChunk {
  content: string;
  url: string;
  title: string;
  similarity: number;
  source?: 'embedding' | 'smart' | 'fallback';
}

interface EnhancedContext {
  chunks: ContextChunk[];
  totalChunks: number;
  averageSimilarity: number;
  hasHighConfidence: boolean;
  contextSummary?: string;
}

/**
 * Get enhanced context for chat queries with increased chunk window
 */
export async function getEnhancedChatContext(
  message: string,
  domain: string,
  domainId: string,
  options: {
    enableSmartSearch?: boolean;
    minChunks?: number;
    maxChunks?: number;
  } = {}
): Promise<EnhancedContext> {
  const {
    enableSmartSearch = true,
    minChunks = 20,  // Increased from 10 to 20 for better recall
    maxChunks = 25   // Maximum chunks to retrieve (increased from 15)
  } = options;

  console.log(`[Context Enhancer] Getting enhanced context for: "${message.substring(0, 50)}..."`);
  
  // Apply domain-specific synonym expansion to the query
  const expandedQuery = await synonymExpander.expandQuery(message, domainId, 3);
  const hasExpansion = expandedQuery !== message.toLowerCase().split(/\s+/).join(' ');
  
  if (hasExpansion) {
    console.log(`[Context Enhancer] Expanded query: "${expandedQuery.substring(0, 100)}..."`);
  }
  
  const allChunks: ContextChunk[] = [];
  
  try {
    // 1. Try enhanced embedding search first (gets 20-25 chunks)
    // Use expanded query for better matching
    const embeddingResults = await searchSimilarContentEnhanced(
      hasExpansion ? expandedQuery : message,
      domain,
      minChunks,
      0.15  // Much lower threshold - was 0.45, now 0.15 for maximum recall
    );
    
    if (embeddingResults && embeddingResults.length > 0) {
      console.log(`[Context Enhancer] Found ${embeddingResults.length} embedding chunks`);
      allChunks.push(...embeddingResults.map(r => ({
        ...r,
        source: 'embedding' as const
      })));
    }
    
    // 2. If enabled and we need more chunks, try smart search
    if (enableSmartSearch && allChunks.length < minChunks) {
      console.log(`[Context Enhancer] Need more chunks, trying smart search...`);
      
      // Use expanded query for smart search as well
      const smartResults = await smartSearch(
        hasExpansion ? expandedQuery : message,
        domain,
        minChunks - allChunks.length,  // Get remaining chunks needed
        0.2,  // Lower threshold for broader matches
        {
          boostRecent: true
          // Note: Duplicate removal handled by deduplicateChunks function
        }
      );
      
      if (smartResults && smartResults.length > 0) {
        console.log(`[Context Enhancer] Found ${smartResults.length} additional smart search chunks`);
        allChunks.push(...smartResults.map(r => ({
          ...r,
          source: 'smart' as const
        })));
      }
    }
    
    // 3. Deduplicate chunks by URL
    const uniqueChunks = deduplicateChunks(allChunks);
    
    // 4. Sort by similarity and trim to max
    const sortedChunks = uniqueChunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxChunks);
    
    // 5. Calculate metrics
    const avgSimilarity = sortedChunks.length > 0
      ? sortedChunks.reduce((sum, c) => sum + c.similarity, 0) / sortedChunks.length
      : 0;
    
    const hasHighConfidence = sortedChunks.some(c => c.similarity > 0.85);
    
    // 6. Generate context summary if we have good chunks
    let contextSummary: string | undefined;
    if (sortedChunks.length >= 3 && avgSimilarity > 0.7) {
      contextSummary = generateContextSummary(sortedChunks);
    }
    
    console.log(`[Context Enhancer] Final context: ${sortedChunks.length} chunks, avg similarity: ${avgSimilarity.toFixed(3)}`);
    
    return {
      chunks: sortedChunks,
      totalChunks: sortedChunks.length,
      averageSimilarity: avgSimilarity,
      hasHighConfidence,
      contextSummary
    };
    
  } catch (error) {
    console.error('[Context Enhancer] Error getting enhanced context:', error);
    
    // Return empty context on error
    return {
      chunks: [],
      totalChunks: 0,
      averageSimilarity: 0,
      hasHighConfidence: false
    };
  }
}

/**
 * Deduplicate chunks by URL, keeping the highest similarity version
 */
function deduplicateChunks(chunks: ContextChunk[]): ContextChunk[] {
  const uniqueMap = new Map<string, ContextChunk>();
  
  for (const chunk of chunks) {
    const existing = uniqueMap.get(chunk.url);
    if (!existing || chunk.similarity > existing.similarity) {
      uniqueMap.set(chunk.url, chunk);
    }
  }
  
  return Array.from(uniqueMap.values());
}

/**
 * Generate a summary of the context for the AI
 */
function generateContextSummary(chunks: ContextChunk[]): string {
  const sources = chunks.map(c => c.source).filter(Boolean);
  const uniqueSources = [...new Set(sources)];
  
  const highConfidenceCount = chunks.filter(c => c.similarity > 0.8).length;
  const productCount = chunks.filter(c => 
    c.content.toLowerCase().includes('sku:') || 
    c.content.toLowerCase().includes('price:')
  ).length;
  
  const summaryParts = [
    `Found ${chunks.length} relevant information sources`,
    highConfidenceCount > 0 ? `${highConfidenceCount} with high confidence` : null,
    productCount > 0 ? `${productCount} product-related` : null,
    uniqueSources.length > 1 ? `from ${uniqueSources.join(' and ')} search` : null
  ].filter(Boolean);
  
  return summaryParts.join(', ');
}

/**
 * Format chunks for inclusion in chat prompt
 */
export function formatChunksForPrompt(chunks: ContextChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant information found.';
  }
  
  // Group chunks by similarity tier (adjusted thresholds for better recall)
  const highConfidence = chunks.filter(c => c.similarity > 0.75);
  const mediumConfidence = chunks.filter(c => c.similarity > 0.55 && c.similarity <= 0.75);
  const lowConfidence = chunks.filter(c => c.similarity <= 0.55);
  
  let formatted = '';
  
  if (highConfidence.length > 0) {
    formatted += '## Highly Relevant Information:\n\n';
    formatted += highConfidence.map((c, i) => 
      `### Source ${i + 1}: ${c.title || 'Product Information'} (${(c.similarity * 100).toFixed(0)}% match)\n${c.content}\nURL: ${c.url}\n`
    ).join('\n---\n\n');
  }
  
  if (mediumConfidence.length > 0) {
    formatted += '\n\n## Additional Context:\n\n';
    formatted += mediumConfidence.map((c, i) => 
      `### Source ${highConfidence.length + i + 1}: ${c.title || 'Related Information'}\n${c.content.substring(0, 500)}...\n`
    ).join('\n---\n\n');
  }
  
  if (lowConfidence.length > 0 && chunks.length < 5) {
    formatted += '\n\n## Potentially Related:\n\n';
    formatted += lowConfidence.map(c => 
      `- ${c.title}: ${c.content.substring(0, 200)}...\n`
    ).join('');
  }
  
  return formatted;
}

/**
 * Analyze query to determine optimal context strategy
 */
export function analyzeQueryIntent(query: string): {
  needsProductContext: boolean;
  needsTechnicalContext: boolean;
  needsGeneralContext: boolean;
  suggestedChunks: number;
} {
  const queryLower = query.toLowerCase();
  
  // Check for product-specific queries
  const productPatterns = [
    /\b(sku|part|product|item|model)\s*[:#]?\s*[A-Z0-9]+/i,
    /\b(price|cost|how much|expensive)\b/i,
    /\b(in stock|available|availability)\b/i,
    /\b(buy|purchase|order)\b/i
  ];
  const needsProductContext = productPatterns.some(p => p.test(queryLower));
  
  // Check for technical queries
  const technicalPatterns = [
    /\b(specification|spec|dimension|weight|capacity|size)\b/i,
    /\b(compatible|fit|work with|suitable)\b/i,
    /\b(install|setup|configure|how to)\b/i,
    /\b(material|construction|feature)\b/i
  ];
  const needsTechnicalContext = technicalPatterns.some(p => p.test(queryLower));
  
  // Everything else is general
  const needsGeneralContext = !needsProductContext && !needsTechnicalContext;
  
  // Suggest more chunks for complex queries
  let suggestedChunks = 15;  // Base amount (increased from 8)
  if (needsTechnicalContext) suggestedChunks = 20;  // More for technical (increased from 12)
  if (queryLower.includes('compare') || queryLower.includes('difference')) suggestedChunks = 25;  // Maximum for comparisons (increased from 15)
  
  return {
    needsProductContext,
    needsTechnicalContext,
    needsGeneralContext,
    suggestedChunks
  };
}