import {
  Coupon,
  TaxRate,
  TaxClass,
  ShippingZone,
  ShippingMethod,
  PaymentGateway,
  Webhook,
  SystemStatus,
  CouponSchema,
  TaxRateSchema,
  TaxClassSchema,
  ShippingZoneSchema,
  ShippingMethodSchema,
  PaymentGatewaySchema,
  WebhookSchema,
  SystemStatusSchema,
  BatchOperation,
  BatchResponse
} from '../woocommerce-full';

import {
  ShippingZoneLocation,
  ShippingZoneMethod,
  SettingsGroup,
  SettingOption,
  SystemStatusTool,
  CountryData,
  CurrencyData,
  ContinentData,
  WooCommerceClient,
  CouponListParams,
  ListParams,
  SettingUpdateData
} from '../woocommerce-types';

export class SettingsAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // ==================== COUPONS ====================
  
  // Get all coupons
  async getCoupons(params?: CouponListParams): Promise<Coupon[]> {
    const response = await this.getClient().get('coupons', params);
    return (response.data as unknown[]).map((item) => CouponSchema.parse(item));
  }

  // Get single coupon
  async getCoupon(id: number): Promise<Coupon> {
    const response = await this.getClient().get(`coupons/${id}`);
    return CouponSchema.parse(response.data);
  }

  // Create coupon
  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const response = await this.getClient().post('coupons', data);
    return CouponSchema.parse(response.data);
  }

  // Update coupon
  async updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon> {
    const response = await this.getClient().put(`coupons/${id}`, data);
    return CouponSchema.parse(response.data);
  }

  // Delete coupon
  async deleteCoupon(id: number, force: boolean = false): Promise<Coupon> {
    const response = await this.getClient().delete(`coupons/${id}`, { force });
    return CouponSchema.parse(response.data);
  }

  // Batch coupon operations
  async batchCoupons(operations: BatchOperation<Coupon>): Promise<BatchResponse<Coupon>> {
    const response = await this.getClient().post('coupons/batch', operations);
    return {
      create: response.data.create?.map((item: any) => CouponSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => CouponSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // ==================== TAXES ====================
  
  // Get tax rates
  async getTaxRates(params?: ListParams): Promise<TaxRate[]> {
    const response = await this.getClient().get('taxes', params);
    return (response.data as unknown[]).map((item) => TaxRateSchema.parse(item));
  }

  // Get single tax rate
  async getTaxRate(id: number): Promise<TaxRate> {
    const response = await this.getClient().get(`taxes/${id}`);
    return TaxRateSchema.parse(response.data);
  }

  // Create tax rate
  async createTaxRate(data: Partial<TaxRate>): Promise<TaxRate> {
    const response = await this.getClient().post('taxes', data);
    return TaxRateSchema.parse(response.data);
  }

  // Update tax rate
  async updateTaxRate(id: number, data: Partial<TaxRate>): Promise<TaxRate> {
    const response = await this.getClient().put(`taxes/${id}`, data);
    return TaxRateSchema.parse(response.data);
  }

  // Delete tax rate
  async deleteTaxRate(id: number, force: boolean = false): Promise<TaxRate> {
    const response = await this.getClient().delete(`taxes/${id}`, { force });
    return TaxRateSchema.parse(response.data);
  }

  // Get tax classes
  async getTaxClasses(): Promise<TaxClass[]> {
    const response = await this.getClient().get('taxes/classes');
    return (response.data as unknown[]).map((item) => TaxClassSchema.parse(item));
  }

  // Create tax class
  async createTaxClass(data: Partial<TaxClass>): Promise<TaxClass> {
    const response = await this.getClient().post('taxes/classes', data);
    return TaxClassSchema.parse(response.data);
  }

  // Delete tax class
  async deleteTaxClass(slug: string, force: boolean = false): Promise<TaxClass> {
    const response = await this.getClient().delete(`taxes/classes/${slug}`, { force });
    return TaxClassSchema.parse(response.data);
  }

  // ==================== SHIPPING ====================
  
  // Get shipping zones
  async getShippingZones(params?: ListParams): Promise<ShippingZone[]> {
    const response = await this.getClient().get('shipping/zones', params);
    return (response.data as unknown[]).map((item) => ShippingZoneSchema.parse(item));
  }

  // Get single shipping zone
  async getShippingZone(id: number): Promise<ShippingZone> {
    const response = await this.getClient().get(`shipping/zones/${id}`);
    return ShippingZoneSchema.parse(response.data);
  }

  // Create shipping zone
  async createShippingZone(data: Partial<ShippingZone>): Promise<ShippingZone> {
    const response = await this.getClient().post('shipping/zones', data);
    return ShippingZoneSchema.parse(response.data);
  }

  // Update shipping zone
  async updateShippingZone(id: number, data: Partial<ShippingZone>): Promise<ShippingZone> {
    const response = await this.getClient().put(`shipping/zones/${id}`, data);
    return ShippingZoneSchema.parse(response.data);
  }

  // Delete shipping zone
  async deleteShippingZone(id: number, force: boolean = false): Promise<ShippingZone> {
    const response = await this.getClient().delete(`shipping/zones/${id}`, { force });
    return ShippingZoneSchema.parse(response.data);
  }

  // Get shipping zone locations
  async getShippingZoneLocations(zoneId: number): Promise<ShippingZoneLocation[]> {
    const response = await this.getClient().get(`shipping/zones/${zoneId}/locations`);
    return response.data;
  }

  // Update shipping zone locations
  async updateShippingZoneLocations(zoneId: number, locations: ShippingZoneLocation[]): Promise<ShippingZoneLocation[]> {
    const response = await this.getClient().put(`shipping/zones/${zoneId}/locations`, locations);
    return response.data;
  }

  // Get shipping zone methods
  async getShippingZoneMethods(zoneId: number): Promise<ShippingZoneMethod[]> {
    const response = await this.getClient().get(`shipping/zones/${zoneId}/methods`);
    return response.data;
  }

  // Create shipping zone method
  async createShippingZoneMethod(zoneId: number, data: Partial<ShippingZoneMethod>): Promise<ShippingZoneMethod> {
    const response = await this.getClient().post(`shipping/zones/${zoneId}/methods`, data);
    return response.data;
  }

  // Get shipping methods
  async getShippingMethods(params?: ListParams): Promise<ShippingMethod[]> {
    const response = await this.getClient().get('shipping_methods', params);
    return (response.data as unknown[]).map((item) => ShippingMethodSchema.parse(item));
  }

  // Get single shipping method
  async getShippingMethod(id: string): Promise<ShippingMethod> {
    const response = await this.getClient().get(`shipping_methods/${id}`);
    return ShippingMethodSchema.parse(response.data);
  }

  // ==================== PAYMENT GATEWAYS ====================
  
  // Get payment gateways
  async getPaymentGateways(): Promise<PaymentGateway[]> {
    const response = await this.getClient().get('payment_gateways');
    return (response.data as unknown[]).map((item) => PaymentGatewaySchema.parse(item));
  }

  // Get single payment gateway
  async getPaymentGateway(id: string): Promise<PaymentGateway> {
    const response = await this.getClient().get(`payment_gateways/${id}`);
    return PaymentGatewaySchema.parse(response.data);
  }

  // Update payment gateway
  async updatePaymentGateway(id: string, data: Partial<PaymentGateway>): Promise<PaymentGateway> {
    const response = await this.getClient().put(`payment_gateways/${id}`, data);
    return PaymentGatewaySchema.parse(response.data);
  }

  // ==================== SETTINGS ====================
  
  // Get all settings groups
  async getSettingsGroups(): Promise<SettingsGroup[]> {
    const response = await this.getClient().get('settings');
    return response.data;
  }

  // Get settings for a specific group
  async getSettings(group: string): Promise<SettingOption[]> {
    const response = await this.getClient().get(`settings/${group}`);
    return response.data;
  }

  // Get single setting
  async getSetting(group: string, id: string): Promise<SettingOption> {
    const response = await this.getClient().get(`settings/${group}/${id}`);
    return response.data;
  }

  // Update setting
  async updateSetting(group: string, id: string, value: SettingUpdateData): Promise<SettingOption> {
    const response = await this.getClient().put(`settings/${group}/${id}`, value);
    return response.data;
  }

  // Batch update settings
  async batchUpdateSettings(group: string, updates: Record<string, SettingUpdateData>): Promise<SettingOption[]> {
    const response = await this.getClient().post(`settings/${group}/batch`, { update: updates });
    return response.data;
  }

  // ==================== SYSTEM STATUS ====================
  
  // Get system status
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await this.getClient().get('system_status');
    return SystemStatusSchema.parse(response.data);
  }

  // Get system status tools
  async getSystemStatusTools(): Promise<SystemStatusTool[]> {
    const response = await this.getClient().get('system_status/tools');
    return response.data;
  }

  // Get single system status tool
  async getSystemStatusTool(id: string): Promise<SystemStatusTool> {
    const response = await this.getClient().get(`system_status/tools/${id}`);
    return response.data;
  }

  // Run system status tool
  async runSystemStatusTool(id: string, confirm: boolean = false): Promise<SystemStatusTool> {
    const response = await this.getClient().put(`system_status/tools/${id}`, { confirm });
    return response.data;
  }

  // ==================== WEBHOOKS ====================
  
  // Get all webhooks
  async getWebhooks(params?: ListParams): Promise<Webhook[]> {
    const response = await this.getClient().get('webhooks', params);
    return (response.data as unknown[]).map((item) => WebhookSchema.parse(item));
  }

  // Get single webhook
  async getWebhook(id: number): Promise<Webhook> {
    const response = await this.getClient().get(`webhooks/${id}`);
    return WebhookSchema.parse(response.data);
  }

  // Create webhook
  async createWebhook(data: Partial<Webhook>): Promise<Webhook> {
    const response = await this.getClient().post('webhooks', data);
    return WebhookSchema.parse(response.data);
  }

  // Update webhook
  async updateWebhook(id: number, data: Partial<Webhook>): Promise<Webhook> {
    const response = await this.getClient().put(`webhooks/${id}`, data);
    return WebhookSchema.parse(response.data);
  }

  // Delete webhook
  async deleteWebhook(id: number, force: boolean = false): Promise<Webhook> {
    const response = await this.getClient().delete(`webhooks/${id}`, { force });
    return WebhookSchema.parse(response.data);
  }

  // Batch webhook operations
  async batchWebhooks(operations: BatchOperation<Webhook>): Promise<BatchResponse<Webhook>> {
    const response = await this.getClient().post('webhooks/batch', operations);
    return {
      create: response.data.create?.map((item: any) => WebhookSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => WebhookSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // ==================== DATA ====================
  
  // Generic get method for direct API access
  async get(path: string, params?: Record<string, unknown>): Promise<unknown> {
    const response = await this.getClient().get(path, params);
    return response.data;
  }
  
  // Get countries
  async getCountries(): Promise<CountryData[]> {
    const response = await this.getClient().get('data/countries');
    return response.data;
  }

  // Get currencies
  async getCurrencies(): Promise<CurrencyData[]> {
    const response = await this.getClient().get('data/currencies');
    return response.data;
  }

  // Get current currency
  async getCurrentCurrency(): Promise<CurrencyData> {
    const response = await this.getClient().get('data/currencies/current');
    return response.data;
  }

  // Get continents
  async getContinents(): Promise<ContinentData[]> {
    const response = await this.getClient().get('data/continents');
    return response.data;
  }
}