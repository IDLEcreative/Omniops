import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createWooCommerceCustomerActions,
  WooCommerceOrderActions
} from '@/lib/woocommerce-customer-actions';
import { CustomerVerification } from '@/lib/customer-verification';

// Request validation
const CustomerActionSchema = z.object({
  action: z.enum([
    'get-info',
    'get-order-status',
    'get-recent-orders',
    'get-tracking',
    'update-address',
    'cancel-order'
  ]),
  conversationId: z.string(),
  domain: z.string(),
  data: z.object({
    orderNumber: z.string().optional(),
    address: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().optional(),
      address_2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional(),
    }).optional(),
    reason: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, conversationId, domain, data } = CustomerActionSchema.parse(body);

    // Check if customer is verified
    const verificationStatus = await CustomerVerification.checkVerificationStatus(conversationId);
    
    if (!verificationStatus.isVerified || !verificationStatus.customerEmail) {
      return NextResponse.json({
        success: false,
        message: 'Customer verification required',
        requiresVerification: true
      }, { status: 401 });
    }

    const email = verificationStatus.customerEmail;
    let result;

    switch (action) {
      case 'get-info': {
        // Create instance with dependency injection
        const customerActions = await createWooCommerceCustomerActions(domain);
        if (!customerActions) {
          return NextResponse.json({
            success: false,
            message: 'WooCommerce not configured for this domain'
          }, { status: 400 });
        }
        result = await customerActions.getCustomerInfo(email);
        break;
      }

      case 'get-order-status':
        if (!data?.orderNumber) {
          return NextResponse.json({
            success: false,
            message: 'Order number is required'
          }, { status: 400 });
        }
        result = await WooCommerceOrderActions.getOrderStatus(
          data.orderNumber,
          email,
          domain
        );
        break;

      case 'get-recent-orders':
        result = await WooCommerceOrderActions.getRecentOrders(email, domain);
        break;

      case 'get-tracking':
        if (!data?.orderNumber) {
          return NextResponse.json({
            success: false,
            message: 'Order number is required'
          }, { status: 400 });
        }
        result = await WooCommerceOrderActions.getOrderTracking(
          data.orderNumber,
          email,
          domain
        );
        break;

      case 'update-address': {
        if (!data?.address) {
          return NextResponse.json({
            success: false,
            message: 'Address information is required'
          }, { status: 400 });
        }
        // Create instance with dependency injection
        const customerActions = await createWooCommerceCustomerActions(domain);
        if (!customerActions) {
          return NextResponse.json({
            success: false,
            message: 'WooCommerce not configured for this domain'
          }, { status: 400 });
        }
        result = await customerActions.updateShippingAddress(email, data.address);
        break;
      }

      case 'cancel-order':
        if (!data?.orderNumber) {
          return NextResponse.json({
            success: false,
            message: 'Order number is required'
          }, { status: 400 });
        }
        result = await WooCommerceOrderActions.cancelOrder(
          data.orderNumber,
          email,
          domain,
          data.reason
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Customer action error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to perform customer action'
    }, { status: 500 });
  }
}