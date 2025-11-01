/**
 * Search products operation
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult
} from './types';
import { calculatePagination, formatPaginationMessage, offsetToPage } from '../../pagination-utils';
import { formatPriceRange } from '../../currency-utils';
import {
  formatSearchResultsMessage,
  formatFilterSummary,
  mapProductsToSearchInfo
} from './product-formatter';

/**
 * Search products with filters
 * Enables customers to find products by keyword, price, category, attributes
 * Supports sorting by price, date, popularity, rating
 */
export async function searchProducts(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    // Handle pagination parameters
    let page = params.page || 1;
    const perPage = params.per_page || params.limit || 20;

    // If offset is provided, convert to page number
    if (params.offset !== undefined) {
      page = offsetToPage(params.offset, perPage);
    }

    const queryParams: any = {
      per_page: Math.min(perPage, 100), // Cap at 100 per WooCommerce API limits
      page: page,
      orderby: params.orderby || 'title', // Valid WooCommerce API values: 'date', 'id', 'title', 'price', 'popularity', 'rating'
      order: 'desc'
    };

    // Add search query
    if (params.query) {
      queryParams.search = params.query;
    }

    // Add price filters
    if (params.minPrice !== undefined) {
      queryParams.min_price = params.minPrice;
    }
    if (params.maxPrice !== undefined) {
      queryParams.max_price = params.maxPrice;
    }

    // Add category filter
    if (params.categoryId) {
      queryParams.category = params.categoryId;
    }

    // Add attribute filters (if provided)
    if (params.attributes) {
      Object.entries(params.attributes).forEach(([key, value]) => {
        queryParams[`attribute`] = key;
        queryParams[`attribute_term`] = value;
      });
    }

    const products = await wc.getProducts(queryParams);

    if (!products || products.length === 0) {
      let message = "No products found";
      if (params.query) message += ` matching "${params.query}"`;
      if (params.minPrice || params.maxPrice) {
        message += ` in price range ${formatPriceRange(params.minPrice, params.maxPrice, params)}`;
      }

      // Calculate pagination even for empty results
      const pagination = calculatePagination(page, perPage, 0);

      return {
        success: true,
        data: {
          products: [],
          total: 0,
          query: params.query || '',
          filters: {
            minPrice: params.minPrice,
            maxPrice: params.maxPrice,
            categoryId: params.categoryId
          }
        },
        message,
        pagination
      };
    }

    // WooCommerce REST API returns total count in response headers
    // We'll estimate total based on current page results
    // Note: Full total requires accessing response headers, which may not be available
    const estimatedTotal = page === 1 && products.length < perPage
      ? products.length
      : page * perPage + (products.length === perPage ? perPage : 0);

    // Calculate pagination metadata
    const pagination = calculatePagination(page, perPage, estimatedTotal);

    // Build formatted message
    let message = formatSearchResultsMessage(products, params, page, perPage);
    message += formatFilterSummary(params);
    message += formatPaginationMessage(pagination);

    const searchData = mapProductsToSearchInfo(products, params);

    return {
      success: true,
      data: searchData,
      message,
      pagination
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Search products error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to search products"
    };
  }
}
