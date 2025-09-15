/**
 * Wrapper for search functionality with enhanced metadata support
 * Provides fallback to regular search if enhanced search isn't available
 */

import { searchSimilarContent } from './embeddings';
import { QueryEnhancerOptimized as QueryEnhancer } from './query-enhancer-optimized';

// Type definitions
interface SearchResult {
  content: string;
  url: string;
  title: string;
  similarity: number;
  metadata?: any;
}

interface SearchOptions {
  contentTypes?: string[];
  boostRecent?: boolean;
  mustHaveKeywords?: string[];
  priceRange?: { min: number; max: number };
}

/**
 * Smart search function that uses enhanced search when available
 * Falls back to regular search if enhanced metadata isn't ready
 */
export async function smartSearch(
  query: string,
  domain: string,
  limit: number = 5,
  threshold: number = 0.7,
  options?: SearchOptions
): Promise<SearchResult[]> {
  try {
    // Enhance the query first
    const enhancedQuery = await QueryEnhancer.enhance(query);
    console.log('[SmartSearch] Query enhanced:', {
      original: query,
      intent: enhancedQuery.intent,
      expanded_terms: enhancedQuery.expanded_terms.slice(0, 5),
      synonyms: Array.from(enhancedQuery.synonyms.keys()),
      entities: enhancedQuery.entities,
      confidence: enhancedQuery.confidence_score
    });
    
    // Check if we have the enhanced search function available
    const hasEnhancedSearch = await checkEnhancedSearchAvailable();
    
    if (hasEnhancedSearch) {
      // Try to use enhanced search if we have options that benefit from it
      const { searchEnhancedContent } = await import('./embeddings-enhanced').catch(() => ({ searchEnhancedContent: null }));
      
      if (searchEnhancedContent) {
        console.log('[SmartSearch] Using enhanced search with metadata filtering');
        
        // Detect content type from enhanced query
        const detectedTypes = detectContentTypes(query);
        const contentTypes = options?.contentTypes || detectedTypes;
        
        // Apply query enhancement to search - create config from enhanced query
        const searchConfig = {
          searchTerms: [
            enhancedQuery.normalized,
            ...enhancedQuery.expanded_terms.slice(0, 5),
            ...Array.from(enhancedQuery.synonyms.values()).flat().slice(0, 5)
          ],
          boostFields: {},
          filters: {}
        };
        
        // Combine extracted keywords with enhanced terms
        const queryKeywords = [
          ...enhancedQuery.entities.skus,
          ...enhancedQuery.entities.brands,
          ...enhancedQuery.entities.products,
          ...searchConfig.searchTerms.slice(0, 5)
        ].filter(Boolean);
        
        // Use the normalized query for better embedding match
        const searchQuery = enhancedQuery.normalized;
        
        const results = await searchEnhancedContent(searchQuery, domain, {
          limit,
          similarityThreshold: threshold,
          contentTypes: contentTypes.length > 0 ? contentTypes : undefined,
          boostRecent: options?.boostRecent || (enhancedQuery.intent === 'transactional'),
          mustHaveKeywords: queryKeywords.length > 0 ? queryKeywords : options?.mustHaveKeywords,
          priceRange: options?.priceRange || extractPriceRange(query) || undefined
        });
        
        if (results && results.length > 0) {
          console.log(`[SmartSearch] Enhanced search returned ${results.length} results`);
          return results;
        }
      }
    }
    
    // Fall back to regular search with enhanced query
    console.log('[SmartSearch] Using regular embedding search with enhanced query');
    // Use the enhanced normalized query for better matching
    const searchQuery = enhancedQuery?.normalized || query;
    return await searchSimilarContent(searchQuery, domain, limit, threshold);
    
  } catch (error) {
    console.error('[SmartSearch] Error in smart search, falling back to regular:', error);
    // Always fall back to regular search on error
    return await searchSimilarContent(query, domain, limit, threshold);
  }
}

/**
 * Check if enhanced search is available
 */
async function checkEnhancedSearchAvailable(): Promise<boolean> {
  try {
    // Check if the enhanced module exists
    await import('./embeddings-enhanced');
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect content types from query
 */
function detectContentTypes(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const types: string[] = [];
  
  // Product queries
  if (
    /price|cost|buy|purchase|product|item|sku|model|part/i.test(lowerQuery) ||
    /\$\d+|\£\d+|€\d+/i.test(lowerQuery) ||
    /cheap|expensive|affordable|discount/i.test(lowerQuery)
  ) {
    types.push('product');
  }
  
  // FAQ queries
  if (
    /how|what|why|when|where|who|can i|do you|is it|are there/i.test(lowerQuery) ||
    /\?/.test(query)
  ) {
    types.push('faq');
  }
  
  // Documentation queries
  if (
    /guide|manual|instruction|install|setup|configure|documentation/i.test(lowerQuery) ||
    /step by step|tutorial|procedure/i.test(lowerQuery)
  ) {
    types.push('documentation');
  }
  
  // Support queries
  if (
    /help|support|contact|issue|problem|error|broken|fix/i.test(lowerQuery) ||
    /warranty|return|refund|exchange/i.test(lowerQuery)
  ) {
    types.push('support');
  }
  
  // Blog/news queries
  if (
    /blog|article|news|update|announcement|latest/i.test(lowerQuery)
  ) {
    types.push('blog');
  }
  
  // If no specific type detected, return general
  if (types.length === 0) {
    types.push('general');
  }
  
  return types;
}

/**
 * Extract keywords from query for enhanced filtering
 */
export function extractQueryKeywords(query: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for',
    'with', 'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'it', 'this', 'that', 'what', 'which', 'who', 'when', 'where', 'how',
    'why', 'can', 'do', 'does', 'did', 'will', 'would', 'should', 'could'
  ]);
  
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word))
    .slice(0, 10);
}

/**
 * Detect if query is asking about price
 */
export function isPriceQuery(query: string): boolean {
  return /price|cost|how much|expensive|cheap|afford|\$|£|€/i.test(query);
}

/**
 * Extract price range from query if present
 */
export function extractPriceRange(query: string): { min: number; max: number } | null {
  // Look for explicit price ranges
  const rangeMatch = query.match(/(?:between\s+)?[\$£€]?\s*(\d+(?:\.\d{2})?)\s*(?:to|-)\s*[\$£€]?\s*(\d+(?:\.\d{2})?)/i);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2])
    };
  }
  
  // Look for "under X" pattern
  const underMatch = query.match(/under\s+[\$£€]?\s*(\d+(?:\.\d{2})?)/i);
  if (underMatch && underMatch[1]) {
    return {
      min: 0,
      max: parseFloat(underMatch[1])
    };
  }
  
  // Look for "over X" pattern
  const overMatch = query.match(/over\s+[\$£€]?\s*(\d+(?:\.\d{2})?)/i);
  if (overMatch && overMatch[1]) {
    return {
      min: parseFloat(overMatch[1]),
      max: 999999
    };
  }
  
  return null;
}