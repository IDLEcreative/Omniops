/**
 * WooCommerce Product Search and Category Operations
 * Handles product searching, filtering, and category browsing
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  CategoryInfo,
  SearchProductsInfo
} from '../woocommerce-tool-types';

/**
 * Get product categories
 * Allows browsing store categories and subcategories
 */
export async function getProductCategories(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    // Build query parameters
    const queryParams: any = {
      per_page: 100, // Get all categories
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
      const categoryList: CategoryInfo[] = categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parent: cat.parent,
        description: cat.description || '',
        count: cat.count
      }));

      // Format message with category list
      let message = `Found ${categoryList.length} categories:\n\n`;

      // Group by top-level categories
      const topLevel = categoryList.filter(c => c.parent === 0);
      const subCategories = categoryList.filter(c => c.parent !== 0);

      topLevel.forEach(category => {
        message += `📁 ${category.name} (${category.count} products)\n`;

        // Show subcategories
        const subs = subCategories.filter(s => s.parent === category.id);
        subs.forEach(sub => {
          message += `  └─ ${sub.name} (${sub.count} products)\n`;
        });
      });

      // Show orphaned subcategories (parent not in result set)
      const orphaned = subCategories.filter(s => !topLevel.find(t => t.id === s.parent));
      if (orphaned.length > 0) {
        message += `\nOther categories:\n`;
        orphaned.forEach(cat => {
          message += `📁 ${cat.name} (${cat.count} products)\n`;
        });
      }

      return {
        success: true,
        data: categoryList,
        message
      };
    } else {
      return {
        success: true,
        data: [],
        message: params.parentCategory !== undefined
          ? `No subcategories found for parent category ${params.parentCategory}`
          : "No categories found"
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
    const queryParams: any = {
      per_page: params.limit || 20,
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
        message += ` in price range £${params.minPrice || 0}-£${params.maxPrice || '∞'}`;
      }

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
        message
      };
    }

    // Build formatted message
    let message = `🔍 Search Results`;
    if (params.query) message += ` for "${params.query}"`;
    message += ` (${products.length} products)\n\n`;

    products.slice(0, 10).forEach((product: any, index: number) => {
      message += `${index + 1}. ${product.name}\n`;

      // Price display
      if (product.on_sale && product.sale_price) {
        message += `   Price: ~~£${product.regular_price}~~ £${product.sale_price} (SALE!)\n`;
      } else {
        message += `   Price: £${product.price}\n`;
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

    // Add filter summary if filters were used
    const filterParts = [];
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      filterParts.push(`Price: £${params.minPrice || 0}-£${params.maxPrice || '∞'}`);
    }
    if (params.categoryId) {
      filterParts.push(`Category: ${params.categoryId}`);
    }
    if (filterParts.length > 0) {
      message += `\n📊 Filters applied: ${filterParts.join(', ')}`;
    }

    const searchData: SearchProductsInfo = {
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

    return {
      success: true,
      data: searchData,
      message
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
