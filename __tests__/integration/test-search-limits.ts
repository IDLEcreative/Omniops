#!/usr/bin/env npx tsx
/**
 * Simple test to understand search limits
 */

import { createServiceRoleClient } from './lib/supabase-server';

async function checkActualCounts() {
  console.log('\n=== CHECKING ACTUAL DATABASE COUNTS ===\n');
  
  const supabase = await createServiceRoleClient();
  
  // Count Cifa products in WooCommerce products
  const { count: cifaCount } = await supabase
    .from('woocommerce_products')
    .select('*', { count: 'exact', head: true })
    .ilike('name', '%cifa%');
  
  console.log(`Actual Cifa products in database: ${cifaCount || 'unknown'}`);
  
  // Count all pumps
  const { count: pumpCount } = await supabase
    .from('woocommerce_products')
    .select('*', { count: 'exact', head: true })
    .ilike('name', '%pump%');
  
  console.log(`Actual pump products in database: ${pumpCount || 'unknown'}`);
  
  // Now test what the API returns
  console.log('\n=== TESTING API SEARCH BEHAVIOR ===\n');
  
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show me all Cifa products',
      session_id: 'test-' + Date.now(),
      domain: 'thompsonseparts.co.uk',
    }),
  });
  
  const data = await response.json();
  
  // Extract what the model says
  const message = data.message;
  console.log('Model says:');
  console.log(message.substring(0, 200) + '...\n');
  
  // Look for numbers
  const numbers = message.match(/\b\d+\b/g) || [];
  console.log(`Numbers mentioned by model: ${numbers.join(', ')}`);
  
  console.log('\n=== THE REALITY ===\n');
  console.log(`Database has: ${cifaCount} Cifa products`);
  console.log(`Search tool returns: Maximum 20 items (hardcoded limit)`);
  console.log(`Model is told: "Got exactly 20 results - likely hit search limit"`);
  console.log(`Model should say: "We have an extensive range" not "We have 20"`);
}

checkActualCounts().catch(console.error);