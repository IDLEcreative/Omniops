/**
 * WooCommerce Payment & Shipping Types
 * Type definitions for payment and shipping operations
 */

// Payment method info type
export interface PaymentMethodInfo {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  methodTitle: string;
  methodDescription: string;
  supports: string[];
}

// Shipping method info type
export interface ShippingMethodInfo {
  id: string;
  title: string;
  description: string;
  methodId: string;
  cost: string;
  taxable: boolean;
  zones: Array<{
    id: number;
    name: string;
    locations: any[];
  }>;
}
