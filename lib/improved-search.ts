/**
 * Improved Search Implementation
 * This module contains the optimized search logic with better accuracy
 * based on testing and analysis of current limitations.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { generateQueryEmbedding } from './embeddings';

// IMPROVED CONFIGURATION BASED ON TESTING
const IMPROVED_CONFIG = {
  // Lower similarity thresholds for better recall
  similarityThreshold: {
    default: 0.45,        // Down from 0.7
    products: 0.4,        // Even lower for products to catch all specs
    support: 0.5,         // Moderate for support content
    policy: 0.55          // Slightly higher for policies
  },
  
  // Increased chunk limits for complete context
  chunkLimits: {
    default: 20,          // Up from 10-15
    products: 25,         // Maximum for products
    support: 15,          // Good amount for support
    minimal: 8            // Minimum viable context
  },
  
  // Content-aware truncation lengths
  truncationLengths: {
    product: 2000,        // Full specs and descriptions
    support: 1500,        // Complete instructions
    policy: 1000,         // Full policy sections
    blog: 1200,           // Good blog content
    default: 800          // Standard content
  }
};

/**
 * Detect the type of query to optimize search parameters
 */
export function detectQueryType(query: string): 'product' | 'support' | 'policy' | 'general' {
  const queryLower = query.toLowerCase();
  
  // Product queries - need maximum context
  const productPatterns = [
    /\b(sku|part|product|item|model)\s*[:#]?\s*[A-Z0-9]+/i,
    /\b(specification|spec|dimension|capacity)\b/i,
    /\b(price|cost|buy|purchase)\b/i,
    /\b(hydraulic|pump|valve|motor|kit)\b/i,
    /\bdc\d{2}-\d+[a-z]?\b/i  // Part numbers like DC66-10P
  ];
  
  if (productPatterns.some(p => p.test(queryLower))) {
    return 'product';
  }
  
  // Support queries - need detailed instructions
  const supportPatterns = [
    /\b(how to|install|setup|configure|troubleshoot)\b/i,
    /\b(problem|issue|not working|error|fix)\b/i,
    /\b(guide|tutorial|instructions|steps)\b/i
  ];
  
  if (supportPatterns.some(p => p.test(queryLower))) {
    return 'support';
  }
  
  // Policy queries - need specific sections
  const policyPatterns = [
    /\b(policy|terms|conditions|warranty|return|refund)\b/i,
    /\b(shipping|delivery|privacy|guarantee)\b/i
  ];
  
  if (policyPatterns.some(p => p.test(queryLower))) {
    return 'policy';
  }
  
  return 'general';
}

/**
 * Get optimized search parameters based on query type
 */
export function getOptimizedSearchParams(queryType: 'product' | 'support' | 'policy' | 'general') {
  return {
    similarityThreshold: IMPROVED_CONFIG.similarityThreshold[queryType === 'general' ? 'default' : queryType === 'product' ? 'products' : queryType] || IMPROVED_CONFIG.similarityThreshold.default,
    chunkLimit: IMPROVED_CONFIG.chunkLimits[queryType === 'product' ? 'products' : 
                queryType === 'support' ? 'support' : 'default'],
    truncationLength: IMPROVED_CONFIG.truncationLengths[queryType === 'general' ? 'default' : queryType === 'policy' ? 'default' : queryType] || IMPROVED_CONFIG.truncationLengths.default
  };
}

/**
 * Enhanced search function with all improvements
 */
export async function searchWithImprovements(
  query: string,
  domain: string,
  options: {
    forceQueryType?: 'product' | 'support' | 'policy' | 'general';
    includeAllProductChunks?: boolean;
    enableQueryExpansion?: boolean;
  } = {}
): Promise<Array<{
  content: string;
  url: string;
  title: string;
  similarity: number;
  enhanced?: boolean;
}>> {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('[Improved Search] No database connection');
    return [];
  }
  
  try {
    // 1. Detect query type for optimization
    const queryType = options.forceQueryType || detectQueryType(query);
    console.log(`[Improved Search] Query type detected: ${queryType}`);
    
    // 2. Get optimized parameters
    const params = getOptimizedSearchParams(queryType);
    console.log(`[Improved Search] Using params:`, params);
    
    // 3. Get domain_id
    const searchDomain = domain.replace('www.', '');
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', searchDomain)
      .single();
    
    if (!domainData) {
      console.warn(`[Improved Search] Domain not found: ${searchDomain}`);
      return [];
    }
    
    // 4. Generate embedding with query expansion if enabled
    let processedQuery = query;
    if (options.enableQueryExpansion) {
      // Add context markers for better matching
      if (queryType === 'product') {
        processedQuery = `product specifications details ${query}`;
      } else if (queryType === 'support') {
        processedQuery = `help guide instructions ${query}`;
      }
    }
    
    const queryEmbedding = await generateQueryEmbedding(processedQuery, true, domain);
    
    // 5. Search with improved parameters
    const { data: embeddings, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainData.id,
      match_threshold: params.similarityThreshold,
      match_count: params.chunkLimit
    });
    
    if (error) {
      console.error('[Improved Search] RPC error:', error);
      return [];
    }
    
    if (!embeddings || embeddings.length === 0) {
      console.log('[Improved Search] No results found');
      return [];
    }
    
    // 6. Process results
    let results = embeddings.map((r: any) => ({
      content: r.content || r.chunk_text || '',
      url: r.url || r.metadata?.url || '',
      title: r.title || r.metadata?.title || 'Untitled',
      similarity: r.similarity || 0,
      enhanced: false
    }));
    
    // 7. CRITICAL ENHANCEMENT: Fetch ALL chunks for product pages
    if ((queryType === 'product' || options.includeAllProductChunks) && results.length > 0) {
      const productUrls = results
        .filter((r: any) => r.url.includes('/product/'))
        .map((r: any) => r.url);
      
      console.log(`[Improved Search] Enhancing ${productUrls.length} product pages...`);
      
      for (const productUrl of productUrls) {
        try {
          // Get page_id
          const { data: pageData } = await supabase
            .from('scraped_pages')
            .select('id, content')
            .eq('url', productUrl)
            .single();
          
          if (pageData) {
            // Option 1: Use full page content if available
            if (pageData.content && pageData.content.length > 100) {
              const index = results.findIndex(r => r.url === productUrl);
              if (index >= 0) {
                results[index].content = pageData.content;
                results[index].enhanced = true;
                console.log(`[Improved Search] Enhanced ${productUrl} with full page content`);
              }
            } else if (pageData.id) {
              // Option 2: Combine all embedding chunks
              const { data: allChunks } = await supabase
                .from('page_embeddings')
                .select('chunk_text, metadata')
                .eq('page_id', pageData.id)
                .order('metadata->chunk_index', { ascending: true });
              
              if (allChunks && allChunks.length > 0) {
                const combinedContent = combineProductChunks(allChunks);
                const index = results.findIndex((r: any) => r.url === productUrl);
                if (index >= 0) {
                  results[index].content = combinedContent;
                  results[index].enhanced = true;
                  console.log(`[Improved Search] Enhanced ${productUrl} with ${allChunks.length} chunks`);
                }
              }
            }
          }
        } catch (error) {
          console.error(`[Improved Search] Error enhancing ${productUrl}:`, error);
        }
      }
    }
    
    // 8. Apply smart truncation based on content type
    results = applySmartTruncation(results, params.truncationLength);
    
    // 9. Re-rank results based on query type priorities
    results = rerankResults(results, queryType);
    
    return results;
    
  } catch (error) {
    console.error('[Improved Search] Error:', error);
    return [];
  }
}

