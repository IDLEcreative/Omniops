/**
 * WooCommerce Settings API - Composition Class
 * Aggregates all settings-related APIs
 */

import type { WooCommerceClient } from '@/lib/woocommerce-types';
import { CouponsAPI } from './coupons';
import { TaxesAPI } from './taxes';
import { ShippingAPI } from './shipping';
import { PaymentGatewaysAPI } from './payment-gateways';
import { StoreSettingsAPI } from './store-settings';
import { SystemStatusAPI } from './system-status';
import { WebhooksAPI } from './webhooks';
import { DataAPI } from './data';

export class SettingsAPI {
  private coupons: CouponsAPI;
  private taxes: TaxesAPI;
  private shipping: ShippingAPI;
  private paymentGateways: PaymentGatewaysAPI;
  private storeSettings: StoreSettingsAPI;
  private systemStatus: SystemStatusAPI;
  private webhooks: WebhooksAPI;
  private data: DataAPI;

  constructor(private getClient: () => WooCommerceClient) {
    this.coupons = new CouponsAPI(getClient);
    this.taxes = new TaxesAPI(getClient);
    this.shipping = new ShippingAPI(getClient);
    this.paymentGateways = new PaymentGatewaysAPI(getClient);
    this.storeSettings = new StoreSettingsAPI(getClient);
    this.systemStatus = new SystemStatusAPI(getClient);
    this.webhooks = new WebhooksAPI(getClient);
    this.data = new DataAPI(getClient);
  }

  // ==================== COUPONS ====================
  getCoupons = (...args: Parameters<CouponsAPI['getCoupons']>) => this.coupons.getCoupons(...args);
  getCoupon = (...args: Parameters<CouponsAPI['getCoupon']>) => this.coupons.getCoupon(...args);
  createCoupon = (...args: Parameters<CouponsAPI['createCoupon']>) => this.coupons.createCoupon(...args);
  updateCoupon = (...args: Parameters<CouponsAPI['updateCoupon']>) => this.coupons.updateCoupon(...args);
  deleteCoupon = (...args: Parameters<CouponsAPI['deleteCoupon']>) => this.coupons.deleteCoupon(...args);
  batchCoupons = (...args: Parameters<CouponsAPI['batchCoupons']>) => this.coupons.batchCoupons(...args);
  getCouponByCode = (...args: Parameters<CouponsAPI['getCouponByCode']>) => this.coupons.getCouponByCode(...args);

  // ==================== TAXES ====================
  getTaxRates = (...args: Parameters<TaxesAPI['getTaxRates']>) => this.taxes.getTaxRates(...args);
  getTaxRate = (...args: Parameters<TaxesAPI['getTaxRate']>) => this.taxes.getTaxRate(...args);
  createTaxRate = (...args: Parameters<TaxesAPI['createTaxRate']>) => this.taxes.createTaxRate(...args);
  updateTaxRate = (...args: Parameters<TaxesAPI['updateTaxRate']>) => this.taxes.updateTaxRate(...args);
  deleteTaxRate = (...args: Parameters<TaxesAPI['deleteTaxRate']>) => this.taxes.deleteTaxRate(...args);
  getTaxClasses = (...args: Parameters<TaxesAPI['getTaxClasses']>) => this.taxes.getTaxClasses(...args);
  createTaxClass = (...args: Parameters<TaxesAPI['createTaxClass']>) => this.taxes.createTaxClass(...args);
  deleteTaxClass = (...args: Parameters<TaxesAPI['deleteTaxClass']>) => this.taxes.deleteTaxClass(...args);

  // ==================== SHIPPING ====================
  getShippingZones = (...args: Parameters<ShippingAPI['getShippingZones']>) => this.shipping.getShippingZones(...args);
  getShippingZone = (...args: Parameters<ShippingAPI['getShippingZone']>) => this.shipping.getShippingZone(...args);
  createShippingZone = (...args: Parameters<ShippingAPI['createShippingZone']>) => this.shipping.createShippingZone(...args);
  updateShippingZone = (...args: Parameters<ShippingAPI['updateShippingZone']>) => this.shipping.updateShippingZone(...args);
  deleteShippingZone = (...args: Parameters<ShippingAPI['deleteShippingZone']>) => this.shipping.deleteShippingZone(...args);
  getShippingZoneLocations = (...args: Parameters<ShippingAPI['getShippingZoneLocations']>) => this.shipping.getShippingZoneLocations(...args);
  updateShippingZoneLocations = (...args: Parameters<ShippingAPI['updateShippingZoneLocations']>) => this.shipping.updateShippingZoneLocations(...args);
  getShippingZoneMethods = (...args: Parameters<ShippingAPI['getShippingZoneMethods']>) => this.shipping.getShippingZoneMethods(...args);
  createShippingZoneMethod = (...args: Parameters<ShippingAPI['createShippingZoneMethod']>) => this.shipping.createShippingZoneMethod(...args);
  updateShippingZoneMethod = (...args: Parameters<ShippingAPI['updateShippingZoneMethod']>) => this.shipping.updateShippingZoneMethod(...args);
  deleteShippingZoneMethod = (...args: Parameters<ShippingAPI['deleteShippingZoneMethod']>) => this.shipping.deleteShippingZoneMethod(...args);
  getShippingMethods = (...args: Parameters<ShippingAPI['getShippingMethods']>) => this.shipping.getShippingMethods(...args);
  getShippingMethod = (...args: Parameters<ShippingAPI['getShippingMethod']>) => this.shipping.getShippingMethod(...args);

