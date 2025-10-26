/**
 * Types and interfaces for WooCommerce customer actions
 */

export interface CustomerActionResult {
  success: boolean;
  message: string;
  data?: any;
  requiresVerification?: boolean;
}

export interface ShippingAddressUpdate {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

export interface OrderTrackingData {
  status: string;
  date_shipped: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
}

export interface CustomerInfo {
  name: string;
  email: string;
  billing_address: any;
  shipping_address: any;
  created: string;
  total_orders: number;
  total_spent: string;
}

export interface OrderSummary {
  number: string;
  date: string;
  status: string;
  total: string;
  items_count: number;
}

export interface OrderDetails {
  order_number: string;
  status: string;
  date: string;
  total: string;
  payment_method: string;
  shipping_address: any;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  tracking?: any;
  customer_note?: string;
}

/**
 * Generate tracking URL based on carrier name and tracking number
 */
export function generateTrackingUrl(carrier: string, trackingNumber: string): string {
  const carriers: Record<string, string> = {
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    'royal-mail': `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
    'dpd': `https://www.dpd.co.uk/tracking/?parcel=${trackingNumber}`,
    'hermes': `https://www.evri.com/track-parcel/${trackingNumber}`
  };

  const carrierLower = carrier.toLowerCase().replace(/\s+/g, '-');
  return carriers[carrierLower] || `#tracking-${trackingNumber}`;
}
