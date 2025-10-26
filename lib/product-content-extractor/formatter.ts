/**
 * Product data formatting utilities
 */

import { ProductData } from './types';

/**
 * Format product data as text content for embedding
 */
export function formatProductContent(productData: ProductData): string {
  const lines: string[] = [];

  // Add product name
  lines.push(`Product: ${productData.name}`);

  // Add price information
  if (productData.price) {
    lines.push(`Price: ${productData.price}`);
  }
  if (productData.regularPrice && productData.regularPrice !== productData.price) {
    lines.push(`Regular Price: ${productData.regularPrice}`);
  }
  if (productData.salePrice) {
    lines.push(`Sale Price: ${productData.salePrice}`);
  }

  // Add SKU
  if (productData.sku) {
    lines.push(`SKU: ${productData.sku}`);
  }

  // Add brand
  if (productData.brand) {
    lines.push(`Brand: ${productData.brand}`);
  }

  // Add availability
  if (productData.availability) {
    lines.push(`Availability: ${productData.availability}`);
  }

  // Add rating
  if (productData.rating) {
    lines.push(`Rating: ${productData.rating}/5${productData.reviews ? ` (${productData.reviews} reviews)` : ''}`);
  }

  // Add categories
  if (productData.categories && productData.categories.length > 0) {
    lines.push(`Categories: ${productData.categories.join(', ')}`);
  }

  // Add description
  if (productData.description) {
    lines.push('');
    lines.push('Description:');
    lines.push(productData.description);
  }

  // Add specifications
  if (productData.specifications && Object.keys(productData.specifications).length > 0) {
    lines.push('');
    lines.push('Specifications:');
    for (const [key, value] of Object.entries(productData.specifications)) {
      lines.push(`- ${key}: ${value}`);
    }
  }

  return lines.join('\n');
}
