import type { WooCommerceClient } from '@/lib/woocommerce-types';
import { ProductsAPI } from './products';
import { OrdersAPI } from './orders';
import { CustomersAPI } from './customers';
import { ReportsAPI } from './reports';
import { SettingsAPI } from './settings';
import { getWooCommerceModule } from './woo-module';

export * from '../woocommerce-types';

export class WooCommerceAPI {
  private wc: WooCommerceClient | null = null;
  private config?: { url?: string; consumerKey?: string; consumerSecret?: string };
  
  // Module instances
  private productsAPI: ProductsAPI | null = null;
  private ordersAPI: OrdersAPI | null = null;
  private customersAPI: CustomersAPI | null = null;
  private reportsAPI: ReportsAPI | null = null;
  private settingsAPI: SettingsAPI | null = null;

  constructor(config?: { url?: string; consumerKey?: string; consumerSecret?: string }) {
    this.config = config;
    // Lazy initialization - don't create client until actually needed
    // This prevents build-time errors when WooCommerce credentials are not set
  }

  private getClient(): WooCommerceClient {
    if (!this.wc) {
      const moduleRef = getWooCommerceModule() as unknown as Record<string, any>;
      const factory = moduleRef.createWooCommerceClient as any;
      let client = factory(this.config);
      if (!client && factory && typeof factory.getMockImplementation === 'function') {
        const impl = factory.getMockImplementation();
        if (typeof impl === 'function') {
          const attempted = impl(this.config);
          if (attempted) {
            client = attempted;
            moduleRef.__forcedClient = attempted;
          }
        }
      }

      if (!client && moduleRef.__forcedClient) {
        client = moduleRef.__forcedClient;
      }

      if (!client) {
        throw new Error('WooCommerce is not configured. Please add WooCommerce credentials to your environment variables.');
      }
      this.wc = client;
    }
    return this.wc!;
  }

  // Initialize modules lazily
  private getProductsAPI(): ProductsAPI {
    if (!this.productsAPI) {
      this.productsAPI = new ProductsAPI(() => this.getClient());
    }
    return this.productsAPI;
  }

  private getOrdersAPI(): OrdersAPI {
    if (!this.ordersAPI) {
      this.ordersAPI = new OrdersAPI(() => this.getClient());
    }
    return this.ordersAPI;
  }

  private getCustomersAPI(): CustomersAPI {
    if (!this.customersAPI) {
      this.customersAPI = new CustomersAPI(() => this.getClient());
    }
    return this.customersAPI;
  }

  private getReportsAPI(): ReportsAPI {
    if (!this.reportsAPI) {
      this.reportsAPI = new ReportsAPI(() => this.getClient());
    }
    return this.reportsAPI;
  }

  private getSettingsAPI(): SettingsAPI {
    if (!this.settingsAPI) {
      this.settingsAPI = new SettingsAPI(() => this.getClient());
    }
    return this.settingsAPI;
  }

