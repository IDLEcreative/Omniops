/**
 * Add to cart (informational mode)
 * Provides product details and "add to cart" link for customer to complete action
 * Works with or without WooCommerce API client (graceful degradation)
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  AddToCartInfo
} from './types';
import { getCurrencySymbol } from '../currency-utils';

export async function addToCartInformational(
  wc: any | null,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    if (!params.productId) {
      return {
        success: false,
        data: null,
        message: "Product ID is required to add to cart"
      };
    }

    const quantity = params.quantity || 1;
    const domain = params.domain || 'store';
    const addToCartUrl = `https://${domain}/?add-to-cart=${params.productId}&quantity=${quantity}`;

    // If WooCommerce client available, fetch product details and validate
    if (wc) {
      try {
        const product = await wc.getProduct(params.productId);

        if (!product) {
          return {
            success: false,
            data: null,
            message: `Product #${params.productId} not found`
          };
        }

        // Check stock availability
        if (product.stock_status !== 'instock') {
          return {
            success: false,
            data: null,
            message: `${product.name} is currently out of stock`
          };
        }

        // Check if requested quantity is available
        if (product.stock_quantity !== null && quantity > product.stock_quantity) {
          return {
            success: false,
            data: null,
            message: `Only ${product.stock_quantity} units of ${product.name} available (you requested ${quantity})`
          };
        }

        // Calculate total
        const itemPrice = parseFloat(product.price);
        const itemTotal = itemPrice * quantity;
        const currencySymbol = getCurrencySymbol(params);

        let message = `🛒 Ready to Add to Cart\n\n`;
        message += `Product: ${product.name}\n`;
        message += `Price: ${currencySymbol}${product.price} each\n`;
        message += `Quantity: ${quantity}\n`;
        message += `Total: ${currencySymbol}${itemTotal.toFixed(2)}\n\n`;

        if (product.on_sale && product.sale_price) {
          message += `💰 SALE! Regular price: ${currencySymbol}${product.regular_price}\n\n`;
        }

        message += `📦 Stock: ${product.stock_quantity !== null ? `${product.stock_quantity} available` : 'In stock'}\n\n`;
        message += `To add this to your cart, please click here:\n`;
        message += `${addToCartUrl}\n\n`;
        message += `Or I can help you find more products!`;

        const cartData: AddToCartInfo = {
          productId: product.id,
          productName: product.name,
          quantity,
          price: product.price,
          total: itemTotal.toFixed(2),
          addToCartUrl,
          inStock: true,
          stockQuantity: product.stock_quantity
        };

        return {
          success: true,
          data: cartData,
          message
        };
      } catch (error) {
        console.warn('[WooCommerce Agent] Product validation failed, proceeding with basic URL:', error);
        // Fall through to basic mode if product fetch fails
      }
    }

    // Fallback mode: Generate add-to-cart URL without validation
    // This works when WooCommerce API is unavailable
    let message = `🛒 Ready to Add to Cart\n\n`;
    message += `Product ID: ${params.productId}\n`;
    message += `Quantity: ${quantity}\n\n`;
    message += `To add this to your cart, please click here:\n`;
    message += `${addToCartUrl}\n\n`;
    message += `Or I can help you find more products!`;

    const cartData: AddToCartInfo = {
      productId: parseInt(params.productId),
      productName: `Product #${params.productId}`,
      quantity,
      price: '0',
      total: '0',
      addToCartUrl,
      inStock: true,
      stockQuantity: null
    };

    return {
      success: true,
      data: cartData,
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Add to cart error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to prepare add to cart"
    };
  }
}
