/**
 * WooCommerce Store Configuration Operations
 * Handles store-level operations (coupons, shipping methods, payment gateways)
 * Extracted from woocommerce-tool-operations.ts for better modularity
 */

import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  CouponInfo,
  ShippingMethodInfo,
  PaymentMethodInfo
} from './woocommerce-tool-types';

/**
 * Validate coupon code
 * Checks if coupon exists, is active, and shows discount details
 */
export async function validateCoupon(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
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
        discountText = `£${couponInfo.amount} off your order`;
      } else if (couponInfo.discountType === 'fixed_product') {
        discountText = `£${couponInfo.amount} off per product`;
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
        message += `📌 Minimum spend: £${couponInfo.minimumAmount}\n`;
      }

      if (couponInfo.maximumAmount && parseFloat(couponInfo.maximumAmount) > 0) {
        message += `📌 Maximum discount: £${couponInfo.maximumAmount}\n`;
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

/**
 * Get available payment methods
 * Shows all configured payment gateways with capabilities
 */
export async function getPaymentMethods(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    // Get payment gateways
    const gateways = await wc.getPaymentGateways();

    if (!gateways || gateways.length === 0) {
      return {
        success: true,
        data: { methods: [] },
        message: "No payment methods configured"
      };
    }

    // Separate enabled and disabled methods
    const enabled = gateways.filter((g: any) => g.enabled);
    const disabled = gateways.filter((g: any) => !g.enabled);

    // Build message
    let message = `💳 Payment Methods\n\n`;
    message += `Total Methods: ${gateways.length}\n`;
    message += `✅ Enabled: ${enabled.length}\n`;
    message += `❌ Disabled: ${disabled.length}\n\n`;

    // Show enabled methods
    if (enabled.length > 0) {
      message += `✅ Active Payment Methods:\n\n`;
      enabled.forEach((gateway: any, index) => {
        message += `${index + 1}. ${gateway.title}\n`;
        message += `   ID: ${gateway.id}\n`;

        if (gateway.description) {
          const desc = gateway.description.replace(/<[^>]*>/g, '').substring(0, 100);
          message += `   ${desc}${gateway.description.length > 100 ? '...' : ''}\n`;
        }

        // Show supported features
        if (gateway.supports && gateway.supports.length > 0) {
          message += `   Supports: ${gateway.supports.join(', ')}\n`;
        }

        // Show additional info
        if (gateway.method_title && gateway.method_title !== gateway.title) {
          message += `   Type: ${gateway.method_title}\n`;
        }

        message += `\n`;
      });
    }

    // Show disabled methods
    if (disabled.length > 0) {
      message += `❌ Disabled Payment Methods:\n\n`;
      disabled.forEach((gateway: any, index) => {
        message += `${index + 1}. ${gateway.title} (${gateway.id})\n`;
      });
      message += `\n`;
    }

    // Add helpful note
    message += `💡 Customers can choose from ${enabled.length} payment method${enabled.length !== 1 ? 's' : ''} at checkout.`;

    // Prepare structured data
    const methodList: PaymentMethodInfo[] = gateways.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description ? g.description.replace(/<[^>]*>/g, '') : '',
      enabled: g.enabled,
      methodTitle: g.method_title || g.title,
      methodDescription: g.method_description || '',
      supports: g.supports || []
    }));

    return {
      success: true,
      data: {
        methods: methodList,
        enabled: methodList.filter(m => m.enabled),
        disabled: methodList.filter(m => !m.enabled)
      },
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Payment methods error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve payment methods"
    };
  }
}

/**
 * Get available shipping methods
 * Shows shipping zones, rates, and can calculate shipping for location
 */
export async function getShippingMethods(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    // Get shipping zones
    const zones = await wc.get('shipping/zones');

    if (!zones || zones.length === 0) {
      return {
        success: true,
        data: { zones: [], methods: [] },
        message: "No shipping zones configured"
      };
    }

    // Get methods for each zone
    const zoneDetails = await Promise.all(
      zones.map(async (zone: any) => {
        try {
          const methods = await wc.get(`shipping/zones/${zone.id}/methods`);
          return {
            zone,
            methods: methods || []
          };
        } catch (error) {
          return {
            zone,
            methods: []
          };
        }
      })
    );

    // If country/postcode provided, filter relevant zones
    let relevantZones = zoneDetails;
    if (params.country) {
      relevantZones = zoneDetails.filter(zd => {
        const locations = zd.zone.zone_locations || [];
        return locations.some((loc: any) =>
          loc.code === params.country ||
          loc.type === 'country' && loc.code === params.country
        );
      });

      if (relevantZones.length === 0) {
        // Check for "rest of world" zone
        const restOfWorld = zoneDetails.find(zd =>
          zd.zone.zone_locations?.length === 0 ||
          zd.zone.name?.toLowerCase().includes('rest of world')
        );
        if (restOfWorld) {
          relevantZones = [restOfWorld];
        }
      }
    }

    // Build response
    let message = `🚚 Available Shipping Methods\n\n`;

    if (params.country) {
      message += `📍 Location: ${params.country}`;
      if (params.postcode) message += ` ${params.postcode}`;
      message += `\n\n`;
    }

    message += `📦 Shipping Zones: ${relevantZones.length}\n\n`;

    relevantZones.forEach(({ zone, methods }) => {
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `🌍 ${zone.name}\n\n`;

      // Show zone locations
      if (zone.zone_locations && zone.zone_locations.length > 0) {
        message += `Coverage: `;
        const locations = zone.zone_locations.slice(0, 3).map((loc: any) => loc.code || loc.type);
        message += locations.join(', ');
        if (zone.zone_locations.length > 3) {
          message += ` +${zone.zone_locations.length - 3} more`;
        }
        message += `\n\n`;
      }

      // Show methods
      if (methods.length > 0) {
        message += `Shipping Methods:\n\n`;
        methods.forEach((method: any) => {
          if (method.enabled) {
            message += `  📮 ${method.title}\n`;
            message += `     Method: ${method.method_id}\n`;

            // Show cost if available
            if (method.settings?.cost?.value) {
              message += `     Cost: £${method.settings.cost.value}\n`;
            } else if (method.method_id === 'free_shipping') {
              message += `     Cost: FREE\n`;
            }

            // Show minimum order if applicable
            if (method.settings?.min_amount?.value) {
              message += `     Min Order: £${method.settings.min_amount.value}\n`;
            }

            message += `\n`;
          }
        });
      } else {
        message += `  No methods configured for this zone\n\n`;
      }
    });

    // Prepare structured data
    const allMethods = relevantZones.flatMap(({ zone, methods }) =>
      methods
        .filter((m: any) => m.enabled)
        .map((m: any) => ({
          id: m.instance_id?.toString() || m.id?.toString(),
          title: m.title,
          description: m.method_description || '',
          methodId: m.method_id,
          cost: m.settings?.cost?.value || '0',
          taxable: m.settings?.tax_status?.value === 'taxable',
          zones: [{
            id: zone.id,
            name: zone.name,
            locations: zone.zone_locations || []
          }]
        }))
    );

    return {
      success: true,
      data: {
        zones: relevantZones.map(zd => zd.zone),
        methods: allMethods
      },
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Shipping methods error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve shipping methods"
    };
  }
}
