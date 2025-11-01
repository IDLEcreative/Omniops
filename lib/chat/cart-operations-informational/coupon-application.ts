/**
 * Apply coupon to cart (informational mode)
 * Validates coupon and provides guidance for application
 * Works with or without WooCommerce API client (graceful degradation)
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult
} from './types';
import { getCurrencySymbol } from '../currency-utils';

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
