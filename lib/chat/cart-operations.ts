/**
 * WooCommerce Cart Operations
 * Provides cart-related information and guidance
 *
 * FUTURE ENHANCEMENT: Full Cart API Integration
 *
 * To enable direct cart manipulation (without requiring customer clicks):
 * 1. Implement WooCommerce Store API client (separate from REST API v3)
 * 2. Add session management (cart tokens/cookies)
 * 3. Use endpoints:
 *    - POST /wp-json/wc/store/v1/cart/add-item
 *    - GET /wp-json/wc/store/v1/cart
 *    - DELETE /wp-json/wc/store/v1/cart/items/{key}
 *    - PUT /wp-json/wc/store/v1/cart/items/{key}
 * 4. Handle guest vs logged-in users
 * 5. Implement cart persistence
 *
 * Current implementation provides "add to cart" links which work immediately
 * and don't require complex session management infrastructure.
 *
 * Note: WooCommerce REST API v3 does NOT support cart operations.
 * Cart operations require WooCommerce Store API and session management.
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  CartInfo,
  AddToCartInfo
} from './woocommerce-tool-types';

/**
 * Add to cart (informational)
 * Provides product details and "add to cart" link for customer to complete action
 * Direct cart manipulation requires WooCommerce Store API integration (future enhancement)
 */
export async function addToCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    if (!params.productId) {
      return {
        success: false,
        data: null,
        message: "Product ID is required to add to cart"
      };
    }

    const quantity = params.quantity || 1;

    // Get product details
    const product = await wc.getProduct(params.productId);

    if (!product) {
      return {
        success: false,
        data: null,
        message: `Product #${params.productId} not found`
      };
    }

    // Check stock availability
    if (product.stock_status !== 'instock') {
      return {
        success: false,
        data: null,
        message: `${product.name} is currently out of stock`
      };
    }

    // Check if requested quantity is available
    if (product.stock_quantity !== null && quantity > product.stock_quantity) {
      return {
        success: false,
        data: null,
        message: `Only ${product.stock_quantity} units of ${product.name} available (you requested ${quantity})`
      };
    }

    // Build add-to-cart URL (WooCommerce standard format)
    const domain = params.domain || 'store';
    const addToCartUrl = `https://${domain}/?add-to-cart=${product.id}&quantity=${quantity}`;

    // Calculate total
    const itemPrice = parseFloat(product.price);
    const itemTotal = itemPrice * quantity;

    let message = `🛒 Ready to Add to Cart\n\n`;
    message += `Product: ${product.name}\n`;
    message += `Price: £${product.price} each\n`;
    message += `Quantity: ${quantity}\n`;
    message += `Total: £${itemTotal.toFixed(2)}\n\n`;

    if (product.on_sale && product.sale_price) {
      message += `💰 SALE! Regular price: £${product.regular_price}\n\n`;
    }

    message += `📦 Stock: ${product.stock_quantity !== null ? `${product.stock_quantity} available` : 'In stock'}\n\n`;
    message += `To add this to your cart, please click here:\n`;
    message += `${addToCartUrl}\n\n`;
    message += `Or I can help you find more products!`;

    const cartData: AddToCartInfo = {
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      total: itemTotal.toFixed(2),
      addToCartUrl,
      inStock: true,
      stockQuantity: product.stock_quantity
    };

    return {
      success: true,
      data: cartData,
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Add to cart error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to prepare add to cart"
    };
  }
}

/**
 * Get cart contents (informational)
 * Note: Direct cart access requires Store API and session management
 * Current implementation provides guidance to view cart on store
 */
export async function getCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  const domain = params.domain || 'store';
  const cartUrl = `https://${domain}/cart`;

  let message = `🛒 View Your Cart\n\n`;
  message += `To see your current cart contents, please visit:\n`;
  message += `${cartUrl}\n\n`;
  message += `I can help you find products to add, or answer questions about items you're considering!`;

  return {
    success: true,
    data: { cartUrl },
    message
  };
}

/**
 * Remove from cart (informational)
 * Provides guidance for cart management
 */
export async function removeFromCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  const domain = params.domain || 'store';
  const cartUrl = `https://${domain}/cart`;

  let message = `🛒 Manage Your Cart\n\n`;
  message += `To remove items from your cart, please visit:\n`;
  message += `${cartUrl}\n\n`;
  message += `You can update quantities or remove items directly from your cart page.`;

  return {
    success: true,
    data: { cartUrl },
    message
  };
}

/**
 * Update cart quantity (informational)
 * Provides guidance for quantity updates
 */
export async function updateCartQuantity(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  const domain = params.domain || 'store';
  const cartUrl = `https://${domain}/cart`;

  let message = `🛒 Update Cart Quantities\n\n`;
  message += `To change item quantities in your cart, please visit:\n`;
  message += `${cartUrl}\n\n`;
  message += `You can adjust quantities for any item directly on your cart page.`;

  return {
    success: true,
    data: { cartUrl },
    message
  };
}

/**
 * Apply coupon to cart (informational)
 * Validates coupon and provides guidance for application
 */
export async function applyCouponToCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    if (!params.couponCode) {
      return {
        success: false,
        data: null,
        message: "Coupon code is required"
      };
    }

    // Validate coupon exists and is active
    const coupons = await wc.getCoupons({ code: params.couponCode });

    if (!coupons || coupons.length === 0) {
      return {
        success: false,
        data: null,
        message: `Coupon code "${params.couponCode}" is not valid`
      };
    }

    const coupon = coupons[0];

    // Check if expired
    if (coupon.date_expires) {
      const expiryDate = new Date(coupon.date_expires);
      if (expiryDate < new Date()) {
        return {
          success: false,
          data: null,
          message: `Coupon "${params.couponCode}" has expired`
        };
      }
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return {
        success: false,
        data: null,
        message: `Coupon "${params.couponCode}" has reached its usage limit`
      };
    }

    const domain = params.domain || 'store';
    const cartUrl = `https://${domain}/cart`;

    let message = `✅ Coupon "${params.couponCode}" is Valid!\n\n`;

    if (coupon.discount_type === 'percent') {
      message += `Discount: ${coupon.amount}% off\n`;
    } else {
      message += `Discount: £${coupon.amount} off\n`;
    }

    if (coupon.minimum_amount) {
      message += `Minimum spend: £${coupon.minimum_amount}\n`;
    }

    if (coupon.date_expires) {
      const expiryDate = new Date(coupon.date_expires);
      message += `Expires: ${expiryDate.toLocaleDateString()}\n`;
    }

    message += `\nTo apply this coupon to your cart, please:\n`;
    message += `1. Visit your cart: ${cartUrl}\n`;
    message += `2. Enter code: ${params.couponCode}\n`;
    message += `3. Click "Apply Coupon"\n\n`;
    message += `Your discount will be applied automatically!`;

    return {
      success: true,
      data: {
        couponCode: params.couponCode,
        discountType: coupon.discount_type,
        amount: coupon.amount,
        minimumAmount: coupon.minimum_amount,
        cartUrl
      },
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Apply coupon error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to validate coupon"
    };
  }
}
