/**
 * Chat Context Enhancer - Main Orchestrator
 * Improves chat accuracy by providing more relevant context to the AI
 *
 * Refactored into modular components for maintainability
 */

import { synonymExpander } from './synonym-expander-dynamic';
import { QueryReformulator } from './query-reformulator';
import { queryInterpreter } from './ai-query-interpreter';

// Import types
import {
  ContextChunk,
  EnhancedContext,
  EnhancementOptions
} from './chat-context-enhancer-types';

// Import search strategies
import {
  executeHybridSearch,
  executeEmbeddingSearch,
  executeSmartSearch,
  getBusinessClassification
} from './chat-context-enhancer-search-strategies';

// Import product extraction strategies
import {
  extractProductsFromScrapedPages,
  extractProductsFromStructuredData,
  extractProductsFromWebsiteContent,
  extractEntitiesFromCatalog
} from './chat-context-enhancer-product-extraction';

// Import builders
import {
  deduplicateChunks,
  generateContextSummary
} from './chat-context-enhancer-builders';

/**
 * Get enhanced context for chat queries with increased chunk window
 */
export async function getEnhancedChatContext(
  message: string,
  domain: string,
  domainId: string,
  options: EnhancementOptions = {}
): Promise<EnhancedContext> {
  const {
    enableSmartSearch = true,
    minChunks = 20,
    maxChunks = 25,
    conversationHistory = []
  } = options;

  console.log(`[Context Enhancer] Getting enhanced context for: "${message.substring(0, 50)}..."`);

  // Step 1: Let AI interpret what the user ACTUALLY wants to search for
  const interpreted = await queryInterpreter.interpretQuery(message, conversationHistory);

  // If AI says no search needed (greeting, etc), return empty
  if (!queryInterpreter.needsProductSearch(interpreted.intent)) {
    console.log(`[Context Enhancer] AI determined no product search needed for intent: ${interpreted.intent}`);
    return {
      chunks: [],
      totalChunks: 0,
      averageSimilarity: 0,
      hasHighConfidence: false
    };
  }

  // Use the AI's corrected/interpreted search terms
  const searchQuery = interpreted.searchTerms.join(' ') || message;

  if (searchQuery !== message) {
    console.log(`[Context Enhancer] AI interpreted query:`);
    console.log(`  Original: "${message}"`);
    console.log(`  Search for: "${searchQuery}"`);
    console.log(`  Intent: ${interpreted.intent}`);
    console.log(`  Confidence: ${(interpreted.confidence * 100).toFixed(0)}%`);
  }

  // Step 2: Apply domain-specific synonym expansion
  const expandedQuery = await synonymExpander.expandQuery(searchQuery, domainId, 3);
  const hasExpansion = expandedQuery !== searchQuery.toLowerCase().split(/\s+/).join(' ');

  if (hasExpansion) {
    console.log(`[Context Enhancer] Expanded query: "${expandedQuery.substring(0, 100)}..."`);
  }

  try {
    const allChunks: ContextChunk[] = [];

    // Execute hybrid search first
    const hybridChunks = await executeHybridSearch(
      searchQuery,
      expandedQuery,
      hasExpansion,
      domainId,
      maxChunks
    );
    allChunks.push(...hybridChunks);

    // Get business classification for terminology
    const classification = await getBusinessClassification(domainId);

    // Extract products from various sources
    const scrapedProductChunks = await extractProductsFromScrapedPages(searchQuery, domainId);
    allChunks.push(...scrapedProductChunks);

    const structuredProductChunks = await extractProductsFromStructuredData(searchQuery, domainId);
    allChunks.push(...structuredProductChunks);

    const websiteContentChunks = await extractProductsFromWebsiteContent(searchQuery, domainId);
    allChunks.push(...websiteContentChunks);

    // Extract entities from catalog
    const entityChunks = await extractEntitiesFromCatalog(searchQuery, domainId, classification);
    allChunks.push(...entityChunks);

    // Fallback to embedding search if needed
    if (allChunks.length < minChunks) {
      const embeddingChunks = await executeEmbeddingSearch(
        hasExpansion ? expandedQuery : searchQuery,
        domain,
        minChunks - allChunks.length
      );
      allChunks.push(...embeddingChunks);
    }

    // Smart search fallback
    if (enableSmartSearch && allChunks.length < minChunks) {
      const smartChunks = await executeSmartSearch(
        hasExpansion ? expandedQuery : searchQuery,
        domain,
        minChunks - allChunks.length
      );
      allChunks.push(...smartChunks);
    }

    // Deduplicate and sort
    const uniqueChunks = deduplicateChunks(allChunks);
    const sortedChunks = uniqueChunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxChunks);

    // Calculate metrics
    const avgSimilarity = sortedChunks.length > 0
      ? sortedChunks.reduce((sum, c) => sum + c.similarity, 0) / sortedChunks.length
      : 0;

    const hasHighConfidence = sortedChunks.some(c => c.similarity > 0.85);

    // Generate context summary
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
      contextSummary,
      reformulatedQuery: searchQuery,
      queryStrategy: interpreted.intent
    };

  } catch (error) {
    console.error('[Context Enhancer] Error getting enhanced context:', error);

    return {
      chunks: [],
      totalChunks: 0,
      averageSimilarity: 0,
      hasHighConfidence: false
    };
  }
}

// Re-export all types and utilities for backwards compatibility
export * from './chat-context-enhancer-types';
export * from './chat-context-enhancer-builders';
export * from './chat-context-enhancer-search-strategies';
export * from './chat-context-enhancer-product-extraction';

// Export alias for backward compatibility
export { getEnhancedChatContext as getEnhancedContext };