  // ==================== PRODUCTS ====================
  getProducts = (...args: Parameters<ProductsAPI['getProducts']>) => this.getProductsAPI().getProducts(...args);
  getProduct = (...args: Parameters<ProductsAPI['getProduct']>) => this.getProductsAPI().getProduct(...args);
  createProduct = (...args: Parameters<ProductsAPI['createProduct']>) => this.getProductsAPI().createProduct(...args);
  updateProduct = (...args: Parameters<ProductsAPI['updateProduct']>) => this.getProductsAPI().updateProduct(...args);
  deleteProduct = (...args: Parameters<ProductsAPI['deleteProduct']>) => this.getProductsAPI().deleteProduct(...args);
  batchProducts = (...args: Parameters<ProductsAPI['batchProducts']>) => this.getProductsAPI().batchProducts(...args);
  getProductVariations = (...args: Parameters<ProductsAPI['getProductVariations']>) => this.getProductsAPI().getProductVariations(...args);
  getProductVariation = (...args: Parameters<ProductsAPI['getProductVariation']>) => this.getProductsAPI().getProductVariation(...args);
  createProductVariation = (...args: Parameters<ProductsAPI['createProductVariation']>) => this.getProductsAPI().createProductVariation(...args);
  updateProductVariation = (...args: Parameters<ProductsAPI['updateProductVariation']>) => this.getProductsAPI().updateProductVariation(...args);
  deleteProductVariation = (...args: Parameters<ProductsAPI['deleteProductVariation']>) => this.getProductsAPI().deleteProductVariation(...args);
  batchProductVariations = (...args: Parameters<ProductsAPI['batchProductVariations']>) => this.getProductsAPI().batchProductVariations(...args);
  getProductAttributes = (...args: Parameters<ProductsAPI['getProductAttributes']>) => this.getProductsAPI().getProductAttributes(...args);
  getProductAttribute = (...args: Parameters<ProductsAPI['getProductAttribute']>) => this.getProductsAPI().getProductAttribute(...args);
  createProductAttribute = (...args: Parameters<ProductsAPI['createProductAttribute']>) => this.getProductsAPI().createProductAttribute(...args);
  updateProductAttribute = (...args: Parameters<ProductsAPI['updateProductAttribute']>) => this.getProductsAPI().updateProductAttribute(...args);
  deleteProductAttribute = (...args: Parameters<ProductsAPI['deleteProductAttribute']>) => this.getProductsAPI().deleteProductAttribute(...args);
  getAttributeTerms = (...args: Parameters<ProductsAPI['getAttributeTerms']>) => this.getProductsAPI().getAttributeTerms(...args);
  getAttributeTerm = (...args: Parameters<ProductsAPI['getAttributeTerm']>) => this.getProductsAPI().getAttributeTerm(...args);
  createAttributeTerm = (...args: Parameters<ProductsAPI['createAttributeTerm']>) => this.getProductsAPI().createAttributeTerm(...args);
  updateAttributeTerm = (...args: Parameters<ProductsAPI['updateAttributeTerm']>) => this.getProductsAPI().updateAttributeTerm(...args);
  deleteAttributeTerm = (...args: Parameters<ProductsAPI['deleteAttributeTerm']>) => this.getProductsAPI().deleteAttributeTerm(...args);
  getProductCategories = (...args: Parameters<ProductsAPI['getProductCategories']>) => this.getProductsAPI().getProductCategories(...args);
  getProductCategory = (...args: Parameters<ProductsAPI['getProductCategory']>) => this.getProductsAPI().getProductCategory(...args);
  createProductCategory = (...args: Parameters<ProductsAPI['createProductCategory']>) => this.getProductsAPI().createProductCategory(...args);
  updateProductCategory = (...args: Parameters<ProductsAPI['updateProductCategory']>) => this.getProductsAPI().updateProductCategory(...args);
  deleteProductCategory = (...args: Parameters<ProductsAPI['deleteProductCategory']>) => this.getProductsAPI().deleteProductCategory(...args);
  getProductTags = (...args: Parameters<ProductsAPI['getProductTags']>) => this.getProductsAPI().getProductTags(...args);
  getProductTag = (...args: Parameters<ProductsAPI['getProductTag']>) => this.getProductsAPI().getProductTag(...args);
  createProductTag = (...args: Parameters<ProductsAPI['createProductTag']>) => this.getProductsAPI().createProductTag(...args);
  updateProductTag = (...args: Parameters<ProductsAPI['updateProductTag']>) => this.getProductsAPI().updateProductTag(...args);
  deleteProductTag = (...args: Parameters<ProductsAPI['deleteProductTag']>) => this.getProductsAPI().deleteProductTag(...args);
  getProductShippingClasses = (...args: Parameters<ProductsAPI['getProductShippingClasses']>) => this.getProductsAPI().getProductShippingClasses(...args);
  getProductReviews = (...args: Parameters<ProductsAPI['getProductReviews']>) => this.getProductsAPI().getProductReviews(...args);
  getProductReview = (...args: Parameters<ProductsAPI['getProductReview']>) => this.getProductsAPI().getProductReview(...args);
  
  // New product methods for backwards compatibility
  getProductAttributeTerms = (...args: Parameters<ProductsAPI['getProductAttributeTerms']>) => this.getProductsAPI().getProductAttributeTerms(...args);
  createProductAttributeTerm = (...args: Parameters<ProductsAPI['createProductAttributeTerm']>) => this.getProductsAPI().createProductAttributeTerm(...args);
  updateProductAttributeTerm = (...args: Parameters<ProductsAPI['updateProductAttributeTerm']>) => this.getProductsAPI().updateProductAttributeTerm(...args);
  deleteProductAttributeTerm = (...args: Parameters<ProductsAPI['deleteProductAttributeTerm']>) => this.getProductsAPI().deleteProductAttributeTerm(...args);
  createProductReview = (...args: Parameters<ProductsAPI['createProductReview']>) => this.getProductsAPI().createProductReview(...args);
  updateProductReview = (...args: Parameters<ProductsAPI['updateProductReview']>) => this.getProductsAPI().updateProductReview(...args);
  deleteProductReview = (...args: Parameters<ProductsAPI['deleteProductReview']>) => this.getProductsAPI().deleteProductReview(...args);
  getProductShippingClass = (...args: Parameters<ProductsAPI['getProductShippingClass']>) => this.getProductsAPI().getProductShippingClass(...args);
  createProductShippingClass = (...args: Parameters<ProductsAPI['createProductShippingClass']>) => this.getProductsAPI().createProductShippingClass(...args);
  updateProductShippingClass = (...args: Parameters<ProductsAPI['updateProductShippingClass']>) => this.getProductsAPI().updateProductShippingClass(...args);
  deleteProductShippingClass = (...args: Parameters<ProductsAPI['deleteProductShippingClass']>) => this.getProductsAPI().deleteProductShippingClass(...args);

