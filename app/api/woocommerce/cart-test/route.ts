/**
 * WooCommerce Store API Test Endpoint
 *
 * Test endpoint for demonstrating direct cart manipulation
 * via WooCommerce Store API.
 *
 * This endpoint shows how to:
 * 1. Add items directly to cart (no URL redirect)
 * 2. Update quantities in real-time
 * 3. Apply coupons programmatically
 * 4. Get cart totals and contents
 *
 * Usage:
 * POST /api/woocommerce/cart-test
 * Body: {
 *   domain: "store.com",
 *   action: "add" | "get" | "update" | "remove" | "apply_coupon",
 *   productId?: 123,
 *   quantity?: 2,
 *   cartItemKey?: "abc123",
 *   couponCode?: "SAVE10"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDynamicStoreAPIClient } from '@/lib/woocommerce-dynamic';
import { z } from 'zod';

// Request validation schema
const requestSchema = z.object({
  domain: z.string(),
  action: z.enum(['add', 'get', 'update', 'remove', 'apply_coupon']),
  productId: z.number().optional(),
  quantity: z.number().min(1).optional(),
  cartItemKey: z.string().optional(),
  couponCode: z.string().optional(),
  userId: z.string().optional(), // Optional user ID for session
});

export async function POST(req: NextRequest) {
  try {
    // Check if Store API is enabled
    const isEnabled = process.env.WOOCOMMERCE_STORE_API_ENABLED === 'true';

    if (!isEnabled) {
      return NextResponse.json({
        success: false,
        message: 'Store API is not enabled. Set WOOCOMMERCE_STORE_API_ENABLED=true in your environment variables to enable direct cart manipulation.',
        mode: 'informational',
      });
    }

    // Parse and validate request
    const body = await req.json();
    const validated = requestSchema.parse(body);

    // Get Store API client with session management
    const storeAPI = await getDynamicStoreAPIClient(
      validated.domain,
      validated.userId // Will generate guest ID if not provided
    );

    if (!storeAPI) {
      return NextResponse.json({
        success: false,
        message: `Store API client could not be initialized for domain: ${validated.domain}. Make sure WooCommerce Store API is configured for this domain.`,
      });
    }

    // Check if Store API is available
    const isAvailable = await storeAPI.isAvailable();
    if (!isAvailable) {
      return NextResponse.json({
        success: false,
        message: 'Store API is not responding. Make sure WooCommerce Store API is enabled on the target store.',
      });
    }

    // Perform the requested action
    let result;

    switch (validated.action) {
      case 'add':
        if (!validated.productId) {
          return NextResponse.json({
            success: false,
            message: 'Product ID is required for add action',
          });
        }

        result = await storeAPI.addItem(
          validated.productId,
          validated.quantity || 1
        );

        return NextResponse.json({
          success: result.success,
          message: result.success
            ? `Successfully added ${validated.quantity || 1} item(s) to cart`
            : result.error?.message || 'Failed to add item to cart',
          cart: result.data,
          mode: 'transactional',
        });

      case 'get':
        result = await storeAPI.getCart();

        return NextResponse.json({
          success: result.success,
          message: result.success
            ? 'Cart retrieved successfully'
            : result.error?.message || 'Failed to retrieve cart',
          cart: result.data,
          mode: 'transactional',
        });

      case 'update':
        if (!validated.cartItemKey || !validated.quantity) {
          return NextResponse.json({
            success: false,
            message: 'Cart item key and quantity are required for update action',
          });
        }

        result = await storeAPI.updateItem(
          validated.cartItemKey,
          validated.quantity
        );

        return NextResponse.json({
          success: result.success,
          message: result.success
            ? `Successfully updated quantity to ${validated.quantity}`
            : result.error?.message || 'Failed to update cart',
          cart: result.data,
          mode: 'transactional',
        });

      case 'remove':
        if (!validated.cartItemKey) {
          return NextResponse.json({
            success: false,
            message: 'Cart item key is required for remove action',
          });
        }

        result = await storeAPI.removeItem(validated.cartItemKey);

        return NextResponse.json({
          success: result.success,
          message: result.success
            ? 'Item removed from cart successfully'
            : result.error?.message || 'Failed to remove item',
          cart: result.data,
          mode: 'transactional',
        });

      case 'apply_coupon':
        if (!validated.couponCode) {
          return NextResponse.json({
            success: false,
            message: 'Coupon code is required for apply_coupon action',
          });
        }

        result = await storeAPI.applyCoupon(validated.couponCode);

        return NextResponse.json({
          success: result.success,
          message: result.success
            ? `Coupon "${validated.couponCode}" applied successfully`
            : result.error?.message || 'Failed to apply coupon',
          cart: result.data,
          mode: 'transactional',
        });

      default:
        return NextResponse.json({
          success: false,
          message: `Unknown action: ${validated.action}`,
        });
    }
  } catch (error) {
    console.error('[Cart Test API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

// GET endpoint to check Store API status
export async function GET(req: NextRequest) {
  const isEnabled = process.env.WOOCOMMERCE_STORE_API_ENABLED === 'true';

  return NextResponse.json({
    enabled: isEnabled,
    mode: isEnabled ? 'transactional' : 'informational',
    message: isEnabled
      ? 'Store API is enabled for direct cart manipulation'
      : 'Store API is disabled. Cart operations use informational mode (URLs only)',
    configuration: {
      WOOCOMMERCE_STORE_API_ENABLED: process.env.WOOCOMMERCE_STORE_API_ENABLED || 'false',
      hasRedis: !!process.env.REDIS_URL,
    },
    instructions: {
      enable: 'Set WOOCOMMERCE_STORE_API_ENABLED=true in your .env.local file',
      test: 'POST to this endpoint with action and parameters to test cart operations',
      example: {
        domain: 'your-store.com',
        action: 'add',
        productId: 123,
        quantity: 2,
      },
    },
  });
}