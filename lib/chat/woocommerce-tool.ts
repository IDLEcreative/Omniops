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
              if (params.includeQuantity && product.stock_quantity !== null && product.stock_quantity !== undefined) {
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
            if (!product) {
              return {
                success: false,
                data: null,
                message: "Product data not available"
              };
            }
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

        try {
          let order = null;

          // Try to get order by ID first
          if (params.orderId) {
            const numericId = parseInt(params.orderId, 10);
            if (!isNaN(numericId)) {
              try {
                order = await wc.getOrder(numericId);
              } catch (error) {
                // Order not found by ID, will try email search
                console.log(`[WooCommerce Agent] Order ID ${numericId} not found`);
              }
            }
          }

          // If not found by ID, try searching by order number or email
          if (!order && (params.orderId || params.email)) {
            const searchTerm = params.email || params.orderId;
            const orders = await wc.getOrders({
              search: searchTerm,
              per_page: 1,
            });

            if (orders && orders.length > 0) {
              order = orders[0];
            }
          }

          if (!order) {
            return {
              success: false,
              data: null,
              message: `No order found for ${params.email ? 'email' : 'order ID'}: ${params.email || params.orderId}`
            };
          }

          // Format order information
          const orderInfo = {
            id: order.id,
            number: order.number || order.id.toString(),
            status: order.status,
            date: order.date_created,
            total: order.total,
            currency: (order as any).currency_symbol || order.currency || '$',
            items: order.line_items?.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              total: item.total
            })) || [],
            billing: order.billing ? {
              firstName: order.billing.first_name,
              lastName: order.billing.last_name,
              email: order.billing.email
            } : null,
            shipping: order.shipping,
            trackingNumber: (order.shipping as any)?.tracking_number || null,
            permalink: (order as any).permalink || null
          };

          const itemsList = orderInfo.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
          let message = `Order #${orderInfo.number} - Status: ${orderInfo.status}\n`;
          message += `Date: ${orderInfo.date}\n`;
          message += `Total: ${orderInfo.currency}${orderInfo.total}\n`;
          message += `Items: ${itemsList}\n`;
          if (orderInfo.billing) {
            message += `Customer: ${orderInfo.billing.firstName} ${orderInfo.billing.lastName}`;
          }
          if (orderInfo.trackingNumber) {
            message += `\nTracking: ${orderInfo.trackingNumber}`;
          }

          return {
            success: true,
            data: orderInfo,
            message
          };
        } catch (error) {
          console.error('[WooCommerce Agent] Order lookup error:', error);
          return {
            success: false,
            data: null,
            message: "Failed to retrieve order information"
          };
        }
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
            if (!product) {
              return {
                success: false,
                data: null,
                message: "Product data not available"
              };
            }
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