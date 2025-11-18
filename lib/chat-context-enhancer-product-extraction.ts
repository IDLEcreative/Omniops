/**
 * Product Extraction Strategies
 * Main orchestrator for extracting product data from various sources
 */

import { ContextChunk, BusinessClassification } from './chat-context-enhancer-types';
import {
  queryScrapedPages,
  queryStructuredExtractions,
  queryWebsiteContent,
  queryEntityCatalog
} from './product-extraction-queries';
import {
  productMatchesQuery,
  formatProductAsChunk,
  formatEntityAsChunk
} from './product-extraction-formatters';

/**
 * Extract product chunks from scraped pages metadata
 */
export async function extractProductsFromScrapedPages(
  searchQuery: string,
  domainId: string
): Promise<ContextChunk[]> {
  const productPages = await queryScrapedPages(searchQuery, domainId);
  if (productPages.length === 0) return [];


  const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 2);

  const chunks: ContextChunk[] = [];

  for (const page of productPages) {
    if (page.metadata?.ecommerceData?.products && Array.isArray(page.metadata.ecommerceData.products)) {
      for (const product of page.metadata.ecommerceData.products) {
        if (productMatchesQuery(product, searchQuery, searchTerms)) {
          chunks.push(formatProductAsChunk(product, page.url, page.title));
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
  const structuredProducts = await queryStructuredExtractions(searchQuery, domainId);
  if (structuredProducts.length === 0) return [];


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
  const websiteContent = await queryWebsiteContent(searchQuery, domainId);
  if (websiteContent.length === 0) return [];


  const chunks: ContextChunk[] = [];

  for (const page of websiteContent) {
    if (page.metadata?.ecommerceData?.products) {
      for (const product of page.metadata.ecommerceData.products) {
        const matchesQuery = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

        if (matchesQuery) {
          chunks.push(formatProductAsChunk(product, page.url, page.title || ''));
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
  const entities = await queryEntityCatalog(searchQuery, domainId);
  if (entities.length === 0) return [];

  const terminology = classification?.entity_terminology || {
    entity: 'item',
    plural: 'items',
    priceLabel: 'price'
  };


  return entities.map(entity => formatEntityAsChunk(entity, classification));
}
