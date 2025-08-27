import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceAPI } from '@/lib/woocommerce-api';
import { WooCommerceCartTracker } from '@/lib/woocommerce-cart-tracker';
import { getDashboardCache } from '@/lib/woocommerce-cache';

export async function GET(request: NextRequest) {
  try {
    const wc = new WooCommerceAPI();
    const cartTracker = new WooCommerceCartTracker();
    const cache = getDashboardCache();
    
    // Get tenant ID (in a real app, this would come from auth/session)
    // For now, use the store URL as tenant ID
    const tenantId = process.env.WOOCOMMERCE_URL?.replace(/https?:\/\//, '').replace(/\//g, '') || 'default';
    
    // Check if we want to force refresh (bypass cache)
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    
    // Try to get cached data first
    if (!forceRefresh) {
      const cachedData = await cache.getCachedDashboard(tenantId);
      if (cachedData) {
        return NextResponse.json({
          ...cachedData,
          cached: true,
          cachedAt: cachedData.cachedAt
        });
      }
    }
    
    // Fetch everything in parallel for speed
    const [
      systemStatus,
      abandonedCartsData,
      recentOrders,
      products,
      salesReport
    ] = await Promise.allSettled([
      wc.getSystemStatus(),
      cartTracker.getAbandonedCarts({ limit: 5, hoursOld: 0 }),
      wc.getOrders({ 
        per_page: 20, 
        orderby: 'date', 
        order: 'desc',
        status: ['processing', 'completed', 'pending', 'on-hold']
      }),
      wc.getProducts({ per_page: 100, stock_status: 'instock' }),
      wc.getSalesReport({ period: 'month' })
    ]);

    // Calculate today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let todayRevenue = 0;
    let yesterdayRevenue = 0;
    let processingCount = 0;
    let completedToday = 0;
    
    if (recentOrders.status === 'fulfilled' && recentOrders.value) {
      recentOrders.value.forEach((order: any) => {
        const orderDate = new Date(order.date_created);
        const orderTotal = parseFloat(order.total);
        
        if (orderDate >= today) {
          todayRevenue += orderTotal;
          if (order.status === 'completed') completedToday++;
        } else if (orderDate >= yesterday && orderDate < today) {
          yesterdayRevenue += orderTotal;
        }
        
        if (order.status === 'processing') {
          processingCount++;
        }
      });
    }

    // Calculate conversion rate (completed orders / total orders)
    const totalOrders = recentOrders.status === 'fulfilled' ? recentOrders.value.length : 0;
    const conversionRate = totalOrders > 0 ? ((completedToday / totalOrders) * 100).toFixed(1) : '0';

    // Get abandoned cart value
    let abandonedValue = 0;
    let topAbandonedCarts: any[] = [];
    
    if (abandonedCartsData.status === 'fulfilled' && abandonedCartsData.value) {
      abandonedCartsData.value.forEach((cart: any) => {
        abandonedValue += parseFloat(cart.cart.total);
      });
      topAbandonedCarts = abandonedCartsData.value.slice(0, 5);
    }

    // Find low stock products (less than 10 in stock)
    let lowStockProducts: any[] = [];
    
    if (products.status === 'fulfilled' && products.value) {
      lowStockProducts = products.value
        .filter((product: any) => {
          const stock = product.stock_quantity;
          return stock !== null && stock > 0 && stock < 10;
        })
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          stock: product.stock_quantity,
          price: product.price
        }))
        .sort((a: any, b: any) => a.stock - b.stock)
        .slice(0, 5);
    }

    // Get currency info
    const currency = systemStatus.status === 'fulfilled' 
      ? systemStatus.value?.settings?.currency || 'GBP'
      : 'GBP';
    const currencySymbol = systemStatus.status === 'fulfilled'
      ? systemStatus.value?.settings?.currency_symbol || '£'
      : '£';

    // Calculate revenue for last 30 days (simplified)
    const revenueHistory: any[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      let dayRevenue = 0;
      if (recentOrders.status === 'fulfilled' && recentOrders.value) {
        recentOrders.value.forEach((order: any) => {
          const orderDate = new Date(order.date_created);
          orderDate.setHours(0, 0, 0, 0);
          
          if (orderDate.getTime() === date.getTime() && 
              (order.status === 'completed' || order.status === 'processing')) {
            dayRevenue += parseFloat(order.total);
          }
        });
      }
      
      revenueHistory.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue
      });
    }

    // Calculate percentage changes
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : '0';

    // Build the response data
    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        revenue: {
          today: todayRevenue.toFixed(2),
          yesterday: yesterdayRevenue.toFixed(2),
          change: revenueChange,
          currency,
          currencySymbol
        },
        abandonedCarts: {
          value: abandonedValue.toFixed(2),
          count: topAbandonedCarts.length,
          currency,
          currencySymbol
        },
        orders: {
          processing: processingCount,
          completedToday: completedToday,
          total: totalOrders
        },
        conversion: {
          rate: conversionRate,
          label: 'Today'
        }
      },
      revenueHistory,
      abandonedCarts: topAbandonedCarts.map(cart => ({
        orderId: cart.orderId,
        customerName: cart.customer.name || 'Unknown',
        customerEmail: cart.customer.email,
        value: parseFloat(cart.cart.total).toFixed(2),
        currency: cart.cart.currency,
        timeAgo: cart.dates.abandoned_duration,
        items: cart.cart.itemCount
      })),
      lowStock: lowStockProducts
    };
    
    // Cache the successful response
    await cache.cacheDashboard(tenantId, responseData);
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch dashboard data',
      details: error.stack
    }, { status: 500 });
  }
}