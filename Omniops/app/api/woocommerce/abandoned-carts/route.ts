import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceCartTracker } from '@/lib/woocommerce-cart-tracker';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';
    const cartTracker = new WooCommerceCartTracker();

    // Handle different actions
    switch (action) {
      case 'list':
        const abandonedCarts = await cartTracker.getAbandonedCarts({
          limit: parseInt(searchParams.get('limit') || '20'),
          hoursOld: parseInt(searchParams.get('hoursOld') || '1'),
          minValue: parseFloat(searchParams.get('minValue') || '0'),
          includeStatuses: ['pending', 'on-hold', 'failed']
        });

        const totalValue = abandonedCarts.reduce((sum, cart) => 
          sum + parseFloat(cart.cart.total), 0
        ).toFixed(2);
        
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          summary: {
            total: abandonedCarts.length,
            totalValue,
            highPriority: abandonedCarts.filter(c => c.recovery.priority === 'high').length,
            mediumPriority: abandonedCarts.filter(c => c.recovery.priority === 'medium').length,
            lowPriority: abandonedCarts.filter(c => c.recovery.priority === 'low').length
          },
          carts: abandonedCarts
        });

      case 'single':
        const orderId = searchParams.get('orderId');
        if (!orderId) {
          return NextResponse.json({
            success: false,
            error: 'Order ID required for single cart lookup'
          }, { status: 400 });
        }
        const cart = await cartTracker.getAbandonedCart(parseInt(orderId));
        
        if (!cart) {
          return NextResponse.json({
            success: false,
            error: 'Cart not found or already recovered'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          cart
        });

      case 'stats':
        const statsDays = parseInt(searchParams.get('days') || '7');
        const stats = await cartTracker.getCartRecoveryStats(statsDays);

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          period: `Last ${statsDays} days`,
          statistics: {
            ...stats,
            total_value: `${stats.total_value.toFixed(2)} ${process.env.WOOCOMMERCE_CURRENCY || 'GBP'}`,
            average_cart_value: `${stats.average_cart_value.toFixed(2)} ${process.env.WOOCOMMERCE_CURRENCY || 'GBP'}`,
            recovery_rate: `${(stats.recovery_rate ?? 0).toFixed(1)}%`
          }
        });

      case 'recover':
        const recoverOrderId = searchParams.get('orderId');
        if (!recoverOrderId) {
          return NextResponse.json({
            success: false,
            error: 'Order ID required for recovery action'
          }, { status: 400 });
        }
        const recoveryResult = await cartTracker.sendRecoveryReminder(parseInt(recoverOrderId));
        
        return NextResponse.json({
          success: recoveryResult.success,
          timestamp: new Date().toISOString(),
          message: recoveryResult.message,
          orderId: parseInt(recoverOrderId)
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: list, single, stats, or recover'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Abandoned carts API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process abandoned carts request',
      details: error.response?.data || error.stack
    }, { status: 500 });
  }
}