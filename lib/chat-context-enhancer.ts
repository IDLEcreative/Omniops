/**
 * Chat Context Enhancer
 * Improves chat accuracy by providing more relevant context to the AI
 */

import { searchSimilarContentEnhanced } from './enhanced-embeddings';
import { smartSearch } from './search-wrapper';
import { synonymExpander } from './synonym-expander-dynamic';
import { QueryReformulator } from './query-reformulator';
import { queryInterpreter } from './ai-query-interpreter';
import { createClient } from '@supabase/supabase-js';

interface ContextChunk {
  content: string;
  url: string;
  title: string;
  similarity: number;
  source?: 'embedding' | 'smart' | 'fallback' | 'hybrid' | 'product';
  metadata?: any;
}

interface EnhancedContext {
  chunks: ContextChunk[];
  totalChunks: number;
  averageSimilarity: number;
  hasHighConfidence: boolean;
  contextSummary?: string;
  reformulatedQuery?: string;
  queryStrategy?: string;
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
    conversationHistory?: Array<{ role: string; content: string }>;
  } = {}
): Promise<EnhancedContext> {
  const {
    enableSmartSearch = true,
    minChunks = 20,  // Increased from 10 to 20 for better recall
    maxChunks = 25,   // Maximum chunks to retrieve (increased from 15)
    conversationHistory = []
  } = options;

  console.log(`[Context Enhancer] Getting enhanced context for: "${message.substring(0, 50)}..."`);
  
  // Step 1: Let AI interpret what the user ACTUALLY wants to search for
  // This handles typos, context, and intent understanding
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
  
  // Step 2: Apply domain-specific synonym expansion to the AI-interpreted query
  const expandedQuery = await synonymExpander.expandQuery(searchQuery, domainId, 3);
  const hasExpansion = expandedQuery !== searchQuery.toLowerCase().split(/\s+/).join(' ');
  
  if (hasExpansion) {
    console.log(`[Context Enhancer] Expanded query: "${expandedQuery.substring(0, 100)}..."`);
  }
  
  const allChunks: ContextChunk[] = [];
  
  // Initialize Supabase client for hybrid search
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // NEW: Try hybrid search first (combines fulltext, fuzzy, metadata, and vector)
    console.log(`[Context Enhancer] Trying hybrid search for maximum accuracy...`);
    
    const { data: hybridResults, error: hybridError } = await supabase.rpc(
      'hybrid_product_search',
      {
        p_query: hasExpansion ? expandedQuery : searchQuery,
        p_domain_id: domainId,
        p_limit: maxChunks,
        p_enable_fuzzy: true,
        p_vector_embedding: null // Will be added when we have embedding
      }
    );
    
    if (!hybridError && hybridResults && hybridResults.length > 0) {
      console.log(`[Context Enhancer] Hybrid search found ${hybridResults.length} results`);
      
      // Add hybrid results with high priority
      allChunks.push(...hybridResults.map((r: any) => ({
        content: r.content || '',
        url: r.url || '',
        title: r.title || '',
        similarity: r.score || 0.8, // Use score from hybrid search
        source: 'hybrid' as const,
        metadata: r.metadata
      })));
    }
    
    // Get business classification for proper terminology
    const { data: classification } = await supabase
      .from('business_classifications')
      .select('business_type, entity_terminology')
      .eq('domain_id', domainId)
      .single();
    
    const terminology = classification?.entity_terminology || {
      entity: 'item',
      plural: 'items',
      priceLabel: 'price'
    };
    
    // First check scraped_pages metadata for product information
    // Build search conditions using individual search terms for better recall
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    // Build OR conditions for each significant term
    let searchConditions = [];
    
    // Add full query search
    searchConditions.push(`title.ilike.%${searchQuery}%`);
    searchConditions.push(`content.ilike.%${searchQuery}%`);
    
    // Add individual term searches for broader matching
    for (const term of searchTerms) {
      searchConditions.push(`title.ilike.%${term}%`);
      searchConditions.push(`url.ilike.%${term}%`);
    }
    
    const { data: productPages, error: productPagesError } = await supabase
      .from('scraped_pages')
      .select('url, title, content, metadata')
      .eq('domain_id', domainId)
      .or(searchConditions.join(','))
      .limit(30); // Get more results for better coverage
    
    if (!productPagesError && productPages && productPages.length > 0) {
      console.log(`[Context Enhancer] Checking ${productPages.length} scraped pages for product data...`);
      
      for (const page of productPages) {
        // Check if metadata contains ecommerce data with products
        if (page.metadata?.ecommerceData?.products && Array.isArray(page.metadata.ecommerceData.products)) {
          for (const product of page.metadata.ecommerceData.products) {
            // Check if product matches search query
            const productName = product.name || '';
            const productSku = product.sku || '';
            const productDesc = product.description || '';
            
            // Flexible matching - check if product contains any of the search terms
            let matchesQuery = false;
            
            // First try exact query match
            matchesQuery = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          productDesc.toLowerCase().includes(searchQuery.toLowerCase());
            
            // If no exact match, check if product contains multiple search terms
            if (!matchesQuery && searchTerms.length > 1) {
              // Count how many search terms match the product
              const matchingTerms = searchTerms.filter(term => 
                productName.toLowerCase().includes(term) ||
                productSku.toLowerCase().includes(term) ||
                productDesc.toLowerCase().includes(term)
              );
              
              // Include if at least 2 terms match, or if it's a significant term match
              matchesQuery = matchingTerms.length >= Math.min(2, Math.ceil(searchTerms.length / 2));
            }
            
            if (matchesQuery) {
              // Format product as content chunk with price
              let productContent = `Product: ${product.name}`;
              
              if (product.price) {
                if (typeof product.price === 'object' && product.price.formatted) {
                  productContent += `\nPrice: ${product.price.formatted}`;
                } else if (typeof product.price === 'object' && product.price.value) {
                  productContent += `\nPrice: £${product.price.value}`;
                } else if (typeof product.price === 'string') {
                  productContent += `\nPrice: ${product.price}`;
                } else if (typeof product.price === 'number') {
                  productContent += `\nPrice: £${product.price}`;
                }
              }
              
              if (product.sku) {
                productContent += `\nSKU: ${product.sku}`;
              }
              
              if (product.availability?.inStock !== undefined) {
                productContent += `\nAvailability: ${product.availability.inStock ? 'In Stock' : 'Out of Stock'}`;
              }
              
              if (product.description) {
                productContent += `\n${product.description}`;
              }
              
              allChunks.push({
                content: productContent,
                url: page.url || '',
                title: product.name || page.title || '',
                similarity: 0.95, // High score for direct product matches
                source: 'product' as const,
                metadata: product
              });
              
              console.log(`[Context Enhancer] Found product with price: ${product.name} - ${product.price?.formatted || product.price}`);
            }
          }
        }
      }
    }
    
    // Check structured_extractions table for product data
    const { data: structuredProducts, error: structuredError } = await supabase
      .from('structured_extractions')
      .select('url, extracted_data, confidence_score')
      .eq('domain_id', domainId)
      .eq('extract_type', 'product')
      .limit(20);
    
    if (!structuredError && structuredProducts && structuredProducts.length > 0) {
      console.log(`[Context Enhancer] Checking ${structuredProducts.length} structured product extractions...`);
      
      for (const extraction of structuredProducts) {
        const product = extraction.extracted_data as any;
        if (product) {
          // Check if product matches search query
          const productName = product.name || '';
          const productSku = product.sku || '';
          const matchesQuery = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              productSku.toLowerCase().includes(searchQuery.toLowerCase());
          
          if (matchesQuery) {
            // Format product as content chunk
            let productContent = `Product: ${product.name}`;
            
            if (product.price) {
              if (product.price.formatted) {
                productContent += `\nPrice: ${product.price.formatted}`;
              } else if (product.price.value) {
                productContent += `\nPrice: £${product.price.value}`;
              }
            }
            
            if (product.sku) {
              productContent += `\nSKU: ${product.sku}`;
            }
            
            allChunks.push({
              content: productContent,
              url: extraction.url || '',
              title: product.name || '',
              similarity: extraction.confidence_score || 0.9,
              source: 'product' as const,
              metadata: product
            });
            
            console.log(`[Context Enhancer] Found structured product: ${product.name} - ${product.price?.formatted}`);
          }
        }
      }
    }
    
    // Check website_content table for product data (alternative content storage)
    const { data: websiteContent, error: websiteContentError } = await supabase
      .from('website_content')
      .select('url, title, content, metadata')
      .eq('domain_id', domainId)
      .or(`url.ilike.%/product/%,title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .limit(10);
    
    if (!websiteContentError && websiteContent && websiteContent.length > 0) {
      console.log(`[Context Enhancer] Checking ${websiteContent.length} website_content entries...`);
      
      for (const page of websiteContent) {
        // Check if metadata contains product data (similar to scraped_pages)
        if (page.metadata?.ecommerceData?.products) {
          for (const product of page.metadata.ecommerceData.products) {
            const matchesQuery = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (matchesQuery) {
              let productContent = `Product: ${product.name}`;
              
              if (product.price) {
                if (typeof product.price === 'object' && product.price.formatted) {
                  productContent += `\nPrice: ${product.price.formatted}`;
                } else if (typeof product.price === 'object' && product.price.value) {
                  productContent += `\nPrice: £${product.price.value}`;
                } else {
                  productContent += `\nPrice: ${product.price}`;
                }
              }
              
              if (product.sku) {
                productContent += `\nSKU: ${product.sku}`;
              }
              
              allChunks.push({
                content: productContent,
                url: page.url || '',
                title: product.name || page.title || '',
                similarity: 0.9,
                source: 'product' as const,
                metadata: product
              });
              
              console.log(`[Context Enhancer] Found product in website_content: ${product.name}`);
            }
          }
        }
      }
    }
    
    // Check entity catalog for direct matches (works for any business type)
    const { data: entities, error: entityError } = await supabase
      .from('entity_catalog')
      .select('*')
      .eq('domain_id', domainId)
      .or(`name.ilike.%${searchQuery}%,primary_identifier.ilike.%${searchQuery}%,primary_category.ilike.%${searchQuery}%`)
      .limit(5);
    
    if (!entityError && entities && entities.length > 0) {
      console.log(`[Context Enhancer] Found ${entities.length} direct ${terminology.plural} matches`);
      
      // Format entities as context chunks based on business type
      for (const entity of entities) {
        let entityContent = `
${entity.entity_type}: ${entity.name}
${entity.primary_identifier ? `ID: ${entity.primary_identifier}` : ''}
${entity.price ? `${terminology.priceLabel || 'Price'}: $${entity.price}` : ''}
Category: ${entity.primary_category || 'General'}
Available: ${entity.is_available ? 'Yes' : 'No'}
${entity.description || ''}
        `.trim();
        
        // Add business-specific attributes
        if (entity.attributes) {
          if (classification?.business_type === 'real_estate' && entity.attributes.bedrooms) {
            entityContent += `\nBedrooms: ${entity.attributes.bedrooms}`;
            entityContent += `\nBathrooms: ${entity.attributes.bathrooms || 'N/A'}`;
            entityContent += `\nSquare Feet: ${entity.attributes.square_feet || 'N/A'}`;
          } else if (classification?.business_type === 'healthcare' && entity.attributes.provider_name) {
            entityContent += `\nProvider: ${entity.attributes.provider_name}`;
            entityContent += `\nSpecialty: ${entity.attributes.specialty || 'N/A'}`;
          } else if (entity.attributes.specifications) {
            entityContent += `\nDetails: ${JSON.stringify(entity.attributes.specifications)}`;
          }
        }
        
        allChunks.push({
          content: entityContent,
          url: '', // Entities may not have URLs
          title: entity.name,
          similarity: 0.95, // High score for direct matches
          source: 'product' as const, // Keep for compatibility
          metadata: entity
        });
      }
    }
    
    // Fallback to original embedding search if hybrid didn't find enough
    if (allChunks.length < minChunks) {
      console.log(`[Context Enhancer] Need more chunks, adding embedding search...`);
      
      // 1. Try enhanced embedding search (gets 20-25 chunks)
      const embeddingResults = await searchSimilarContentEnhanced(
        hasExpansion ? expandedQuery : searchQuery,
        domain,
        minChunks - allChunks.length,
        0.15  // Much lower threshold for maximum recall
      );
      
      if (embeddingResults && embeddingResults.length > 0) {
        console.log(`[Context Enhancer] Found ${embeddingResults.length} additional embedding chunks`);
        allChunks.push(...embeddingResults.map(r => ({
          ...r,
          source: 'embedding' as const
        })));
      }
    }
    
    // 2. If enabled and we need more chunks, try smart search
    if (enableSmartSearch && allChunks.length < minChunks) {
      console.log(`[Context Enhancer] Need more chunks, trying smart search...`);
      
      // Use expanded query for smart search as well, or AI-interpreted query
      const smartResults = await smartSearch(
        hasExpansion ? expandedQuery : searchQuery,  // Use AI-corrected query, not original message
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
      contextSummary,
      reformulatedQuery: searchQuery,
      queryStrategy: interpreted.intent
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
export function formatChunksForPrompt(chunks: ContextChunk[], includeConfidenceGuide: boolean = true, userQuery?: string): string {
  if (chunks.length === 0) {
    return 'No relevant information found.';
  }
  
  // If we have a user query, check if chunks are actually relevant
  if (userQuery) {
    const queryLower = userQuery.toLowerCase();
    
    // Extract meaningful words from the query (3+ characters, not common words)
    const stopWords = ['the', 'and', 'for', 'you', 'sell', 'have', 'show', 'what', 'which', 'any', 'some'];
    const queryWords = queryLower
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.includes(word));
    
    if (queryWords.length > 0) {
      // Check if chunks actually relate to the query terms
      const relevantChunks = chunks.filter(chunk => {
        const contentLower = (chunk.title + ' ' + chunk.content).toLowerCase();
        
        // Count how many query words appear in the content
        const matchCount = queryWords.filter(word => {
          // Handle potential typos by checking if content contains the word or similar
          return contentLower.includes(word) || 
                 // Check for partial matches (for typos)
                 queryWords.some(qw => {
                   const similarity = Math.min(word.length, qw.length) >= 4 && 
                                     contentLower.includes(qw.substring(0, 4));
                   return similarity;
                 });
        }).length;
        
        // If at least some query words match, or similarity is very high, keep it
        return matchCount > 0 || chunk.similarity > 0.85;
      });
      
      // If we found relevant chunks and they're significantly fewer, use them
      if (relevantChunks.length > 0 && relevantChunks.length < chunks.length * 0.9) {
        chunks = relevantChunks;
      }
    }
  }
  
  // Group chunks by similarity tier (adjusted thresholds for better recall)
  const highConfidence = chunks.filter(c => c.similarity > 0.75);
  const mediumConfidence = chunks.filter(c => c.similarity > 0.55 && c.similarity <= 0.75);
  const lowConfidence = chunks.filter(c => c.similarity <= 0.55);
  
  let formatted = '';
  
  // Add confidence guide for the AI
  if (includeConfidenceGuide) {
    formatted += '## CONFIDENCE GUIDE FOR RESPONSES:\n';
    formatted += '- HIGH confidence (>75%): Present these products/info directly and confidently\n';
    formatted += '- MEDIUM confidence (55-75%): Present with "These might be suitable" or "Based on what you described"\n';
    formatted += '- LOW confidence (<55%): Still present with "Here are some options that might work"\n';
    formatted += '⚠️ IMPORTANT: Even for vague queries, if products are found, PRESENT THEM!\n\n';
  }
  
  if (highConfidence.length > 0) {
    formatted += '## HIGH CONFIDENCE - Present these directly:\n\n';
    formatted += highConfidence.map((c, i) => 
      `### Product ${i + 1}: ${c.title || 'Product Information'} [${(c.similarity * 100).toFixed(0)}% match]\n${c.content}\nURL: ${c.url}\n`
    ).join('\n---\n\n');
  }
  
  if (mediumConfidence.length > 0) {
    formatted += '\n\n## MEDIUM CONFIDENCE - Present as suggestions:\n\n';
    formatted += mediumConfidence.map((c, i) => 
      `### Option ${highConfidence.length + i + 1}: ${c.title || 'Related Product'} [${(c.similarity * 100).toFixed(0)}% match]\n${c.content.substring(0, 500)}...\nURL: ${c.url}\n`
    ).join('\n---\n\n');
  }
  
  if (lowConfidence.length > 0 && chunks.length < 10) {
    formatted += '\n\n## LOW CONFIDENCE - Use only as context:\n\n';
    formatted += lowConfidence.map(c => 
      `- ${c.title}: ${c.content.substring(0, 200)}... [${(c.similarity * 100).toFixed(0)}%]\n`
    ).join('');
  }
  
  // Add summary and instructions
  formatted += '\n\n## SUMMARY:\n';
  formatted += `- Found ${highConfidence.length} highly relevant products\n`;
  formatted += `- Found ${mediumConfidence.length} possibly relevant products\n`;
  formatted += `- Total context items: ${chunks.length}\n`;
  
  // Special instructions for vague queries
  if (chunks.length > 0) {
    formatted += '\n## RESPONSE INSTRUCTIONS:\n';
    formatted += '1. If user query is vague (like "its for X"), show the TOP 3-5 products above\n';
    formatted += '2. Present products FIRST, then mention category for more options\n';
    formatted += '3. Never say "I don\'t see specific products" if products are listed above\n';
    formatted += '4. For continuation queries, use the reformulated query context\n';
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

// Export alias for backward compatibility
export { getEnhancedChatContext as getEnhancedContext };
