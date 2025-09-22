/**
 * WooCommerce Agent Tool Integration
 * Provides commerce-specific operations as tools for the chat-intelligent route
 */

import { WooCommerceAgent } from '@/lib/agents/woocommerce-agent';
import { getDynamicWooCommerceClient, searchProductsDynamic } from '@/lib/woocommerce-dynamic';
import { getProductStock } from '@/lib/woocommerce';

// Define the WooCommerce tool for OpenAI function calling
export const WOOCOMMERCE_TOOL = {
  type: "function" as const,
  function: {
    name: "woocommerce_operations",
    description: "Handle WooCommerce operations like checking detailed stock, getting product info, checking order status, and other commerce-specific tasks",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["check_stock", "get_product_details", "check_order", "get_shipping_info", "check_price"],
          description: "The WooCommerce operation to perform"
        },
        productId: {
          type: "string",
          description: "Product ID or SKU for stock/product operations"
        },
        orderId: {
          type: "string",
          description: "Order ID for order operations"
        },
        email: {
          type: "string",
          description: "Customer email for order lookups"
        },
        includeQuantity: {
          type: "boolean",
          description: "Whether to include exact stock quantities",
          default: false
        }
      },
      required: ["operation"]
    }
  }
};

// Tool executor for WooCommerce operations
export async function executeWooCommerceOperation(
  operation: string,
  params: any,
  domain: string
): Promise<{ success: boolean; data: any; message: string }> {
  console.log(`[WooCommerce Agent] Executing: ${operation}`, params);
  
  try {
    const wc = await getDynamicWooCommerceClient(domain);
    
    if (!wc) {
      return {
        success: false,
        data: null,
        message: "WooCommerce is not configured for this domain"
      };
    }

    switch (operation) {
      case "check_stock": {
        if (!params.productId) {
          return {
            success: false,
            data: null,
            message: "Product ID is required for stock checking"
          };
        }

        try {
          // Get product by ID or SKU
          const products = await wc.getProducts({
            sku: params.productId,
            per_page: 1
          });

          if (products && products.length > 0) {
            const product = products[0];
            if (!product) {
              return {
                success: false,
                data: null,
                message: "Product data not available"
              };
            }
            const stockInfo = {
              productName: product.name,
              sku: product.sku,
              stockStatus: product.stock_status,
              stockQuantity: params.includeQuantity ? product.stock_quantity : undefined,
              manageStock: product.manage_stock,
              backorders: product.backorders,
              price: product.price || product.regular_price,
              onSale: product.on_sale,
              salePrice: product.sale_price
            };

            let message = `${product.name}: `;
            if (product.stock_status === 'instock') {
              message += '✓ Currently in stock';
              if (params.includeQuantity && product.stock_quantity !== null) {
                message += ` (${product.stock_quantity} units available)`;
              }
            } else if (product.stock_status === 'outofstock') {
              message += '✗ Currently out of stock';
            } else if (product.stock_status === 'onbackorder') {
              message += '⏳ Available on backorder';
            }

            return {
              success: true,
              data: stockInfo,
              message
            };
          } else {
            return {
              success: false,
              data: null,
              message: `No product found with ID/SKU: ${params.productId}`
            };
          }
        } catch (error) {
          console.error('[WooCommerce Agent] Stock check error:', error);
          return {
            success: false,
            data: null,
            message: "Failed to check stock status"
          };
        }
      }

      case "get_product_details": {
        if (!params.productId) {
          return {
            success: false,
            data: null,
            message: "Product ID is required"
          };
        }

        try {
          const products = await wc.getProducts({
            sku: params.productId,
            per_page: 1
          });

          if (products && products.length > 0) {
            const product = products[0];
            return {
              success: true,
              data: {
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price || product.regular_price,
                salePrice: product.sale_price,
                description: product.description,
                shortDescription: product.short_description,
                categories: product.categories,
                images: product.images,
                stockStatus: product.stock_status,
                permalink: product.permalink,
                attributes: product.attributes,
                variations: product.variations
              },
              message: `Found product: ${product.name}`
            };
          } else {
            return {
              success: false,
              data: null,
              message: `No product found with ID/SKU: ${params.productId}`
            };
          }
        } catch (error) {
          console.error('[WooCommerce Agent] Product details error:', error);
          return {
            success: false,
            data: null,
            message: "Failed to get product details"
          };
        }
      }

      case "check_order": {
        if (!params.orderId && !params.email) {
          return {
            success: false,
            data: null,
            message: "Order ID or email is required for order lookup"
          };
        }

        // This would integrate with order management
        // For now, return a placeholder
        return {
          success: false,
          data: null,
          message: "Order checking requires full WooCommerce order API integration"
        };
      }

      case "get_shipping_info": {
        // Get shipping zones and methods
        try {
          const shippingZones = await wc.get('shipping/zones');
          return {
            success: true,
            data: shippingZones,
            message: "Retrieved shipping information"
          };
        } catch (error) {
          return {
            success: false,
            data: null,
            message: "Failed to get shipping information"
          };
        }
      }

      case "check_price": {
        if (!params.productId) {
          return {
            success: false,
            data: null,
            message: "Product ID is required for price checking"
          };
        }

        try {
          const products = await wc.getProducts({
            sku: params.productId,
            per_page: 1
          });

          if (products && products.length > 0) {
            const product = products[0];
            const priceInfo = {
              regularPrice: product.regular_price,
              salePrice: product.sale_price,
              currentPrice: product.price,
              onSale: product.on_sale,
              currency: 'GBP' // This should come from store settings
            };

            let message = `${product.name}: £${product.price || product.regular_price}`;
            if (product.on_sale && product.sale_price) {
              message += ` (On sale! Was £${product.regular_price})`;
            }

            return {
              success: true,
              data: priceInfo,
              message
            };
          } else {
            return {
              success: false,
              data: null,
              message: `No product found with ID/SKU: ${params.productId}`
            };
          }
        } catch (error) {
          return {
            success: false,
            data: null,
            message: "Failed to check price"
          };
        }
      }

      default:
        return {
          success: false,
          data: null,
          message: `Unknown operation: ${operation}`
        };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Error:', error);
    return {
      success: false,
      data: null,
      message: `WooCommerce operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Helper to format WooCommerce data for AI consumption
export function formatWooCommerceResponse(result: any): string {
  if (!result.success) {
    return `Error: ${result.message}`;
  }

  if (result.data) {
    return JSON.stringify({
      status: 'success',
      message: result.message,
      data: result.data
    }, null, 2);
  }

  return result.message;
}