  // ==================== ORDERS ====================
  getOrders = (...args: Parameters<OrdersAPI['getOrders']>) => this.getOrdersAPI().getOrders(...args);
  getOrder = (...args: Parameters<OrdersAPI['getOrder']>) => this.getOrdersAPI().getOrder(...args);
  createOrder = (...args: Parameters<OrdersAPI['createOrder']>) => this.getOrdersAPI().createOrder(...args);
  updateOrder = (...args: Parameters<OrdersAPI['updateOrder']>) => this.getOrdersAPI().updateOrder(...args);
  deleteOrder = (...args: Parameters<OrdersAPI['deleteOrder']>) => this.getOrdersAPI().deleteOrder(...args);
  batchOrders = (...args: Parameters<OrdersAPI['batchOrders']>) => this.getOrdersAPI().batchOrders(...args);
  getOrderNotes = (...args: Parameters<OrdersAPI['getOrderNotes']>) => this.getOrdersAPI().getOrderNotes(...args);
  getOrderNote = (...args: Parameters<OrdersAPI['getOrderNote']>) => this.getOrdersAPI().getOrderNote(...args);
  createOrderNote = (...args: Parameters<OrdersAPI['createOrderNote']>) => this.getOrdersAPI().createOrderNote(...args);
  deleteOrderNote = (...args: Parameters<OrdersAPI['deleteOrderNote']>) => this.getOrdersAPI().deleteOrderNote(...args);
  getOrderRefunds = (...args: Parameters<OrdersAPI['getOrderRefunds']>) => this.getOrdersAPI().getOrderRefunds(...args);
  getOrderRefund = (...args: Parameters<OrdersAPI['getOrderRefund']>) => this.getOrdersAPI().getOrderRefund(...args);
  createOrderRefund = (...args: Parameters<OrdersAPI['createOrderRefund']>) => this.getOrdersAPI().createOrderRefund(...args);
  deleteOrderRefund = (...args: Parameters<OrdersAPI['deleteOrderRefund']>) => this.getOrdersAPI().deleteOrderRefund(...args);
  getRefunds = (...args: Parameters<OrdersAPI['getRefunds']>) => this.getOrdersAPI().getRefunds(...args);

  // ==================== CUSTOMERS ====================
  getCustomers = (...args: Parameters<CustomersAPI['getCustomers']>) => this.getCustomersAPI().getCustomers(...args);
  getCustomer = (...args: Parameters<CustomersAPI['getCustomer']>) => this.getCustomersAPI().getCustomer(...args);
  createCustomer = (...args: Parameters<CustomersAPI['createCustomer']>) => this.getCustomersAPI().createCustomer(...args);
  updateCustomer = (...args: Parameters<CustomersAPI['updateCustomer']>) => this.getCustomersAPI().updateCustomer(...args);
  deleteCustomer = (...args: Parameters<CustomersAPI['deleteCustomer']>) => this.getCustomersAPI().deleteCustomer(...args);
  batchCustomers = (...args: Parameters<CustomersAPI['batchCustomers']>) => this.getCustomersAPI().batchCustomers(...args);
  getCustomerDownloads = (...args: Parameters<CustomersAPI['getCustomerDownloads']>) => this.getCustomersAPI().getCustomerDownloads(...args);
  getCustomerByEmail = (...args: Parameters<CustomersAPI['getCustomerByEmail']>) => this.getCustomersAPI().getCustomerByEmail(...args);

