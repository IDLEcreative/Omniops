/**
 * Product search result formatting
 */

import type { SearchProductsInfo, WooCommerceOperationParams } from './types';
import { getCurrencySymbol } from '../../currency-utils';

/**
 * Format search results into readable message
 */
export function formatSearchResultsMessage(
  products: any[],
  params: WooCommerceOperationParams,
  page: number,
  perPage: number
): string {
  let message = `🔍 Search Results`;
  if (params.query) message += ` for "${params.query}"`;
  message += ` (${products.length} products on this page)\n\n`;

  const currencySymbol = getCurrencySymbol(params);

  products.slice(0, 10).forEach((product: any, index: number) => {
    const displayIndex = (page - 1) * perPage + index + 1;
    message += `${displayIndex}. ${product.name}\n`;

    // Price display
    if (product.on_sale && product.sale_price) {
      message += `   Price: ~~${currencySymbol}${product.regular_price}~~ ${currencySymbol}${product.sale_price} (SALE!)\n`;
    } else {
      message += `   Price: ${currencySymbol}${product.price}\n`;
    }

    // Stock status
    if (product.stock_status === 'instock') {
      if (product.stock_quantity !== null) {
        message += `   Stock: ${product.stock_quantity} available\n`;
      } else {
        message += `   Stock: In stock\n`;
      }
    } else {
      message += `   Stock: Out of stock\n`;
    }

    // Rating
    if (product.average_rating && parseFloat(product.average_rating) > 0) {
      const stars = '⭐'.repeat(Math.round(parseFloat(product.average_rating)));
      message += `   Rating: ${stars} (${product.rating_count} reviews)\n`;
    }

    // Categories
    if (product.categories && product.categories.length > 0) {
      const categoryNames = product.categories.map((c: any) => c.name).join(', ');
      message += `   Categories: ${categoryNames}\n`;
    }

    message += '\n';
  });

  if (products.length > 10) {
    message += `... and ${products.length - 10} more products\n`;
  }

  return message;
}

/**
 * Add filter summary to message
 */
export function formatFilterSummary(params: WooCommerceOperationParams): string {
  const filterParts = [];

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const currencySymbol = getCurrencySymbol(params);
    const min = params.minPrice !== undefined ? `${currencySymbol}${params.minPrice}` : '';
    const max = params.maxPrice !== undefined ? `${currencySymbol}${params.maxPrice}` : '';

    if (min && max) {
      filterParts.push(`Price: ${min} - ${max}`);
    } else if (min) {
      filterParts.push(`Price: ${min}+`);
    } else if (max) {
      filterParts.push(`Price: up to ${max}`);
    }
  }

  if (params.categoryId) {
    filterParts.push(`Category: ${params.categoryId}`);
  }

  if (filterParts.length > 0) {
    return `\n📊 Filters applied: ${filterParts.join(', ')}`;
  }

  return '';
}

/**
 * Map products to SearchProductsInfo format
 */
export function mapProductsToSearchInfo(
  products: any[],
  params: WooCommerceOperationParams
): SearchProductsInfo {
  return {
    products: products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      regularPrice: p.regular_price,
      salePrice: p.sale_price,
      onSale: p.on_sale,
      stockStatus: p.stock_status,
      stockQuantity: p.stock_quantity,
      categories: p.categories,
      images: p.images,
      shortDescription: p.short_description,
      averageRating: p.average_rating,
      ratingCount: p.rating_count
    })),
    total: products.length,
    query: params.query || '',
    filters: {
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      categoryId: params.categoryId
    }
  };
}
