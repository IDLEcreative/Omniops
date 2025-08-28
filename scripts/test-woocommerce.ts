import { config } from 'dotenv';
import { WooCommerceAPI } from './lib/woocommerce-api';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testWooCommerceAPI() {
  try {
    console.log('🔄 Initializing WooCommerce API...');
    const wooApi = new WooCommerceAPI();
    
    console.log('📋 Fetching customers list (first 5)...');
    const customers = await wooApi.getCustomers({ 
      per_page: 5,
      orderby: 'registered_date',
      order: 'desc'
    });
    
    console.log(`\n✅ Found ${customers.length} customers:\n`);
    
    customers.forEach((customer, index) => {
      console.log(`Customer ${index + 1}:`);
      console.log(`  ID: ${customer.id}`);
      console.log(`  Name: ${customer.first_name} ${customer.last_name}`);
      console.log(`  Email: ${customer.email}`);
      console.log(`  Username: ${customer.username}`);
      console.log(`  Registered: ${customer.date_created}`);
      console.log('---');
    });
    
    if (customers.length > 0 && customers[0]) {
      console.log('\n📌 Fetching detailed info for first customer...');
      const firstCustomer = await wooApi.getCustomer(customers[0].id);
      console.log('\nDetailed Customer Info:');
      console.log(`  Total Orders: ${firstCustomer.orders_count || 0}`);
      console.log(`  Total Spent: ${firstCustomer.total_spent || 0}`);
      if (firstCustomer.billing) {
        console.log(`  Billing City: ${firstCustomer.billing.city || 'N/A'}`);
        console.log(`  Billing Country: ${firstCustomer.billing.country || 'N/A'}`);
      }
    }
    
    console.log('\n✅ WooCommerce API connection successful!');
    
  } catch (error) {
    console.error('❌ Error connecting to WooCommerce:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

testWooCommerceAPI();