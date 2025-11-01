/**
 * Shipping Method Operations
 * Retrieves shipping zones, methods, and rates
 */

import { getCurrencySymbol } from '../currency-utils';
import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  ShippingMethodInfo
} from '../woocommerce-tool-types';

/**
 * Get available shipping methods
 * Shows shipping zones, rates, and can calculate shipping for location
 */
export async function getShippingMethods(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    const currencySymbol = getCurrencySymbol(params);
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
              message += `     Cost: ${currencySymbol}${method.settings.cost.value}\n`;
            } else if (method.method_id === 'free_shipping') {
              message += `     Cost: FREE\n`;
            }

            // Show minimum order if applicable
            if (method.settings?.min_amount?.value) {
              message += `     Min Order: ${currencySymbol}${method.settings.min_amount.value}\n`;
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
