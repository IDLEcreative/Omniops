/**
 * WooCommerce Proxy Route Handlers
 *
 * Path-based routing logic for all WooCommerce API endpoints
 * Handles GET, POST, PUT, and DELETE operations
 */

import { WooCommerceAPI } from '@/lib/woocommerce-api';
import type { SettingUpdateData, ShippingZoneLocation } from '@/lib/woocommerce-types';
import { matchPath, parsePathInt } from './utils';

/**
 * Route GET requests to appropriate WooCommerce API methods
 */
export async function routeGetRequest(
  path: string,
  pathParts: string[],
  searchParams: Record<string, string>,
  wc: WooCommerceAPI
): Promise<unknown> {
  // Products
  if (path === 'products') return wc.getProducts(searchParams);
  if (matchPath(path, /^products\/\d+$/)) return wc.getProduct(parsePathInt(pathParts[1]));
  if (matchPath(path, /^products\/\d+\/variations$/)) return wc.getProductVariations(parsePathInt(pathParts[1]), searchParams);
  if (matchPath(path, /^products\/\d+\/variations\/\d+$/)) return wc.getProductVariation(parsePathInt(pathParts[1]), parsePathInt(pathParts[3]));
  if (path === 'products/attributes') return wc.getProductAttributes(searchParams);
  if (matchPath(path, /^products\/attributes\/\d+$/)) return wc.getProductAttribute(parsePathInt(pathParts[2]));
  if (matchPath(path, /^products\/attributes\/\d+\/terms$/)) return wc.getProductAttributeTerms(parsePathInt(pathParts[2]), searchParams);
  if (path === 'products/categories') return wc.getProductCategories(searchParams);
  if (matchPath(path, /^products\/categories\/\d+$/)) return wc.getProductCategory(parsePathInt(pathParts[2]));
  if (path === 'products/tags') return wc.getProductTags(searchParams);
  if (matchPath(path, /^products\/tags\/\d+$/)) return wc.getProductTag(parsePathInt(pathParts[2]));
  if (path === 'products/reviews') return wc.getProductReviews(searchParams);
  if (path === 'products/shipping_classes') return wc.getProductShippingClasses(searchParams);

  // Orders
  if (path === 'orders') return wc.getOrders(searchParams);
  if (matchPath(path, /^orders\/\d+$/)) return wc.getOrder(parsePathInt(pathParts[1]));
  if (matchPath(path, /^orders\/\d+\/notes$/)) return wc.getOrderNotes(parsePathInt(pathParts[1]), searchParams);
  if (matchPath(path, /^orders\/\d+\/refunds$/)) return wc.getOrderRefunds(parsePathInt(pathParts[1]), searchParams);
  if (path === 'refunds') return wc.getRefunds(searchParams);

  // Customers
  if (path === 'customers') return wc.getCustomers(searchParams);
  if (matchPath(path, /^customers\/\d+$/)) return wc.getCustomer(parsePathInt(pathParts[1]));
  if (matchPath(path, /^customers\/\d+\/downloads$/)) return wc.getCustomerDownloads(parsePathInt(pathParts[1]));
  if (path === 'customers/email' && searchParams.email) return wc.getCustomerByEmail(searchParams.email);

  // Coupons
  if (path === 'coupons') return wc.getCoupons(searchParams);
  if (matchPath(path, /^coupons\/\d+$/)) return wc.getCoupon(parsePathInt(pathParts[1]));
  if (path === 'coupons/code' && searchParams.code) return wc.getCouponByCode(searchParams.code);

  // Reports
  if (path === 'reports/sales') return wc.getSalesReport(searchParams);
  if (path === 'reports/top_sellers') return wc.getTopSellersReport(searchParams);
  if (path === 'reports/coupons') return wc.getCouponsReport(searchParams);
  if (path === 'reports/customers') return wc.getCustomersReport(searchParams);
  if (path === 'reports/orders') return wc.getOrdersReport(searchParams);
  if (path === 'reports/products') return wc.getProductsReport(searchParams);
  if (path === 'reports/reviews') return wc.getReviewsReport(searchParams);

  // Taxes
  if (path === 'taxes') return wc.getTaxRates(searchParams);
  if (matchPath(path, /^taxes\/\d+$/)) return wc.getTaxRate(parsePathInt(pathParts[1]));
  if (path === 'taxes/classes') return wc.getTaxClasses();

  // Shipping
  if (path === 'shipping/zones') return wc.getShippingZones();
  if (matchPath(path, /^shipping\/zones\/\d+$/)) return wc.getShippingZone(parsePathInt(pathParts[2]));
  if (matchPath(path, /^shipping\/zones\/\d+\/locations$/)) return wc.getShippingZoneLocations(parsePathInt(pathParts[2]));
  if (matchPath(path, /^shipping\/zones\/\d+\/methods$/)) return wc.getShippingZoneMethods(parsePathInt(pathParts[2]));
  if (path === 'shipping_methods') return wc.getShippingMethods();

  // Payment Gateways
  if (path === 'payment_gateways') return wc.getPaymentGateways();
  if (matchPath(path, /^payment_gateways\/[\w-]+$/)) return wc.getPaymentGateway(pathParts[1] || '');

  // Settings
  if (path === 'settings') return wc.getSettingsGroups();
  if (matchPath(path, /^settings\/[\w-]+$/)) return wc.getSettingsOptions(pathParts[1] || '');
  if (matchPath(path, /^settings\/[\w-]+\/[\w-]+$/)) {
    return wc.getSettingOption(pathParts[1] || '', pathParts[2] || '');
  }

  // System Status
  if (path === 'system_status') return wc.getSystemStatus();
  if (path === 'system_status/tools') return wc.getSystemStatusTools();
  if (matchPath(path, /^system_status\/tools\/[\w-]+$/)) return wc.getSystemStatusTool(pathParts[2] || '');

  // Webhooks
  if (path === 'webhooks') return wc.getWebhooks(searchParams);
  if (matchPath(path, /^webhooks\/\d+$/)) return wc.getWebhook(parsePathInt(pathParts[1]));

  // Data
  if (path === 'data/countries') return wc.getCountries();
  if (path === 'data/currencies') return wc.getCurrencies();
  if (path === 'data/currencies/current') return wc.getCurrentCurrency();
  if (path === 'data/continents') return wc.getContinents();

  // No matching route
  return null;
}

/**
 * Route POST requests to appropriate WooCommerce API methods
 */
export async function routePostRequest(
  path: string,
  pathParts: string[],
  body: Record<string, unknown>,
  wc: WooCommerceAPI
): Promise<unknown> {
  // Products
  if (path === 'products') return wc.createProduct(body);
  if (path === 'products/batch') return wc.batchProducts(body);
  if (matchPath(path, /^products\/\d+\/variations$/)) return wc.createProductVariation(parsePathInt(pathParts[1]), body);
  if (matchPath(path, /^products\/\d+\/variations\/batch$/)) return wc.batchProductVariations(parsePathInt(pathParts[1]), body);
  if (path === 'products/attributes') return wc.createProductAttribute(body);
  if (matchPath(path, /^products\/attributes\/\d+\/terms$/)) return wc.createProductAttributeTerm(parsePathInt(pathParts[2]), body);
  if (path === 'products/categories') return wc.createProductCategory(body);
  if (path === 'products/tags') return wc.createProductTag(body);
  if (path === 'products/reviews') return wc.createProductReview(body);
  if (path === 'products/shipping_classes') return wc.createProductShippingClass(body);

  // Orders
  if (path === 'orders') return wc.createOrder(body);
  if (path === 'orders/batch') return wc.batchOrders(body);
  if (matchPath(path, /^orders\/\d+\/notes$/)) return wc.createOrderNote(parsePathInt(pathParts[1]), body);
  if (matchPath(path, /^orders\/\d+\/refunds$/)) return wc.createOrderRefund(parsePathInt(pathParts[1]), body);

  // Customers
  if (path === 'customers') return wc.createCustomer(body);
  if (path === 'customers/batch') return wc.batchCustomers(body);

  // Coupons
  if (path === 'coupons') return wc.createCoupon(body);
  if (path === 'coupons/batch') return wc.batchCoupons(body);

  // Taxes
  if (path === 'taxes') return wc.createTaxRate(body);
  if (path === 'taxes/classes') return wc.createTaxClass(body);

  // Shipping
  if (path === 'shipping/zones') return wc.createShippingZone(body);
  if (matchPath(path, /^shipping\/zones\/\d+\/methods$/)) return wc.createShippingZoneMethod(parsePathInt(pathParts[2]), body);

  // Settings
  if (matchPath(path, /^settings\/[\w-]+\/batch$/)) {
    const update = (body as { update?: SettingUpdateData[] }).update || [];
    return wc.batchUpdateSettings(pathParts[1] || '', update);
  }

  // Webhooks
  if (path === 'webhooks') return wc.createWebhook(body);
  if (path === 'webhooks/batch') return wc.batchWebhooks(body);

  // No matching route
  return null;
}

/**
 * Route PUT requests to appropriate WooCommerce API methods
 */
export async function routePutRequest(
  path: string,
  pathParts: string[],
  body: Record<string, unknown>,
  wc: WooCommerceAPI
): Promise<unknown> {
  // Products
  if (matchPath(path, /^products\/\d+$/)) return wc.updateProduct(parsePathInt(pathParts[1]), body);
  if (matchPath(path, /^products\/\d+\/variations\/\d+$/)) {
    return wc.updateProductVariation(parsePathInt(pathParts[1]), parsePathInt(pathParts[3]), body);
  }
  if (matchPath(path, /^products\/attributes\/\d+$/)) return wc.updateProductAttribute(parsePathInt(pathParts[2]), body);
  if (matchPath(path, /^products\/attributes\/\d+\/terms\/\d+$/)) {
    return wc.updateProductAttributeTerm(parsePathInt(pathParts[2]), parsePathInt(pathParts[4]), body);
  }
  if (matchPath(path, /^products\/categories\/\d+$/)) return wc.updateProductCategory(parsePathInt(pathParts[2]), body);
  if (matchPath(path, /^products\/tags\/\d+$/)) return wc.updateProductTag(parsePathInt(pathParts[2]), body);
  if (matchPath(path, /^products\/reviews\/\d+$/)) return wc.updateProductReview(parsePathInt(pathParts[2]), body);
  if (matchPath(path, /^products\/shipping_classes\/\d+$/)) return wc.updateProductShippingClass(parsePathInt(pathParts[2]), body);

  // Orders
  if (matchPath(path, /^orders\/\d+$/)) return wc.updateOrder(parsePathInt(pathParts[1]), body);

  // Customers
  if (matchPath(path, /^customers\/\d+$/)) return wc.updateCustomer(parsePathInt(pathParts[1]), body);

  // Coupons
  if (matchPath(path, /^coupons\/\d+$/)) return wc.updateCoupon(parsePathInt(pathParts[1]), body);

  // Taxes
  if (matchPath(path, /^taxes\/\d+$/)) return wc.updateTaxRate(parsePathInt(pathParts[1]), body);

  // Shipping
  if (matchPath(path, /^shipping\/zones\/\d+$/)) return wc.updateShippingZone(parsePathInt(pathParts[2]), body);
  if (matchPath(path, /^shipping\/zones\/\d+\/locations$/)) {
    return wc.updateShippingZoneLocations(parsePathInt(pathParts[2]), body as unknown as ShippingZoneLocation[]);
  }
  if (matchPath(path, /^shipping\/zones\/\d+\/methods\/\d+$/)) {
    return wc.updateShippingZoneMethod(parsePathInt(pathParts[2]), parsePathInt(pathParts[4]), body);
  }

  // Payment Gateways
  if (matchPath(path, /^payment_gateways\/[\w-]+$/)) return wc.updatePaymentGateway(pathParts[1] || '', body);

  // Settings
  if (matchPath(path, /^settings\/[\w-]+\/[\w-]+$/)) {
    const value = (body as { value?: unknown }).value;
    return wc.updateSettingOption(pathParts[1] || '', pathParts[2] || '', value);
  }

  // System Status Tools
  if (matchPath(path, /^system_status\/tools\/[\w-]+$/)) return wc.runSystemStatusTool(pathParts[2] || '');

  // Webhooks
  if (matchPath(path, /^webhooks\/\d+$/)) return wc.updateWebhook(parsePathInt(pathParts[1]), body);

  // No matching route
  return null;
}

