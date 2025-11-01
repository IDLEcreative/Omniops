/**
 * WooCommerce Cart Operations - Informational Mode (Legacy)
 *
 * Provides URL-based cart guidance when Store API is unavailable or disabled.
 * These functions do not manipulate the cart directly - they provide links
 * for customers to take action on the store website.
 *
 * Use Cases:
 * - Store API disabled or unavailable
 * - No session management infrastructure
 * - Simple integration requirements
 *
 * Note: This mode validates data but directs users to the store for actual cart actions.
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  AddToCartInfo
} from './woocommerce-tool-types';
import { getCurrencySymbol } from './currency-utils';

/**
 * Add to cart (informational)
 * Provides product details and "add to cart" link for customer to complete action
 * Works with or without WooCommerce API client (graceful degradation)
 */
export async function addToCartInformational(
  wc: any | null,
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
    const domain = params.domain || 'store';
    const addToCartUrl = `https://${domain}/?add-to-cart=${params.productId}&quantity=${quantity}`;

    // If WooCommerce client available, fetch product details and validate
    if (wc) {
      try {
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
        console.warn('[WooCommerce Agent] Product validation failed, proceeding with basic URL:', error);
        // Fall through to basic mode if product fetch fails
      }
    }

    // Fallback mode: Generate add-to-cart URL without validation
    // This works when WooCommerce API is unavailable
    let message = `🛒 Ready to Add to Cart\n\n`;
    message += `Product ID: ${params.productId}\n`;
    message += `Quantity: ${quantity}\n\n`;
    message += `To add this to your cart, please click here:\n`;
    message += `${addToCartUrl}\n\n`;
    message += `Or I can help you find more products!`;

    const cartData: AddToCartInfo = {
      productId: parseInt(params.productId),
      productName: `Product #${params.productId}`,
      quantity,
      price: '0',
      total: '0',
      addToCartUrl,
      inStock: true,
      stockQuantity: null
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
export function getCartInformational(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  const domain = params.domain || 'store';
  const cartUrl = `https://${domain}/cart`;

  let message = `🛒 View Your Cart\n\n`;
  message += `To see your current cart contents, please visit:\n`;
  message += `${cartUrl}\n\n`;
  message += `I can help you find products to add, or answer questions about items you're considering!`;

  return Promise.resolve({
    success: true,
    data: { cartUrl },
    message
  });
}

/**
 * Remove from cart (informational)
 * Provides guidance for cart management
 */
export function removeFromCartInformational(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  const domain = params.domain || 'store';
  const cartUrl = `https://${domain}/cart`;

  let message = `🛒 Manage Your Cart\n\n`;
  message += `To remove items from your cart, please visit:\n`;
  message += `${cartUrl}\n\n`;
  message += `You can update quantities or remove items directly from your cart page.`;

  return Promise.resolve({
    success: true,
    data: { cartUrl },
    message
  });
}

/**
 * Update cart quantity (informational)
 * Provides guidance for quantity updates
 */
export function updateCartQuantityInformational(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  const domain = params.domain || 'store';
  const cartUrl = `https://${domain}/cart`;

  let message = `🛒 Update Cart Quantities\n\n`;
  message += `To change item quantities in your cart, please visit:\n`;
  message += `${cartUrl}\n\n`;
  message += `You can adjust quantities for any item directly on your cart page.`;

  return Promise.resolve({
    success: true,
    data: { cartUrl },
    message
  });
}

/**
 * Apply coupon to cart (informational)
 * Validates coupon and provides guidance for application
 * Works with or without WooCommerce API client (graceful degradation)
 */
export async function applyCouponToCartInformational(
  wc: any | null,
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

    const domain = params.domain || 'store';
    const cartUrl = `https://${domain}/cart`;
    const currencySymbol = getCurrencySymbol(params);

    // If WooCommerce client available, validate coupon
    if (wc) {
      try {
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
        console.warn('[WooCommerce Agent] Coupon validation failed, proceeding without validation:', error);
        // Fall through to basic mode if coupon validation fails
      }
    }

    // Fallback mode: Provide instructions without validation
    // This works when WooCommerce API is unavailable
    let message = `🎟️ Apply Coupon: ${params.couponCode}\n\n`;
    message += `To apply this coupon to your cart, please:\n`;
    message += `1. Visit your cart: ${cartUrl}\n`;
    message += `2. Enter code: ${params.couponCode}\n`;
    message += `3. Click "Apply Coupon"\n\n`;
    message += `Note: I couldn't pre-validate this coupon, but you can try applying it on your cart page.`;

    return {
      success: true,
      data: {
        couponCode: params.couponCode,
        cartUrl
      },
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Apply coupon error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to process coupon request"
    };
  }
}
