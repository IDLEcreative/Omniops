#!/usr/bin/env npx tsx

/**
 * Diagnose WooCommerce API 401 Authentication Issues
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import axios from 'axios';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function diagnoseWooCommerceAPI() {
  console.log('🔍 WooCommerce API Diagnostics\n');
  console.log('═'.repeat(60));

  const credentials = {
    url: process.env.WOOCOMMERCE_URL,
    key: process.env.WOOCOMMERCE_CONSUMER_KEY,
    secret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  };

  console.log('\n📋 Step 1: Environment Variables Check');
  console.log('   URL:', credentials.url || '❌ Missing');
  console.log('   Consumer Key:', credentials.key ? '✅ SET' : '❌ Missing');
  console.log('   Consumer Secret:', credentials.secret ? '✅ SET' : '❌ Missing');

  if (!credentials.url || !credentials.key || !credentials.secret) {
    console.error('\n❌ Missing required credentials');
    process.exit(1);
  }

  // Test 1: Check if WooCommerce REST API is accessible
  console.log('\n🌐 Step 2: Testing WooCommerce REST API Endpoint');

  const baseUrl = credentials.url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3`;

  try {
    // Test basic connectivity without auth
    console.log('   Testing:', `${baseUrl}/wp-json/wc/v3`);

    const connectTest = await axios.get(`${baseUrl}/wp-json/wc/v3`, {
      timeout: 10000,
      validateStatus: () => true, // Accept any status
    });

    console.log('   ✅ Endpoint reachable');
    console.log('   Status:', connectTest.status, connectTest.statusText);

  } catch (error: any) {
    console.error('   ❌ Connection error:', error.message);
  }

  // Test 2: Try authenticated request
  console.log('\n🔐 Step 3: Testing Authenticated Request');

  const testConfigs = [
    {
      name: 'Query Parameters (Current Method)',
      config: {
        method: 'get' as const,
        url: `${apiUrl}/products`,
        params: {
          consumer_key: credentials.key,
          consumer_secret: credentials.secret,
          per_page: 1,
        },
        timeout: 10000,
      }
    },
    {
      name: 'Basic Auth',
      config: {
        method: 'get' as const,
        url: `${apiUrl}/products`,
        auth: {
          username: credentials.key,
          password: credentials.secret,
        },
        params: {
          per_page: 1,
        },
        timeout: 10000,
      }
    },
  ];

  for (const test of testConfigs) {
    console.log(`\n   Testing: ${test.name}`);

    try {
      const response = await axios(test.config);
      console.log(`   ✅ Success! Status: ${response.status}`);
      console.log(`   Products returned: ${response.data?.length || 0}`);

      if (response.data && response.data.length > 0) {
        console.log(`   Sample product: ${response.data[0].name}`);
      }

      // If successful, no need to test other methods
      console.log('\n' + '═'.repeat(60));
      console.log('✅ AUTHENTICATION WORKING\n');
      console.log(`Working method: ${test.name}`);
      return;

    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.response?.status} ${error.response?.statusText}`);

      if (error.response?.data) {
        console.log(`   Error code: ${error.response.data.code}`);
        console.log(`   Error message: ${error.response.data.message}`);
      }
    }
  }

  // Test 3: Try system status endpoint (less restrictive)
  console.log('\n🔧 Step 4: Testing System Status Endpoint');

  try {
    const systemStatus = await axios.get(`${apiUrl}/system_status`, {
      params: {
        consumer_key: credentials.key,
        consumer_secret: credentials.secret,
      },
      timeout: 10000,
    });

    console.log('   ✅ System status accessible');
    console.log('   WooCommerce version:', systemStatus.data?.environment?.version);

  } catch (error: any) {
    console.log('   ❌ System status failed:', error.response?.status, error.response?.statusText);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('❌ AUTHENTICATION FAILED\n');
  console.log('Possible Issues:');
  console.log('  1. API keys have been regenerated or expired');
  console.log('  2. API key permissions are insufficient (read/write required)');
  console.log('  3. WooCommerce REST API is disabled');
  console.log('  4. Server-side security blocking API access');
  console.log('  5. Two-factor authentication required');
  console.log('\nRecommended Actions:');
  console.log('  1. Log into WooCommerce dashboard');
  console.log('  2. Go to: WooCommerce → Settings → Advanced → REST API');
  console.log('  3. Check if API keys exist and have Read/Write permissions');
  console.log('  4. Regenerate API keys if needed');
  console.log('  5. Update .env.local with new credentials');
}

diagnoseWooCommerceAPI().catch(console.error);