/**
 * Intelligently combine product chunks prioritizing important information
 */
function combineProductChunks(chunks: any[]): string {
  const sections = {
    sku: '',
    description: '',
    specifications: '',
    price: '',
    features: '',
    other: ''
  };
  
  // Categorize chunks
  for (const chunk of chunks) {
    const text = chunk.chunk_text || '';
    const textLower = text.toLowerCase();
    
    // Prioritize complete product information
    if (textLower.includes('sku:') && textLower.includes('description')) {
      sections.description = text + '\n' + sections.description;
    } else if (textLower.includes('sku:') || textLower.includes('part number')) {
      sections.sku += text + '\n';
    } else if (textLower.includes('specification') || 
               textLower.includes('cm3/rev') || 
               textLower.includes('bar') || 
               textLower.includes('iso')) {
      sections.specifications += text + '\n';
    } else if (textLower.includes('£') || textLower.includes('price')) {
      sections.price += text + '\n';
    } else if (textLower.includes('feature') || textLower.includes('include')) {
      sections.features += text + '\n';
    } else {
      sections.other += text.substring(0, 200) + '\n';
    }
  }
  
  // Combine in priority order
  let combined = '';
  if (sections.sku) combined += sections.sku;
  if (sections.description) combined += '\n' + sections.description;
  if (sections.specifications) combined += '\n' + sections.specifications;
  if (sections.price) combined += '\n' + sections.price;
  if (sections.features) combined += '\n' + sections.features;
  if (sections.other && combined.length < 3000) {
    combined += '\n' + sections.other;
  }
  
  return combined.trim();
}

