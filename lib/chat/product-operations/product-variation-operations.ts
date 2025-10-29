/**
 * WooCommerce Product Variation Operations
 * Handles product variations (sizes, colors, etc.) for variable products
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  ProductVariationInfo
} from '../woocommerce-tool-types';

/**
 * Get product variations
 * Retrieves all variations for a variable product (sizes, colors, etc.)
 * Most complex product tool - handles variation-specific pricing and stock
 */
export async function getProductVariations(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.productId) {
    return {
      success: false,
      data: null,
      message: "Product ID is required for variations lookup"
    };
  }

  try {
    // Get product to check if it's variable
    const products = await wc.getProducts({
      sku: params.productId,
      per_page: 1
    });

    if (!products || products.length === 0) {
      return {
        success: false,
        data: null,
        message: `No product found with ID/SKU: ${params.productId}`
      };
    }

    const product = products[0];

    // Check if product is variable type
    if (product.type !== 'variable') {
      return {
        success: false,
        data: null,
        message: `Product "${product.name}" is not a variable product. It's a ${product.type} product.`
      };
    }

    // Get variations for this product
    const variations = await wc.getProductVariations(product.id, {
      per_page: 100
    });

    if (variations && variations.length > 0) {
      // If specific variation requested
      if (params.variationId) {
        const variationId = parseInt(params.variationId, 10);
        const variation = variations.find((v: any) => v.id === variationId);

        if (!variation) {
          return {
            success: false,
            data: null,
            message: `Variation ID ${variationId} not found for this product`
          };
        }

        // Single variation response
        const variationInfo: ProductVariationInfo = {
          id: variation.id,
          sku: variation.sku,
          price: variation.price,
          regularPrice: variation.regular_price,
          salePrice: variation.sale_price,
          stockStatus: variation.stock_status,
          stockQuantity: variation.stock_quantity,
          attributes: variation.attributes.map((attr: any) => ({
            name: attr.name,
            option: attr.option
          })),
          image: variation.image,
          available: variation.purchasable && variation.stock_status === 'instock'
        };

        let message = `${product.name}\n\n`;
        message += `📦 Variation: `;
        variationInfo.attributes.forEach((attr, idx) => {
          message += `${attr.option}`;
          if (idx < variationInfo.attributes.length - 1) message += ', ';
        });
        message += `\n\n`;
        message += `SKU: ${variationInfo.sku}\n`;
        message += `Price: £${variationInfo.price}`;
        if (variation.on_sale) {
          message += ` (regular: £${variationInfo.regularPrice})`;
        }
        message += `\n`;
        message += `Stock: ${variationInfo.stockStatus}`;
        if (variationInfo.stockQuantity !== null) {
          message += ` (${variationInfo.stockQuantity} available)`;
        }
        message += `\n`;
        message += `Available: ${variationInfo.available ? '✅ Yes' : '❌ No'}`;

        return {
          success: true,
          data: variationInfo,
          message
        };
      }

      // All variations response
      const variationList: ProductVariationInfo[] = variations.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        price: v.price,
        regularPrice: v.regular_price,
        salePrice: v.sale_price,
        stockStatus: v.stock_status,
        stockQuantity: v.stock_quantity,
        attributes: v.attributes.map((attr: any) => ({
          name: attr.name,
          option: attr.option
        })),
        image: v.image,
        available: v.purchasable && v.stock_status === 'instock'
      }));

      // Group by availability
      const available = variationList.filter(v => v.available);
      const unavailable = variationList.filter(v => !v.available);

      let message = `${product.name}\n\n`;
      message += `📊 Total Variations: ${variationList.length}\n`;
      message += `✅ Available: ${available.length}\n`;
      message += `❌ Unavailable: ${unavailable.length}\n\n`;

      // Show available variations
      if (available.length > 0) {
        message += `✅ Available Variations:\n\n`;
        available.forEach((variation, index) => {
          message += `${index + 1}. `;
          variation.attributes.forEach((attr, idx) => {
            message += `${attr.option}`;
            if (idx < variation.attributes.length - 1) message += ', ';
          });
          message += `\n`;
          message += `   SKU: ${variation.sku}\n`;
          message += `   Price: £${variation.price}`;
          if (variation.salePrice && parseFloat(variation.salePrice) < parseFloat(variation.regularPrice)) {
            message += ` (was £${variation.regularPrice})`;
          }
          message += `\n`;
          if (variation.stockQuantity !== null) {
            message += `   Stock: ${variation.stockQuantity} units\n`;
          }
          message += `\n`;
        });
      }

      // Show unavailable variations
      if (unavailable.length > 0) {
        message += `❌ Out of Stock Variations:\n\n`;
        unavailable.forEach((variation, index) => {
          message += `${index + 1}. `;
          variation.attributes.forEach((attr, idx) => {
            message += `${attr.option}`;
            if (idx < variation.attributes.length - 1) message += ', ';
          });
          message += ` (${variation.stockStatus})\n`;
        });
      }

      return {
        success: true,
        data: {
          variations: variationList,
          available,
          unavailable
        },
        message
      };
    } else {
      return {
        success: false,
        data: null,
        message: `No variations found for product "${product.name}"`
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Product variations error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve product variations"
    };
  }
}
