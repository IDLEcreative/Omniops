#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

async function testSimple() {
  const url = process.env.WOOCOMMERCE_URL;
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  console.log('Testing WooCommerce API with Simple Request\n');
  console.log('URL:', url);
  console.log('Key:', key?.substring(0, 15) + '...');

  // Try WITHOUT www redirect
  const testUrl = `${url}/wp-json/wc/v3/products`;

  console.log('\nTest 1: Direct URL (no www)');
  console.log('Testing:', testUrl);

  try {
    const response = await axios.get(testUrl, {
      params: {
        consumer_key: key,
        consumer_secret: secret,
        per_page: 1,
        status: 'publish',
      },
      maxRedirects: 0, // Don't follow redirects
      validateStatus: () => true, // Accept any status
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers.location || 'No redirect');

    if (response.status === 200) {
      console.log('✅ SUCCESS!');
      console.log('Products:', response.data.length);
    } else if (response.status === 301 || response.status === 302) {
      console.log('⚠️  Redirect detected to:', response.headers.location);
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      console.log('Data:', response.data);
    }
  } catch (error: any) {
    console.log('❌ Request failed:', error.message);
  }

  // Try WITH www
  const wwwUrl = url?.replace('https://', 'https://www.') || '';

  console.log('\n\nTest 2: With www');
  console.log('Testing:', `${wwwUrl}/wp-json/wc/v3/products`);

  try {
    const response = await axios.get(`${wwwUrl}/wp-json/wc/v3/products`, {
      params: {
        consumer_key: key,
        consumer_secret: secret,
        per_page: 1,
        status: 'publish',
      },
      maxRedirects: 0,
      validateStatus: () => true,
    });

    console.log('Status:', response.status);

    if (response.status === 200) {
      console.log('✅ SUCCESS with www!');
      console.log('Products:', response.data.length);
      if (response.data[0]) {
        console.log('Sample product:', response.data[0].name);
      }
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      console.log('Data:', response.data);
    }
  } catch (error: any) {
    console.log('❌ Request failed:', error.message);
  }
}

testSimple().catch(console.error);
