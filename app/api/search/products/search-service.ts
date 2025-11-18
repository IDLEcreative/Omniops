/**
 * Product search service with multiple search strategies
 */

import { DualEmbeddings } from '@/lib/dual-embeddings';
import { generateQueryEmbedding } from '@/lib/embeddings';

/**
 * Get domain ID from domain string
 */
async function getDomainId(supabase: any, domain: string | undefined): Promise<string | null> {
  if (!domain) return null;

  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain.replace('www.', ''))
    .single();

  return domainData?.id || null;
}

/**
 * Direct SQL search for SKU/part numbers
 * Fastest search method for exact matches
 */
export async function performSQLDirectSearch(
  supabase: any,
  classification: any,
  domain: string | undefined,
  limit: number
): Promise<any[]> {
  const sku = classification.sku;
  const skus = sku ? [sku] : [];

  if (!skus || skus.length === 0) {
    return [];
  }

  // Query the product catalog materialized view
  let query = supabase
    .from('product_catalog')
    .select('*');

  // Add SKU filter
  query = query.or(
    skus.map((sku: string) =>
      `sku.ilike.%${sku}%,product_name.ilike.%${sku}%`
    ).join(',')
  );

  // Add domain filter if specified
  const domainId = await getDomainId(supabase, domain);
  if (domainId) {
    query = query.eq('domain_id', domainId);
  }

  // Execute query
  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('[SQL Direct Search] Error:', error);
    return [];
  }

  // Format results
  return (data || []).map(formatProductResult);
}

/**
 * SQL pre-filtered vector search
 * Combines SQL filtering with vector similarity
 */
export async function performFilteredVectorSearch(
  supabase: any,
  query: string,
  classification: any,
  domain: string | undefined,
  filters: any,
  limit: number
): Promise<any[]> {
  // First, get candidate products via SQL filtering
  let sqlQuery = supabase
    .from('product_catalog')
    .select('page_id');

  // Apply price filters
  if (filters.maxPrice) {
    sqlQuery = sqlQuery.lte('price', filters.maxPrice);
  }
  if (filters.minPrice) {
    sqlQuery = sqlQuery.gte('price', filters.minPrice);
  }

  // Apply stock filter
  if (classification.availabilityIntent || filters.inStock) {
    sqlQuery = sqlQuery.eq('in_stock', true);
  }

  // Apply brand filter
  if (classification.brand || filters.brand) {
    sqlQuery = sqlQuery.ilike('brand', `%${classification.brand || filters.brand}%`);
  }

  // Apply domain filter
  const domainId = await getDomainId(supabase, domain);
  if (domainId) {
    sqlQuery = sqlQuery.eq('domain_id', domainId);
  }

  // Get candidate page IDs
  const { data: candidates, error: sqlError } = await sqlQuery.limit(limit * 3);

  if (sqlError || !candidates || candidates.length === 0) {
    return performDualVectorSearch(supabase, query, classification, domain, limit);
  }

  const pageIds = candidates.map((c: any) => c.page_id);

  // Now perform vector search on these candidates
  const dualEmbeddings = new DualEmbeddings(process.env.OPENAI_API_KEY!);
  const queryEmbeddings = await dualEmbeddings.generateQueryDualEmbeddings(query);

  // Search with dual embeddings
  const { data: searchResults, error: searchError } = await supabase.rpc(
    'search_embeddings_dual',
    {
      query_text_embedding: queryEmbeddings.textEmbedding,
      query_metadata_embedding: queryEmbeddings.metadataEmbedding,
      text_weight: 0.3,
      metadata_weight: 0.7,
      match_threshold: 0.5,
      match_count: limit
    }
  );

  if (searchError) {
    console.error('[Filtered Search] Vector search error:', searchError);
    return [];
  }

  // Filter to only include pre-filtered candidates
  const filteredResults = (searchResults || [])
    .filter((r: any) => pageIds.includes(r.page_id))
    .map(formatSearchResult);

  return filteredResults;
}

