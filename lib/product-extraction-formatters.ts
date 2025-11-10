/**
 * Product Extraction Formatters
 *
 * Formats product data into context chunks
 */

import { ContextChunk, BusinessClassification } from './chat-context-enhancer-types';

/**
 * Check if product matches search query
 */
export function productMatchesQuery(product: any, searchQuery: string, searchTerms: string[]): boolean {
  const productName = product.name || '';
  const productSku = product.sku || '';
  const productDesc = product.description || '';

  // Direct match
  let matchesQuery = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    productDesc.toLowerCase().includes(searchQuery.toLowerCase());

  // Multi-term match
  if (!matchesQuery && searchTerms.length > 1) {
    const matchingTerms = searchTerms.filter(term =>
      productName.toLowerCase().includes(term) ||
      productSku.toLowerCase().includes(term) ||
      productDesc.toLowerCase().includes(term)
    );

    matchesQuery = matchingTerms.length >= Math.min(2, Math.ceil(searchTerms.length / 2));
  }

  return matchesQuery;
}

/**
 * Format product as context chunk
 */
export function formatProductAsChunk(product: any, url: string, title: string): ContextChunk {
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

/**
 * Format entity as context chunk
 */
export function formatEntityAsChunk(
  entity: any,
  classification: BusinessClassification | null
): ContextChunk {
  const terminology = classification?.entity_terminology || {
    entity: 'item',
    plural: 'items',
    priceLabel: 'price'
  };

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

  return {
    content: entityContent,
    url: '',
    title: entity.name,
    similarity: 0.95,
    source: 'product' as const,
    metadata: entity
  };
}
