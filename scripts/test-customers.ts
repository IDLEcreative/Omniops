// Test script to fetch WooCommerce customers
// Run with: curl http://localhost:3000/api/woocommerce/customers/test

import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceAPI } from '@/lib/woocommerce-api';

export async function testCustomers() {
  try {
    // Initialize WooCommerce API with environment variables
    const wc = new WooCommerceAPI({
      url: process.env.WOOCOMMERCE_URL,
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    });

    console.log('Fetching customers from WooCommerce...');
    
    // Fetch first 10 customers
    const customers = await wc.getCustomers({
      per_page: 10,
      orderby: 'registered_date',
      order: 'desc'
    });

    console.log(`Found ${customers.length} customers`);
    
    // Display customer information
    customers.forEach((customer, index) => {
      console.log(`\nCustomer ${index + 1}:`);
      console.log(`  ID: ${customer.id}`);
      console.log(`  Name: ${customer.first_name} ${customer.last_name}`);
      console.log(`  Email: ${customer.email}`);
      console.log(`  Username: ${customer.username}`);
      console.log(`  Role: ${customer.role}`);
      console.log(`  Registered: ${customer.date_created}`);
      console.log(`  Paying Customer: ${customer.is_paying_customer ? 'Yes' : 'No'}`);
      
      if (customer.billing) {
        console.log(`  Billing Location: ${customer.billing.city}, ${customer.billing.country}`);
      }
    });

    return {
      success: true,
      count: customers.length,
      customers: customers.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`.trim() || c.username,
        email: c.email,
        registered: c.date_created,
        isPayingCustomer: c.is_paying_customer
      }))
    };
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}