/**
 * Dual embedding vector search
 * Uses both text and metadata embeddings with weighted scoring
 */
export async function performDualVectorSearch(
  supabase: any,
  query: string,
  classification: any,
  domain: string | undefined,
  limit: number
): Promise<any[]> {
  // Generate dual embeddings for the query
  const dualEmbeddings = new DualEmbeddings(process.env.OPENAI_API_KEY!);
  const queryEmbeddings = await dualEmbeddings.generateQueryDualEmbeddings(query);

  // Get domain ID if specified
  const domainId = await getDomainId(supabase, domain);

  // Perform dual embedding search
  const { data, error } = await supabase.rpc(
    'search_embeddings_dual',
    {
      query_text_embedding: queryEmbeddings.textEmbedding,
      query_metadata_embedding: queryEmbeddings.metadataEmbedding,
      p_domain_id: domainId,
      text_weight: queryEmbeddings.suggestedWeights.text,
      metadata_weight: queryEmbeddings.suggestedWeights.metadata,
      match_threshold: 0.6,
      match_count: limit
    }
  );

  if (error) {
    console.error('[Dual Vector Search] Error:', error);
    return performStandardVectorSearch(supabase, query, domain, limit);
  }

  return (data || []).map(formatSearchResult);
}

/**
 * Text-focused vector search for support queries
 */
export async function performTextVectorSearch(
  supabase: any,
  query: string,
  domain: string | undefined,
  limit: number
): Promise<any[]> {
  // Generate standard text embedding
  const embedding = await generateQueryEmbedding(query, false);

  // Get domain ID
  const domainId = await getDomainId(supabase, domain);

  // Search using text embeddings primarily
  const { data, error } = await supabase.rpc(
    'search_embeddings',
    {
      query_embedding: embedding,
      p_domain_id: domainId,
      match_threshold: 0.7,
      match_count: limit
    }
  );

  if (error) {
    console.error('[Text Vector Search] Error:', error);
    return [];
  }

  return (data || []).map(formatSearchResult);
}

/**
 * Standard vector search fallback
 */
export async function performStandardVectorSearch(
  supabase: any,
  query: string,
  domain: string | undefined,
  limit: number
): Promise<any[]> {
  // Generate enriched query embedding
  const embedding = await generateQueryEmbedding(query, true);

  // Get domain ID
  const domainId = await getDomainId(supabase, domain);

  // Perform standard vector search
  const { data, error } = await supabase.rpc(
    'search_embeddings',
    {
      query_embedding: embedding,
      p_domain_id: domainId,
      match_threshold: 0.7,
      match_count: limit
    }
  );

  if (error) {
    console.error('[Standard Vector Search] Error:', error);
    return [];
  }

  return (data || []).map(formatSearchResult);
}

/**
 * Format product result from SQL query
 */
function formatProductResult(product: any) {
  return {
    id: product.page_id,
    url: product.url,
    title: product.title || product.product_name,
    sku: product.sku,
    price: product.price,
    inStock: product.in_stock,
    brand: product.brand,
    categories: product.categories,
    relevanceScore: 1.0, // Direct match has highest relevance
    matchType: 'exact',
    metadata: product.full_metadata
  };
}

/**
 * Format search result from vector search
 */
function formatSearchResult(result: any) {
  // Extract product info from metadata if available
  const metadata = result.metadata || {};

  return {
    id: result.page_id,
    url: result.url,
    title: result.title,
    sku: metadata.productSku || metadata.ecommerceData?.products?.[0]?.sku,
    price: metadata.productPrice || metadata.ecommerceData?.products?.[0]?.price,
    inStock: metadata.productInStock ?? metadata.ecommerceData?.products?.[0]?.availability?.inStock,
    brand: metadata.ecommerceData?.products?.[0]?.brand,
    categories: metadata.ecommerceData?.products?.[0]?.categories,
    relevanceScore: result.combined_similarity || result.similarity || 0,
    matchType: 'semantic',
    excerpt: result.chunk_text?.substring(0, 200),
    metadata: metadata
  };
}
