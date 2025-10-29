/**
 * WooCommerce Cart Operations
 * Provides cart-related operations with dual mode support:
 *
 * 1. INFORMATIONAL MODE (default, legacy):
 *    - Provides "add to cart" URLs for user to click
 *    - No session management required
 *    - Works immediately without complex setup
 *
 * 2. TRANSACTIONAL MODE (Store API):
 *    - Direct cart manipulation via WooCommerce Store API
 *    - Session-based persistence
 *    - Real-time cart totals
 *    - Requires: WOOCOMMERCE_STORE_API_ENABLED=true
 *
 * Feature Flag: WOOCOMMERCE_STORE_API_ENABLED
 * - Set to 'true' to enable transactional mode
 * - Defaults to informational mode if unset or 'false'
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
import { getCurrencySymbol } from './currency-utils';

// Import transactional functions (lazy loaded when needed)
import type { WooCommerceStoreAPI } from '@/lib/woocommerce-store-api';

// Feature flag check
const USE_STORE_API = process.env.WOOCOMMERCE_STORE_API_ENABLED === 'true';

// ==================== PUBLIC API (MODE-AWARE) ====================

/**
 * Add to cart (mode-aware)
 * Automatically switches between informational and transactional modes
 */
export async function addToCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    // Transactional mode (requires Store API client)
    const { addToCartDirect } = await import('./cart-operations-transactional');
    return addToCartDirect(params.storeAPI, params);
  } else {
    // Informational mode (default)
    return addToCartInformational(wc, params);
  }
}

/**
 * Get cart (mode-aware)
 */
export async function getCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    const { getCartDirect } = await import('./cart-operations-transactional');
    return getCartDirect(params.storeAPI, params);
  } else {
    return getCartInformational(wc, params);
  }
}

/**
 * Remove from cart (mode-aware)
 */
export async function removeFromCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    const { removeFromCartDirect } = await import('./cart-operations-transactional');
    return removeFromCartDirect(params.storeAPI, params);
  } else {
    return removeFromCartInformational(wc, params);
  }
}

/**
 * Update cart quantity (mode-aware)
 */
export async function updateCartQuantity(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    const { updateCartQuantityDirect } = await import('./cart-operations-transactional');
    return updateCartQuantityDirect(params.storeAPI, params);
  } else {
    return updateCartQuantityInformational(wc, params);
  }
}

/**
 * Apply coupon to cart (mode-aware)
 */
export async function applyCouponToCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    const { applyCouponToCartDirect } = await import('./cart-operations-transactional');
    return applyCouponToCartDirect(params.storeAPI, params);
  } else {
    return applyCouponToCartInformational(wc, params);
  }
}

// ==================== INFORMATIONAL MODE (LEGACY) ====================

/**
 * Add to cart (informational)
 * Provides product details and "add to cart" link for customer to complete action
 */
async function addToCartInformational(
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
    const currencySymbol = getCurrencySymbol(params);

    let message = `🛒 Ready to Add to Cart\n\n`;
    message += `Product: ${product.name}\n`;
    message += `Price: ${currencySymbol}${product.price} each\n`;
    message += `Quantity: ${quantity}\n`;
    message += `Total: ${currencySymbol}${itemTotal.toFixed(2)}\n\n`;

    if (product.on_sale && product.sale_price) {
      message += `💰 SALE! Regular price: ${currencySymbol}${product.regular_price}\n\n`;
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
function getCartInformational(
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
function removeFromCartInformational(
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
function updateCartQuantityInformational(
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
async function applyCouponToCartInformational(
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
    const currencySymbol = getCurrencySymbol(params);

    let message = `✅ Coupon "${params.couponCode}" is Valid!\n\n`;

    if (coupon.discount_type === 'percent') {
      message += `Discount: ${coupon.amount}% off\n`;
    } else {
      message += `Discount: ${currencySymbol}${coupon.amount} off\n`;
    }

    if (coupon.minimum_amount) {
      message += `Minimum spend: ${currencySymbol}${coupon.minimum_amount}\n`;
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
