#!/usr/bin/env npx tsx

/**
 * Test Primary Domain (Thompson's Parts)
 *
 * Verifies that the primary customer has WooCommerce tools available.
 */

import { config } from 'dotenv';
import { getAvailableTools, checkToolAvailability } from '../../lib/chat/get-available-tools';

config({ path: '.env.local' });

async function testPrimaryDomain() {
  console.log('🧪 Testing Primary Customer Domain\n');
  console.log('=' .repeat(60));

  const primaryDomain = 'thompsonseparts.co.uk';

  console.log(`Testing: ${primaryDomain}\n`);

  try {
    // Check tool availability
    const availability = await checkToolAvailability(primaryDomain);
    console.log('Tool Availability:');
    console.log('  - WooCommerce:', availability.hasWooCommerce ? '✅ Available' : '❌ Not available');
    console.log('  - Shopify:', availability.hasShopify ? '✅ Available' : '❌ Not available');

    // Get available tools
    const tools = await getAvailableTools(primaryDomain);
    console.log(`\nTotal Tools: ${tools.length}`);

    const toolNames = tools.map(t => t.function.name);
    console.log('Tool Names:', toolNames);

    // Check for WooCommerce tool
    const hasWooCommerceTool = toolNames.includes('woocommerce_operations');

    console.log('\n' + '='.repeat(60));

    if (availability.hasWooCommerce && hasWooCommerceTool) {
      console.log('\n✅ SUCCESS: Thompson\'s Parts has WooCommerce configured');
      console.log('   - WooCommerce tool is available');
      console.log('   - AI can offer cart operations');
      console.log('   - Store API enabled:', process.env.WOOCOMMERCE_STORE_API_ENABLED === 'true' ? 'Yes (Direct manipulation)' : 'No (URL generation)');
    } else if (!availability.hasWooCommerce && !hasWooCommerceTool) {
      console.log('\n⚠️ Thompson\'s Parts does NOT have WooCommerce configured in database');
      console.log('   - Using environment variable fallback');
      console.log('   - This is expected for local development');
    } else {
      console.log('\n❌ ERROR: Mismatch between availability and tools!');
      console.log(`   - hasWooCommerce: ${availability.hasWooCommerce}`);
      console.log(`   - hasWooCommerceTool: ${hasWooCommerceTool}`);
    }

    // Test random domains to ensure they DON'T get tools
    console.log('\n' + '='.repeat(60));
    console.log('\nTesting random domains (should NOT have tools):\n');

    const randomDomains = ['random-site.com', 'another-customer.com', 'test.org'];

    for (const domain of randomDomains) {
      const randAvailability = await checkToolAvailability(domain);
      const randTools = await getAvailableTools(domain);
      const randHasWooCommerce = randTools.some(t => t.function.name === 'woocommerce_operations');

      console.log(`${domain}:`);
      console.log(`  - WooCommerce available: ${randAvailability.hasWooCommerce ? '❌ YES (BAD!)' : '✅ No (correct)'}`);
      console.log(`  - WooCommerce tool present: ${randHasWooCommerce ? '❌ YES (BAD!)' : '✅ No (correct)'}`);

      if (randAvailability.hasWooCommerce || randHasWooCommerce) {
        console.error('  ❌ CRITICAL ERROR: Random domain has cart operations!');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Test complete!\n');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testPrimaryDomain().catch(console.error);