/**
 * Route DELETE requests to appropriate WooCommerce API methods
 */
export async function routeDeleteRequest(
  path: string,
  pathParts: string[],
  force: boolean,
  wc: WooCommerceAPI
): Promise<unknown> {
  // Products
  if (matchPath(path, /^products\/\d+$/)) return wc.deleteProduct(parsePathInt(pathParts[1]), force);
  if (matchPath(path, /^products\/\d+\/variations\/\d+$/)) {
    return wc.deleteProductVariation(parsePathInt(pathParts[1]), parsePathInt(pathParts[3]), force);
  }
  if (matchPath(path, /^products\/attributes\/\d+$/)) return wc.deleteProductAttribute(parsePathInt(pathParts[2]), force);
  if (matchPath(path, /^products\/attributes\/\d+\/terms\/\d+$/)) {
    return wc.deleteProductAttributeTerm(parsePathInt(pathParts[2]), parsePathInt(pathParts[4]), force);
  }
  if (matchPath(path, /^products\/categories\/\d+$/)) return wc.deleteProductCategory(parsePathInt(pathParts[2]), force);
  if (matchPath(path, /^products\/tags\/\d+$/)) return wc.deleteProductTag(parsePathInt(pathParts[2]), force);
  if (matchPath(path, /^products\/reviews\/\d+$/)) return wc.deleteProductReview(parsePathInt(pathParts[2]), force);
  if (matchPath(path, /^products\/shipping_classes\/\d+$/)) return wc.deleteProductShippingClass(parsePathInt(pathParts[2]), force);

  // Orders
  if (matchPath(path, /^orders\/\d+$/)) return wc.deleteOrder(parsePathInt(pathParts[1]), force);
  if (matchPath(path, /^orders\/\d+\/notes\/\d+$/)) {
    return wc.deleteOrderNote(parsePathInt(pathParts[1]), parsePathInt(pathParts[3]), force);
  }
  if (matchPath(path, /^orders\/\d+\/refunds\/\d+$/)) {
    return wc.deleteOrderRefund(parsePathInt(pathParts[1]), parsePathInt(pathParts[3]), force);
  }

  // Customers
  if (matchPath(path, /^customers\/\d+$/)) return wc.deleteCustomer(parsePathInt(pathParts[1]), force);

  // Coupons
  if (matchPath(path, /^coupons\/\d+$/)) return wc.deleteCoupon(parsePathInt(pathParts[1]), force);

  // Taxes
  if (matchPath(path, /^taxes\/\d+$/)) return wc.deleteTaxRate(parsePathInt(pathParts[1]), force);
  if (matchPath(path, /^taxes\/classes\/[\w-]+$/)) return wc.deleteTaxClass(pathParts[2] || '', force);

  // Shipping
  if (matchPath(path, /^shipping\/zones\/\d+$/)) return wc.deleteShippingZone(parsePathInt(pathParts[2]), force);
  if (matchPath(path, /^shipping\/zones\/\d+\/methods\/\d+$/)) {
    return wc.deleteShippingZoneMethod(parsePathInt(pathParts[2]), parsePathInt(pathParts[4]), force);
  }

  // Webhooks
  if (matchPath(path, /^webhooks\/\d+$/)) return wc.deleteWebhook(parsePathInt(pathParts[1]), force);

  // No matching route
  return null;
}
