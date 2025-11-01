/**
 * Types for WooCommerce Settings API
 */

import type {
  Coupon,
  TaxRate,
  TaxClass,
  ShippingZone,
  ShippingMethod,
  PaymentGateway,
  Webhook,
  SystemStatus
} from '@/lib/woocommerce-full';

import type {
  ShippingZoneLocation,
  ShippingZoneMethod,
  SettingsGroup,
  SettingOption,
  SystemStatusTool,
  CountryData,
  CurrencyData,
  ContinentData
} from '@/lib/woocommerce-types';

// Re-export all types for convenience
export type {
  Coupon,
  TaxRate,
  TaxClass,
  ShippingZone,
  ShippingMethod,
  PaymentGateway,
  Webhook,
  SystemStatus,
  ShippingZoneLocation,
  ShippingZoneMethod,
  SettingsGroup,
  SettingOption,
  SystemStatusTool,
  CountryData,
  CurrencyData,
  ContinentData
};