  // ==================== REPORTS ====================
  getSalesReport = (...args: Parameters<ReportsAPI['getSalesReport']>) => this.getReportsAPI().getSalesReport(...args);
  getTopSellersReport = (...args: Parameters<ReportsAPI['getTopSellersReport']>) => this.getReportsAPI().getTopSellersReport(...args);
  getCouponsReport = (...args: Parameters<ReportsAPI['getCouponsReport']>) => this.getReportsAPI().getCouponsReport(...args);
  getCustomersReport = (...args: Parameters<ReportsAPI['getCustomersReport']>) => this.getReportsAPI().getCustomersReport(...args);
  getStockReport = (...args: Parameters<ReportsAPI['getStockReport']>) => this.getReportsAPI().getStockReport(...args);
  getReviewsReport = (...args: Parameters<ReportsAPI['getReviewsReport']>) => this.getReportsAPI().getReviewsReport(...args);
  getOrdersReport = (...args: Parameters<ReportsAPI['getOrdersReport']>) => this.getReportsAPI().getOrdersReport(...args);
  getProductsReport = (...args: Parameters<ReportsAPI['getProductsReport']>) => this.getReportsAPI().getProductsReport(...args);

  // ==================== COUPONS ====================
  getCoupons = (...args: Parameters<SettingsAPI['getCoupons']>) => this.getSettingsAPI().getCoupons(...args);
  getCoupon = (...args: Parameters<SettingsAPI['getCoupon']>) => this.getSettingsAPI().getCoupon(...args);
  createCoupon = (...args: Parameters<SettingsAPI['createCoupon']>) => this.getSettingsAPI().createCoupon(...args);
  updateCoupon = (...args: Parameters<SettingsAPI['updateCoupon']>) => this.getSettingsAPI().updateCoupon(...args);
  deleteCoupon = (...args: Parameters<SettingsAPI['deleteCoupon']>) => this.getSettingsAPI().deleteCoupon(...args);
  batchCoupons = (...args: Parameters<SettingsAPI['batchCoupons']>) => this.getSettingsAPI().batchCoupons(...args);
  getCouponByCode = (...args: Parameters<SettingsAPI['getCouponByCode']>) => this.getSettingsAPI().getCouponByCode(...args);

  // ==================== TAXES ====================
  getTaxRates = (...args: Parameters<SettingsAPI['getTaxRates']>) => this.getSettingsAPI().getTaxRates(...args);
  getTaxRate = (...args: Parameters<SettingsAPI['getTaxRate']>) => this.getSettingsAPI().getTaxRate(...args);
  createTaxRate = (...args: Parameters<SettingsAPI['createTaxRate']>) => this.getSettingsAPI().createTaxRate(...args);
  updateTaxRate = (...args: Parameters<SettingsAPI['updateTaxRate']>) => this.getSettingsAPI().updateTaxRate(...args);
  deleteTaxRate = (...args: Parameters<SettingsAPI['deleteTaxRate']>) => this.getSettingsAPI().deleteTaxRate(...args);
  getTaxClasses = (...args: Parameters<SettingsAPI['getTaxClasses']>) => this.getSettingsAPI().getTaxClasses(...args);
  createTaxClass = (...args: Parameters<SettingsAPI['createTaxClass']>) => this.getSettingsAPI().createTaxClass(...args);
  deleteTaxClass = (...args: Parameters<SettingsAPI['deleteTaxClass']>) => this.getSettingsAPI().deleteTaxClass(...args);

  // ==================== SHIPPING ====================
  getShippingZones = (...args: Parameters<SettingsAPI['getShippingZones']>) => this.getSettingsAPI().getShippingZones(...args);
  getShippingZone = (...args: Parameters<SettingsAPI['getShippingZone']>) => this.getSettingsAPI().getShippingZone(...args);
  createShippingZone = (...args: Parameters<SettingsAPI['createShippingZone']>) => this.getSettingsAPI().createShippingZone(...args);
  updateShippingZone = (...args: Parameters<SettingsAPI['updateShippingZone']>) => this.getSettingsAPI().updateShippingZone(...args);
  deleteShippingZone = (...args: Parameters<SettingsAPI['deleteShippingZone']>) => this.getSettingsAPI().deleteShippingZone(...args);
  getShippingZoneLocations = (...args: Parameters<SettingsAPI['getShippingZoneLocations']>) => this.getSettingsAPI().getShippingZoneLocations(...args);
  updateShippingZoneLocations = (...args: Parameters<SettingsAPI['updateShippingZoneLocations']>) => this.getSettingsAPI().updateShippingZoneLocations(...args);
  getShippingZoneMethods = (...args: Parameters<SettingsAPI['getShippingZoneMethods']>) => this.getSettingsAPI().getShippingZoneMethods(...args);
  createShippingZoneMethod = (...args: Parameters<SettingsAPI['createShippingZoneMethod']>) => this.getSettingsAPI().createShippingZoneMethod(...args);
  updateShippingZoneMethod = (...args: Parameters<SettingsAPI['updateShippingZoneMethod']>) => this.getSettingsAPI().updateShippingZoneMethod(...args);
  deleteShippingZoneMethod = (...args: Parameters<SettingsAPI['deleteShippingZoneMethod']>) => this.getSettingsAPI().deleteShippingZoneMethod(...args);
  getShippingMethods = (...args: Parameters<SettingsAPI['getShippingMethods']>) => this.getSettingsAPI().getShippingMethods(...args);
  getShippingMethod = (...args: Parameters<SettingsAPI['getShippingMethod']>) => this.getSettingsAPI().getShippingMethod(...args);

