/**
 * Shared utilities for WooCommerce cart operations
 *
 * Provides common formatting and error handling logic used by both
 * transactional and informational cart operations.
 */

import type { TransactionalCartInfo } from './woocommerce-types/cart-types';
import type { WooCommerceOperationResult } from './woocommerce-tool-types';

/**
 * Format Store API cart response to TransactionalCartInfo
 */
export function formatCartResponse(cart: any): TransactionalCartInfo {
  return {
    items: cart.items.map((item: any) => ({
      key: item.key,
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.prices.price,
      total: item.totals.line_total,
      imageUrl: item.images?.[0]?.src,
    })),
    itemsCount: cart.items_count,
    subtotal: cart.totals.total_items,
    discount: cart.totals.total_discount || '0',
    shipping: cart.totals.total_shipping || '0',
    total: cart.totals.total_price,
    currency: cart.totals.currency_code,
    currencySymbol: cart.totals.currency_symbol,
    needsShipping: cart.needs_shipping,
    appliedCoupons: cart.coupons.map((c: any) => ({
      code: c.code,
      discount: c.totals.total_discount,
    })),
  };
}

/**
 * Format "add to cart" success message
 */
export function formatAddToCartMessage(cart: any, addedItem: any): string {
  const currencySymbol = cart.totals.currency_symbol;

  let message = `✅ Added to Cart\n\n`;
  message += `Product: ${addedItem.name}\n`;
  message += `Quantity: ${addedItem.quantity}\n`;
  message += `Price: ${currencySymbol}${addedItem.prices.price}\n`;
  message += `Subtotal: ${currencySymbol}${addedItem.totals.line_total}\n\n`;
  message += `🛒 Cart Total: ${currencySymbol}${cart.totals.total_price}\n`;
  message += `Items in cart: ${cart.items_count}\n\n`;
  message += `Would you like to view your cart or continue shopping?`;

  return message;
}

/**
 * Format "view cart" message
 */
export function formatViewCartMessage(cart: any): string {
  if (cart.items.length === 0) {
    return "🛒 Your cart is empty\n\nWould you like me to help you find some products?";
  }

  const currencySymbol = cart.totals.currency_symbol;
  let message = `🛒 Your Cart (${cart.items_count} items)\n\n`;

  cart.items.forEach((item: any, index: number) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `   Qty: ${item.quantity} × ${currencySymbol}${item.prices.price}\n`;
    message += `   Subtotal: ${currencySymbol}${item.totals.line_total}\n\n`;
  });

  message += `Subtotal: ${currencySymbol}${cart.totals.total_items}\n`;

  if (cart.coupons.length > 0) {
    cart.coupons.forEach((coupon: any) => {
      message += `Discount (${coupon.code}): -${currencySymbol}${coupon.totals.total_discount}\n`;
    });
  }

  if (cart.needs_shipping) {
    message += `Shipping: ${currencySymbol}${cart.totals.total_shipping}\n`;
  }

  message += `\n💰 Total: ${currencySymbol}${cart.totals.total_price}\n\n`;
  message += `Would you like to update quantities, remove items, or proceed to checkout?`;

  return message;
}

/**
 * Format "remove from cart" success message
 */
export function formatRemoveFromCartMessage(cart: any): string {
  const currencySymbol = cart.totals.currency_symbol;

  let message = `✅ Item removed from cart\n\n`;
  message += `🛒 Cart Total: ${currencySymbol}${cart.totals.total_price}\n`;
  message += `Items remaining: ${cart.items_count}\n\n`;

  if (cart.items.length === 0) {
    message += `Your cart is now empty. Would you like to continue shopping?`;
  } else {
    message += `Would you like to update other items or proceed to checkout?`;
  }

  return message;
}

/**
 * Format "update cart quantity" success message
 */
export function formatUpdateCartMessage(cart: any, updatedItem: any): string {
  const currencySymbol = cart.totals.currency_symbol;

  let message = `✅ Cart Updated\n\n`;
  message += `Product: ${updatedItem.name}\n`;
  message += `New Quantity: ${updatedItem.quantity}\n`;
  message += `Subtotal: ${currencySymbol}${updatedItem.totals.line_total}\n\n`;
  message += `🛒 Cart Total: ${currencySymbol}${cart.totals.total_price}\n`;
  message += `Items in cart: ${cart.items_count}\n`;

  return message;
}

/**
 * Format "apply coupon" success message
 */
export function formatApplyCouponMessage(cart: any, appliedCoupon: any): string {
  const currencySymbol = cart.totals.currency_symbol;

  let message = `✅ Coupon Applied!\n\n`;
  message += `Code: ${appliedCoupon.code}\n`;
  message += `Discount: -${currencySymbol}${appliedCoupon.totals.total_discount}\n\n`;
  message += `🛒 New Cart Total: ${currencySymbol}${cart.totals.total_price}\n`;
  message += `You saved ${currencySymbol}${appliedCoupon.totals.total_discount}!`;

  return message;
}

/**
 * Handle cart operation errors consistently
 */
export function handleCartError(error: any, operation: string): WooCommerceOperationResult {
  console.error(`[Cart Operation] ${operation} error:`, error);
  return {
    success: false,
    data: null,
    message: `${operation} failed: ${error.message || 'Unknown error'}`
  };
}
