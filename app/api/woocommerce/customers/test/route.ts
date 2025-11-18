import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceAPI } from '@/lib/woocommerce-api';

export async function GET(request: NextRequest) {
  try {
    // Initialize WooCommerce API with environment variables
    const url = process.env.WOOCOMMERCE_URL;
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
      return NextResponse.json({
        success: false,
        error: 'WooCommerce credentials not configured'
      }, { status: 500 });
    }

    const wc = new WooCommerceAPI({
      url,
      consumerKey,
      consumerSecret,
    });

    
    // Fetch first 10 customers
    const customers = await wc.getCustomers({
      per_page: 10,
      orderby: 'registered_date',
      order: 'desc'
    });

    
    // Get detailed info for first customer if available
    let firstCustomerDetails = null;
    if (customers.length > 0 && customers[0]) {
      try {
        firstCustomerDetails = await wc.getCustomer(customers[0].id);
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalCustomers: customers.length,
      customers: customers.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`.trim() || c.username,
        email: c.email,
        username: c.username,
        role: c.role,
        registered: c.date_created,
        isPayingCustomer: c.is_paying_customer,
        location: c.billing ? `${c.billing.city || 'N/A'}, ${c.billing.country || 'N/A'}` : 'No billing address'
      })),
      firstCustomerDetails: firstCustomerDetails ? {
        id: firstCustomerDetails.id,
        fullName: `${firstCustomerDetails.first_name} ${firstCustomerDetails.last_name}`.trim(),
        email: firstCustomerDetails.email,
        billing: firstCustomerDetails.billing,
        shipping: firstCustomerDetails.shipping,
        metadata: firstCustomerDetails.meta_data
      } : null
    });
    
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch customers',
      details: error.response?.data || error.stack
    }, { status: 500 });
  }
}