/**
 * Apply smart truncation that preserves important content
 */
function applySmartTruncation(
  results: any[],
  baseLength: number
): any[] {
  return results.map(result => {
    const url = result.url.toLowerCase();
    let maxLength = baseLength;
    
    // Determine content type from URL
    if (url.includes('/product/')) {
      maxLength = IMPROVED_CONFIG.truncationLengths.product;
    } else if (url.includes('/support/') || url.includes('/help/') || url.includes('/guide/')) {
      maxLength = IMPROVED_CONFIG.truncationLengths.support;
    } else if (url.includes('/policy/') || url.includes('/terms/')) {
      maxLength = IMPROVED_CONFIG.truncationLengths.policy;
    } else if (url.includes('/blog/') || url.includes('/news/')) {
      maxLength = IMPROVED_CONFIG.truncationLengths.blog;
    }
    
    // Smart truncation: try to break at sentence boundaries
    if (result.content.length > maxLength) {
      let truncated = result.content.substring(0, maxLength);
      
      // Try to find last complete sentence
      const lastPeriod = truncated.lastIndexOf('.');
      const lastExclamation = truncated.lastIndexOf('!');
      const lastQuestion = truncated.lastIndexOf('?');
      
      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      if (lastSentenceEnd > maxLength * 0.8) {
        truncated = truncated.substring(0, lastSentenceEnd + 1);
      }
      
      result.content = truncated;
    }
    
    return result;
  });
}

/**
 * Re-rank results based on query type priorities
 */
function rerankResults(
  results: any[],
  queryType: 'product' | 'support' | 'policy' | 'general'
): any[] {
  return results.map(result => {
    let boost = 1.0;
    const url = result.url.toLowerCase();
    const content = result.content.toLowerCase();
    
    if (queryType === 'product') {
      // Boost product pages
      if (url.includes('/product/')) boost *= 1.3;
      if (content.includes('sku:')) boost *= 1.2;
      if (content.includes('price')) boost *= 1.1;
      if (result.enhanced) boost *= 1.2; // Boost enhanced results
    } else if (queryType === 'support') {
      // Boost support content
      if (url.includes('/support/') || url.includes('/help/')) boost *= 1.3;
      if (content.includes('step') || content.includes('how to')) boost *= 1.2;
    } else if (queryType === 'policy') {
      // Boost policy pages
      if (url.includes('/policy/') || url.includes('/terms/')) boost *= 1.3;
      if (content.includes('policy') || content.includes('terms')) boost *= 1.2;
    }
    
    // Apply boost to similarity
    result.adjustedSimilarity = Math.min(result.similarity * boost, 1.0);
    return result;
  }).sort((a, b) => b.adjustedSimilarity - a.adjustedSimilarity);
}

/**
 * Get search quality metrics for monitoring
 */
export function getSearchQualityMetrics(results: any[]): {
  totalResults: number;
  enhancedResults: number;
  avgSimilarity: number;
  avgContentLength: number;
  hasHighConfidence: boolean;
  coverageScore: number;
} {
  const enhancedCount = results.filter(r => r.enhanced).length;
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / Math.max(results.length, 1);
  const avgContentLength = results.reduce((sum, r) => sum + r.content.length, 0) / Math.max(results.length, 1);
  const hasHighConfidence = results.some(r => r.similarity > 0.85);
  
  // Coverage score: combination of result count and quality
  const coverageScore = Math.min(
    (results.length / 10) * 0.3 +  // Quantity factor
    avgSimilarity * 0.4 +           // Quality factor
    (enhancedCount / Math.max(results.length, 1)) * 0.3, // Enhancement factor
    1.0
  );
  
  return {
    totalResults: results.length,
    enhancedResults: enhancedCount,
    avgSimilarity,
    avgContentLength,
    hasHighConfidence,
    coverageScore
  };
}

/**
 * Export configuration for direct use
 */
export { IMPROVED_CONFIG };