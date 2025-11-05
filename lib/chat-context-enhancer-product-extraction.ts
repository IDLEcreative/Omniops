/**
 * Product Extraction Strategies
 * Handles extraction of product data from various sources
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import { ContextChunk, BusinessClassification } from './chat-context-enhancer-types';

/**
 * Extract product chunks from scraped pages metadata
 */
export async function extractProductsFromScrapedPages(
  searchQuery: string,
  domainId: string
): Promise<ContextChunk[]> {
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

  console.log(`[Context Enhancer] Checking ${productPages.length} scraped pages for product data...`);

  const chunks: ContextChunk[] = [];

  for (const page of productPages) {
    if (page.metadata?.ecommerceData?.products && Array.isArray(page.metadata.ecommerceData.products)) {
      for (const product of page.metadata.ecommerceData.products) {
        const productName = product.name || '';
        const productSku = product.sku || '';
        const productDesc = product.description || '';

        let matchesQuery = false;

        matchesQuery = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      productDesc.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesQuery && searchTerms.length > 1) {
          const matchingTerms = searchTerms.filter(term =>
            productName.toLowerCase().includes(term) ||
            productSku.toLowerCase().includes(term) ||
            productDesc.toLowerCase().includes(term)
          );

          matchesQuery = matchingTerms.length >= Math.min(2, Math.ceil(searchTerms.length / 2));
        }

        if (matchesQuery) {
          chunks.push(formatProductAsChunk(product, page.url, page.title));
          console.log(`[Context Enhancer] Found product with price: ${product.name} - ${product.price?.formatted || product.price}`);
        }
      }
    }
  }

  return chunks;
}

/**
 * Extract product chunks from structured extractions
 */
export async function extractProductsFromStructuredData(
  searchQuery: string,
  domainId: string
): Promise<ContextChunk[]> {
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

  console.log(`[Context Enhancer] Checking ${structuredProducts.length} structured product extractions...`);

  const chunks: ContextChunk[] = [];

  for (const extraction of structuredProducts) {
    const product = extraction.extracted_data as any;
    if (product) {
      const productName = product.name || '';
      const productSku = product.sku || '';
      const matchesQuery = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          productSku.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchesQuery) {
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

        chunks.push({
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

  return chunks;
}

/**
 * Extract product chunks from website_content table
 */
export async function extractProductsFromWebsiteContent(
  searchQuery: string,
  domainId: string
): Promise<ContextChunk[]> {
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

  console.log(`[Context Enhancer] Checking ${websiteContent.length} website_content entries...`);

  const chunks: ContextChunk[] = [];

  for (const page of websiteContent) {
    if (page.metadata?.ecommerceData?.products) {
      for (const product of page.metadata.ecommerceData.products) {
        const matchesQuery = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

        if (matchesQuery) {
          chunks.push(formatProductAsChunk(product, page.url, page.title || ''));
          console.log(`[Context Enhancer] Found product in website_content: ${product.name}`);
        }
      }
    }
  }

  return chunks;
}

/**
 * Extract entities from catalog (works for any business type)
 */
export async function extractEntitiesFromCatalog(
  searchQuery: string,
  domainId: string,
  classification: BusinessClassification | null
): Promise<ContextChunk[]> {
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

  const terminology = classification?.entity_terminology || {
    entity: 'item',
    plural: 'items',
    priceLabel: 'price'
  };

  console.log(`[Context Enhancer] Found ${entities.length} direct ${terminology.plural} matches`);

  const chunks: ContextChunk[] = [];

  for (const entity of entities) {
    let entityContent = `
${entity.entity_type}: ${entity.name}
${entity.primary_identifier ? `ID: ${entity.primary_identifier}` : ''}
${entity.price ? `${terminology.priceLabel || 'Price'}: $${entity.price}` : ''}
Category: ${entity.primary_category || 'General'}
Available: ${entity.is_available ? 'Yes' : 'No'}
${entity.description || ''}
    `.trim();

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

    chunks.push({
      content: entityContent,
      url: '',
      title: entity.name,
      similarity: 0.95,
      source: 'product' as const,
      metadata: entity
    });
  }

  return chunks;
}

/**
 * Helper: Format product as context chunk
 */
function formatProductAsChunk(product: any, url: string, title: string): ContextChunk {
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

  return {
    content: productContent,
    url: url || '',
    title: product.name || title || '',
    similarity: 0.95,
    source: 'product' as const,
    metadata: product
  };
}