  // ==================== PAYMENT GATEWAYS ====================
  getPaymentGateways = (...args: Parameters<PaymentGatewaysAPI['getPaymentGateways']>) => this.paymentGateways.getPaymentGateways(...args);
  getPaymentGateway = (...args: Parameters<PaymentGatewaysAPI['getPaymentGateway']>) => this.paymentGateways.getPaymentGateway(...args);
  updatePaymentGateway = (...args: Parameters<PaymentGatewaysAPI['updatePaymentGateway']>) => this.paymentGateways.updatePaymentGateway(...args);

  // ==================== SETTINGS ====================
  getSettingsGroups = (...args: Parameters<StoreSettingsAPI['getSettingsGroups']>) => this.storeSettings.getSettingsGroups(...args);
  getSettings = (...args: Parameters<StoreSettingsAPI['getSettings']>) => this.storeSettings.getSettings(...args);
  getSetting = (...args: Parameters<StoreSettingsAPI['getSetting']>) => this.storeSettings.getSetting(...args);
  updateSetting = (...args: Parameters<StoreSettingsAPI['updateSetting']>) => this.storeSettings.updateSetting(...args);
  batchUpdateSettings = (...args: Parameters<StoreSettingsAPI['batchUpdateSettings']>) => this.storeSettings.batchUpdateSettings(...args);
  getSettingsOptions = (...args: Parameters<StoreSettingsAPI['getSettingsOptions']>) => this.storeSettings.getSettingsOptions(...args);
  getSettingOption = (...args: Parameters<StoreSettingsAPI['getSettingOption']>) => this.storeSettings.getSettingOption(...args);
  updateSettingOption = (...args: Parameters<StoreSettingsAPI['updateSettingOption']>) => this.storeSettings.updateSettingOption(...args);

  // ==================== SYSTEM STATUS ====================
  getSystemStatus = (...args: Parameters<SystemStatusAPI['getSystemStatus']>) => this.systemStatus.getSystemStatus(...args);
  getSystemStatusTools = (...args: Parameters<SystemStatusAPI['getSystemStatusTools']>) => this.systemStatus.getSystemStatusTools(...args);
  getSystemStatusTool = (...args: Parameters<SystemStatusAPI['getSystemStatusTool']>) => this.systemStatus.getSystemStatusTool(...args);
  runSystemStatusTool = (...args: Parameters<SystemStatusAPI['runSystemStatusTool']>) => this.systemStatus.runSystemStatusTool(...args);

  // ==================== WEBHOOKS ====================
  getWebhooks = (...args: Parameters<WebhooksAPI['getWebhooks']>) => this.webhooks.getWebhooks(...args);
  getWebhook = (...args: Parameters<WebhooksAPI['getWebhook']>) => this.webhooks.getWebhook(...args);
  createWebhook = (...args: Parameters<WebhooksAPI['createWebhook']>) => this.webhooks.createWebhook(...args);
  updateWebhook = (...args: Parameters<WebhooksAPI['updateWebhook']>) => this.webhooks.updateWebhook(...args);
  deleteWebhook = (...args: Parameters<WebhooksAPI['deleteWebhook']>) => this.webhooks.deleteWebhook(...args);
  batchWebhooks = (...args: Parameters<WebhooksAPI['batchWebhooks']>) => this.webhooks.batchWebhooks(...args);

  // ==================== DATA ====================
  get = (...args: Parameters<DataAPI['get']>) => this.data.get(...args);
  getCountries = (...args: Parameters<DataAPI['getCountries']>) => this.data.getCountries(...args);
  getCurrencies = (...args: Parameters<DataAPI['getCurrencies']>) => this.data.getCurrencies(...args);
  getCurrentCurrency = (...args: Parameters<DataAPI['getCurrentCurrency']>) => this.data.getCurrentCurrency(...args);
  getContinents = (...args: Parameters<DataAPI['getContinents']>) => this.data.getContinents(...args);
}

// Re-export types
export * from './types';
