/**
 * Product Extraction Database Queries
 *
 * Handles database queries for extracting product data from various sources
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';

/**
 * Query scraped pages for product data
 */
export async function queryScrapedPages(searchQuery: string, domainId: string) {
  const supabase = createServiceRoleClientSync();

  if (!supabase) {
    console.error('[Context Enhancer] Failed to create Supabase client for scraped pages extraction');
    return [];
  }

  const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  const searchConditions = [];

  searchConditions.push(`title.ilike.%${searchQuery}%`);
  searchConditions.push(`content.ilike.%${searchQuery}%`);

  for (const term of searchTerms) {
    searchConditions.push(`title.ilike.%${term}%`);
    searchConditions.push(`url.ilike.%${term}%`);
  }

  const { data: productPages, error: productPagesError } = await supabase
    .from('scraped_pages')
    .select('url, title, content, metadata')
    .eq('domain_id', domainId)
    .or(searchConditions.join(','))
    .limit(30);

  if (productPagesError || !productPages || productPages.length === 0) {
    return [];
  }

  return productPages;
}

/**
 * Query structured extractions for product data
 */
export async function queryStructuredExtractions(searchQuery: string, domainId: string) {
  const supabase = createServiceRoleClientSync();

  if (!supabase) {
    console.error('[Context Enhancer] Failed to create Supabase client for structured data extraction');
    return [];
  }

  const { data: structuredProducts, error: structuredError } = await supabase
    .from('structured_extractions')
    .select('url, extracted_data, confidence_score')
    .eq('domain_id', domainId)
    .eq('extract_type', 'product')
    .limit(20);

  if (structuredError || !structuredProducts || structuredProducts.length === 0) {
    return [];
  }

  return structuredProducts;
}

/**
 * Query website content for product data
 */
export async function queryWebsiteContent(searchQuery: string, domainId: string) {
  const supabase = createServiceRoleClientSync();

  if (!supabase) {
    console.error('[Context Enhancer] Failed to create Supabase client for website content extraction');
    return [];
  }

  const { data: websiteContent, error: websiteContentError } = await supabase
    .from('website_content')
    .select('url, title, content, metadata')
    .eq('domain_id', domainId)
    .or(`url.ilike.%/product/%,title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    .limit(10);

  if (websiteContentError || !websiteContent || websiteContent.length === 0) {
    return [];
  }

  return websiteContent;
}

/**
 * Query entity catalog
 */
export async function queryEntityCatalog(searchQuery: string, domainId: string) {
  const supabase = createServiceRoleClientSync();

  if (!supabase) {
    console.error('[Context Enhancer] Failed to create Supabase client for catalog extraction');
    return [];
  }

  const { data: entities, error: entityError } = await supabase
    .from('entity_catalog')
    .select('*')
    .eq('domain_id', domainId)
    .or(`name.ilike.%${searchQuery}%,primary_identifier.ilike.%${searchQuery}%,primary_category.ilike.%${searchQuery}%`)
    .limit(5);

  if (entityError || !entities || entities.length === 0) {
    return [];
  }

  return entities;
}