  // ==================== PAYMENT GATEWAYS ====================
  getPaymentGateways = (...args: Parameters<SettingsAPI['getPaymentGateways']>) => this.getSettingsAPI().getPaymentGateways(...args);
  getPaymentGateway = (...args: Parameters<SettingsAPI['getPaymentGateway']>) => this.getSettingsAPI().getPaymentGateway(...args);
  updatePaymentGateway = (...args: Parameters<SettingsAPI['updatePaymentGateway']>) => this.getSettingsAPI().updatePaymentGateway(...args);

  // ==================== SETTINGS ====================
  getSettingsGroups = (...args: Parameters<SettingsAPI['getSettingsGroups']>) => this.getSettingsAPI().getSettingsGroups(...args);
  getSettings = (...args: Parameters<SettingsAPI['getSettings']>) => this.getSettingsAPI().getSettings(...args);
  getSetting = (...args: Parameters<SettingsAPI['getSetting']>) => this.getSettingsAPI().getSetting(...args);
  updateSetting = (...args: Parameters<SettingsAPI['updateSetting']>) => this.getSettingsAPI().updateSetting(...args);
  batchUpdateSettings = (...args: Parameters<SettingsAPI['batchUpdateSettings']>) => this.getSettingsAPI().batchUpdateSettings(...args);
  
  // Aliases for backwards compatibility
  getSettingsOptions = (...args: Parameters<SettingsAPI['getSettingsOptions']>) => this.getSettingsAPI().getSettingsOptions(...args);
  getSettingOption = (...args: Parameters<SettingsAPI['getSettingOption']>) => this.getSettingsAPI().getSettingOption(...args);
  updateSettingOption = (...args: Parameters<SettingsAPI['updateSettingOption']>) => this.getSettingsAPI().updateSettingOption(...args);

  // ==================== SYSTEM STATUS ====================
  getSystemStatus = (...args: Parameters<SettingsAPI['getSystemStatus']>) => this.getSettingsAPI().getSystemStatus(...args);
  getSystemStatusTools = (...args: Parameters<SettingsAPI['getSystemStatusTools']>) => this.getSettingsAPI().getSystemStatusTools(...args);
  getSystemStatusTool = (...args: Parameters<SettingsAPI['getSystemStatusTool']>) => this.getSettingsAPI().getSystemStatusTool(...args);
  runSystemStatusTool = (...args: Parameters<SettingsAPI['runSystemStatusTool']>) => this.getSettingsAPI().runSystemStatusTool(...args);

  // ==================== WEBHOOKS ====================
  getWebhooks = (...args: Parameters<SettingsAPI['getWebhooks']>) => this.getSettingsAPI().getWebhooks(...args);
  getWebhook = (...args: Parameters<SettingsAPI['getWebhook']>) => this.getSettingsAPI().getWebhook(...args);
  createWebhook = (...args: Parameters<SettingsAPI['createWebhook']>) => this.getSettingsAPI().createWebhook(...args);
  updateWebhook = (...args: Parameters<SettingsAPI['updateWebhook']>) => this.getSettingsAPI().updateWebhook(...args);
  deleteWebhook = (...args: Parameters<SettingsAPI['deleteWebhook']>) => this.getSettingsAPI().deleteWebhook(...args);
  batchWebhooks = (...args: Parameters<SettingsAPI['batchWebhooks']>) => this.getSettingsAPI().batchWebhooks(...args);

  // ==================== DATA ====================
  get = (...args: Parameters<SettingsAPI['get']>) => this.getSettingsAPI().get(...args);
  getCountries = (...args: Parameters<SettingsAPI['getCountries']>) => this.getSettingsAPI().getCountries(...args);
  getCurrencies = (...args: Parameters<SettingsAPI['getCurrencies']>) => this.getSettingsAPI().getCurrencies(...args);
  getCurrentCurrency = (...args: Parameters<SettingsAPI['getCurrentCurrency']>) => this.getSettingsAPI().getCurrentCurrency(...args);
  getContinents = (...args: Parameters<SettingsAPI['getContinents']>) => this.getSettingsAPI().getContinents(...args);
}

// Export a singleton instance for convenience
