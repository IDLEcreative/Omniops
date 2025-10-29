/**
 * WooCommerce Tool Formatters
 * Response formatting functions for WooCommerce operations
 */

import type { StockInfo, OrderInfo, OrderItem, PriceInfo } from './woocommerce-tool-types';
import { getCurrencySymbol } from './currency-utils';

/**
 * Format stock information into a human-readable message
 */
export function formatStockMessage(product: any, includeQuantity: boolean): string {
  let message = `${product.name}: `;

  if (product.stock_status === 'instock') {
    message += '✓ Currently in stock';
    if (includeQuantity && product.stock_quantity !== null && product.stock_quantity !== undefined) {
      message += ` (${product.stock_quantity} units available)`;
    }
  } else if (product.stock_status === 'outofstock') {
    message += '✗ Currently out of stock';
  } else if (product.stock_status === 'onbackorder') {
    message += '⏳ Available on backorder';
  }

  return message;
}

/**
 * Extract stock information from product data
 */
export function extractStockInfo(product: any, includeQuantity: boolean): StockInfo {
  return {
    productName: product.name,
    sku: product.sku,
    stockStatus: product.stock_status,
    stockQuantity: includeQuantity ? product.stock_quantity : undefined,
    manageStock: product.manage_stock,
    backorders: product.backorders,
    price: product.price || product.regular_price,
    onSale: product.on_sale,
    salePrice: product.sale_price
  };
}

/**
 * Format order information into a human-readable message
 */
export function formatOrderMessage(orderInfo: OrderInfo): string {
  const itemsList = orderInfo.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
  let message = `Order #${orderInfo.number} - Status: ${orderInfo.status}\n`;
  message += `Date: ${orderInfo.date}\n`;
  message += `Total: ${orderInfo.currency}${orderInfo.total}\n`;
  message += `Items: ${itemsList}\n`;
  if (orderInfo.billing) {
    message += `Customer: ${orderInfo.billing.firstName} ${orderInfo.billing.lastName}`;
  }
  if (orderInfo.trackingNumber) {
    message += `\nTracking: ${orderInfo.trackingNumber}`;
  }
  return message;
}

/**
 * Extract order information from order data
 */
export function extractOrderInfo(order: any): OrderInfo {
  return {
    id: order.id,
    number: order.number || order.id.toString(),
    status: order.status,
    date: order.date_created,
    total: order.total,
    currency: (order as any).currency_symbol || order.currency || '$',
    items: order.line_items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      total: item.total
    })) || [],
    billing: order.billing ? {
      firstName: order.billing.first_name,
      lastName: order.billing.last_name,
      email: order.billing.email
    } : null,
    shipping: order.shipping,
    trackingNumber: (order.shipping as any)?.tracking_number || null,
    permalink: (order as any).permalink || null
  };
}

/**
 * Format price information into a human-readable message
 */
export function formatPriceMessage(product: any, params?: any): string {
  const currencySymbol = params ? getCurrencySymbol(params) : '$';
  let message = `${product.name}: ${currencySymbol}${product.price || product.regular_price}`;
  if (product.on_sale && product.sale_price) {
    message += ` (On sale! Was ${currencySymbol}${product.regular_price})`;
  }
  return message;
}

/**
 * Extract price information from product data
 */
export function extractPriceInfo(product: any): PriceInfo {
  return {
    regularPrice: product.regular_price,
    salePrice: product.sale_price,
    currentPrice: product.price,
    onSale: product.on_sale,
    currency: 'GBP' // This should come from store settings
  };
}

/**
 * Helper to format WooCommerce data for AI consumption
 */
export function formatWooCommerceResponse(result: any): string {
  if (!result.success) {
    return `Error: ${result.message}`;
  }

  if (result.data) {
    return JSON.stringify({
      status: 'success',
      message: result.message,
      data: result.data
    }, null, 2);
  }

  return result.message;
}
