/**
 * Shopify Operations Tool Definition
 *
 * Defines the AI tool for Shopify cart and order operations.
 * Similar to WooCommerce tool but adapted for Shopify's API structure.
 */

export const SHOPIFY_TOOL = {
  type: "function" as const,
  function: {
    name: "shopify_operations",
    description: `Perform Shopify e-commerce operations including cart management and order lookup.

IMPORTANT: Only use this tool when the customer has Shopify configured. If Shopify is not available, DO NOT attempt cart operations.

Available operations:
- add_to_cart: Add item to customer's cart
- get_cart: View current cart contents and totals
- remove_from_cart: Remove item from cart
- update_cart_quantity: Change quantity of items in cart
- apply_discount: Apply discount code to cart
- lookup_order: Look up order details by order number

Use this for:
- "Add [product] to cart"
- "Show my cart"
- "Remove [item] from cart"
- "Update cart quantity"
- "Apply discount code [CODE]"
- "Check order #12345"`,
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: [
            "add_to_cart",
            "get_cart",
            "remove_from_cart",
            "update_cart_quantity",
            "apply_discount",
            "lookup_order"
          ],
          description: "The Shopify operation to perform"
        },
        productId: {
          type: "string",
          description: "Product variant ID for add_to_cart operation (required for add_to_cart)"
        },
        quantity: {
          type: "number",
          description: "Quantity of items (default: 1 for add_to_cart, required for update_cart_quantity)",
          default: 1,
          minimum: 0
        },
        cartItemId: {
          type: "string",
          description: "Cart line item ID for remove_from_cart or update_cart_quantity operations"
        },
        discountCode: {
          type: "string",
          description: "Discount code to apply (required for apply_discount)"
        },
        orderId: {
          type: "string",
          description: "Order number or ID for lookup_order operation (required for lookup_order)"
        }
      },
      required: ["operation"]
    }
  }
};

/**
 * Type definitions for Shopify operations
 */
export interface ShopifyOperationParams {
  operation: 'add_to_cart' | 'get_cart' | 'remove_from_cart' | 'update_cart_quantity' | 'apply_discount' | 'lookup_order';
  productId?: string;
  quantity?: number;
  cartItemId?: string;
  discountCode?: string;
  orderId?: string;
  shopifyAPI?: any; // Shopify API client instance
}

export interface ShopifyOperationResult {
  success: boolean;
  data: any;
  message: string;
}