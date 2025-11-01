/**
 * Get product categories operation
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  CategoryInfo
} from './types';
import { calculatePagination, formatPaginationMessage, offsetToPage } from '../../pagination-utils';
import { formatCategoryMessage, mapCategoriesToInfo } from './category-formatter';

/**
 * Get product categories
 * Allows browsing store categories and subcategories
 */
export async function getProductCategories(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    // Handle pagination parameters
    let page = params.page || 1;
    const perPage = params.per_page || 100; // Default to 100 for categories

    // If offset is provided, convert to page number
    if (params.offset !== undefined) {
      page = offsetToPage(params.offset, perPage);
    }

    // Build query parameters
    const queryParams: any = {
      per_page: Math.min(perPage, 100), // Cap at 100 per WooCommerce API limits
      page: page,
      hide_empty: false // Include categories with no products
    };

    // Filter by specific category ID if provided
    if (params.categoryId) {
      const categoryId = parseInt(params.categoryId, 10);
      if (!isNaN(categoryId)) {
        try {
          const category = await wc.getProductCategory(categoryId);
          if (category) {
            const categoryInfo: CategoryInfo = {
              id: category.id,
              name: category.name,
              slug: category.slug,
              parent: category.parent,
              description: category.description || '',
              count: category.count
            };

            return {
              success: true,
              data: [categoryInfo],
              message: `Found category: ${category.name} (${category.count} products)`
            };
          }
        } catch (error) {
          return {
            success: false,
            data: null,
            message: `Category not found with ID: ${params.categoryId}`
          };
        }
      }
    }

    // Filter by parent category if provided
    if (params.parentCategory !== undefined) {
      queryParams.parent = params.parentCategory;
    }

    // Get categories
    const categories = await wc.getProductCategories(queryParams);

    if (categories && categories.length > 0) {
      const categoryList = mapCategoriesToInfo(categories);

      // Estimate total for pagination (if we got full page, there may be more)
      const estimatedTotal = categories.length < perPage
        ? (page - 1) * perPage + categories.length
        : page * perPage + perPage;

      const pagination = calculatePagination(page, perPage, estimatedTotal);

      // Format message with category list
      const message = formatCategoryMessage(categoryList, page, perPage) +
                      formatPaginationMessage(pagination);

      return {
        success: true,
        data: categoryList,
        message,
        pagination
      };
    } else {
      const pagination = calculatePagination(page, perPage, 0);

      return {
        success: true,
        data: [],
        message: params.parentCategory !== undefined
          ? `No subcategories found for parent category ${params.parentCategory}`
          : "No categories found",
        pagination
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Category lookup error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve categories"
    };
  }
}
