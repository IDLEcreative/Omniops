/**
 * Coupon Operations
 * Validates coupon codes and checks eligibility
 */

import { getCurrencySymbol } from '../currency-utils';
import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  CouponInfo
} from '../woocommerce-tool-types';

/**
 * Validate coupon code
 * Checks if coupon exists, is active, and shows discount details
 */
export async function validateCoupon(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  const currencySymbol = getCurrencySymbol(params);
  if (!params.couponCode) {
    return {
      success: false,
      data: null,
      message: "Coupon code is required"
    };
  }

  try {
    // Try to get coupon by code
    const coupon = await wc.getCouponByCode(params.couponCode);

    if (coupon) {
      const couponInfo: CouponInfo = {
        id: coupon.id,
        code: coupon.code,
        amount: coupon.amount,
        discountType: coupon.discount_type,
        description: coupon.description || '',
        dateExpires: coupon.date_expires,
        usageCount: coupon.usage_count,
        usageLimit: coupon.usage_limit,
        minimumAmount: coupon.minimum_amount,
        maximumAmount: coupon.maximum_amount
      };

      // Check if coupon is expired
      const now = new Date();
      const expiryDate = couponInfo.dateExpires ? new Date(couponInfo.dateExpires) : null;
      const isExpired = expiryDate && expiryDate < now;

      // Check if usage limit reached
      const usageLimitReached = couponInfo.usageLimit !== null &&
                                 couponInfo.usageCount >= couponInfo.usageLimit;

      // Format discount message
      let discountText = '';
      if (couponInfo.discountType === 'percent') {
        discountText = `${couponInfo.amount}% off`;
      } else if (couponInfo.discountType === 'fixed_cart') {
        discountText = `${currencySymbol}${couponInfo.amount} off your order`;
      } else if (couponInfo.discountType === 'fixed_product') {
        discountText = `${currencySymbol}${couponInfo.amount} off per product`;
      }

      // Build status message
      let message = `✅ Coupon "${couponInfo.code}" is `;

      if (isExpired) {
        message = `❌ Coupon "${couponInfo.code}" has expired\n`;
        message += `Expired on: ${expiryDate?.toLocaleDateString()}\n`;
        return {
          success: false,
          data: couponInfo,
          message
        };
      }

      if (usageLimitReached) {
        message = `❌ Coupon "${couponInfo.code}" has reached its usage limit\n`;
        message += `Used: ${couponInfo.usageCount}/${couponInfo.usageLimit} times\n`;
        return {
          success: false,
          data: couponInfo,
          message
        };
      }

      message += `VALID!\n\n`;
      message += `💰 Discount: ${discountText}\n`;

      if (couponInfo.minimumAmount && parseFloat(couponInfo.minimumAmount) > 0) {
        message += `📌 Minimum spend: ${currencySymbol}${couponInfo.minimumAmount}\n`;
      }

      if (couponInfo.maximumAmount && parseFloat(couponInfo.maximumAmount) > 0) {
        message += `📌 Maximum discount: ${currencySymbol}${couponInfo.maximumAmount}\n`;
      }

      if (expiryDate) {
        message += `⏰ Expires: ${expiryDate.toLocaleDateString()}\n`;
      }

      if (couponInfo.usageLimit) {
        const remaining = couponInfo.usageLimit - couponInfo.usageCount;
        message += `📊 Uses remaining: ${remaining}/${couponInfo.usageLimit}\n`;
      }

      if (couponInfo.description) {
        message += `\n📝 ${couponInfo.description}`;
      }

      return {
        success: true,
        data: couponInfo,
        message
      };
    } else {
      return {
        success: false,
        data: null,
        message: `❌ Coupon code "${params.couponCode}" not found`
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Coupon validation error:', error);
    return {
      success: false,
      data: null,
      message: `❌ Coupon code "${params.couponCode}" not found or invalid`
    };
  }
}
