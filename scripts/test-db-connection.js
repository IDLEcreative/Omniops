// Test database connection and WooCommerce configuration
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { createClient  } from '@supabase/supabase-js';

async function testConnection() {
  console.log('🔧 Testing database connection...');
  
  // Show environment variables (masked)
  console.log('Environment check:');
  console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('  SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('  ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? '✅ Set' : '❌ Missing');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials!');
    return;
  }
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Test 1: Check if customer_configs table exists
    console.log('\n📊 Checking customer_configs table...');
    const { data: configs, error: configError } = await supabase
      .from('customer_configs')
      .select('domain, woocommerce_enabled, woocommerce_url')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();
    
    if (configError) {
      console.error('❌ Error fetching config:', configError.message);
    } else {
      console.log('✅ Found configuration:', configs);
    }
    
    // Test 2: Check all domains in the table
    console.log('\n📋 All configured domains:');
    const { data: allConfigs, error: allError } = await supabase
      .from('customer_configs')
      .select('domain, woocommerce_enabled');
    
    if (allError) {
      console.error('❌ Error fetching all configs:', allError.message);
    } else if (allConfigs && allConfigs.length > 0) {
      allConfigs.forEach(config => {
        console.log(`  - ${config.domain}: WooCommerce ${config.woocommerce_enabled ? '✅' : '❌'}`);
      });
    } else {
      console.log('  No configurations found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection();