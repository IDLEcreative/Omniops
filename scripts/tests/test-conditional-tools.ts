#!/usr/bin/env npx tsx

/**
 * Test Conditional Tool Availability
 *
 * Verifies that AI tools (especially WooCommerce cart operations)
 * are only available when properly configured for each customer.
 */

import { config } from 'dotenv';
import { getAvailableTools, checkToolAvailability, getToolInstructions } from '../../lib/chat/get-available-tools';

config({ path: '.env.local' });

async function testConditionalTools() {
  console.log('🧪 Testing Conditional Tool Availability\n');
  console.log('=' .repeat(60));

  // Test scenarios
  const testDomains = [
    { domain: 'test-with-woocommerce.com', expectWooCommerce: true },
    { domain: 'test-without-woocommerce.com', expectWooCommerce: false },
    { domain: 'test-with-shopify.com', expectShopify: true },
    { domain: 'unconfigured-domain.com', expectWooCommerce: false, expectShopify: false }
  ];

  console.log('📋 Test Scenarios:\n');

  for (const test of testDomains) {
    console.log(`\n🔍 Testing domain: ${test.domain}`);
    console.log('-'.repeat(40));

    try {
      // Check tool availability
      const availability = await checkToolAvailability(test.domain);
      console.log('Tool Availability:', {
        hasWooCommerce: availability.hasWooCommerce,
        hasShopify: availability.hasShopify
      });

      // Get available tools
      const tools = await getAvailableTools(test.domain);
      console.log(`Available Tools: ${tools.length} total`);

      // List tool names
      const toolNames = tools.map(t => t.function.name);
      console.log('Tool Names:', toolNames);

      // Check for WooCommerce tool
      const hasWooCommerceTool = toolNames.includes('woocommerce_operations');
      console.log(`WooCommerce Tool Present: ${hasWooCommerceTool}`);

      // Get tool instructions
      const instructions = getToolInstructions(availability);
      if (instructions) {
        console.log('\nSystem Instructions Added:');
        console.log(instructions.split('\n').map(line => '  > ' + line).join('\n'));
      }

      // Verify expectations
      if (test.expectWooCommerce !== undefined) {
        const wooCommerceMatch = availability.hasWooCommerce === test.expectWooCommerce;
        console.log(`\n✅ WooCommerce Expected: ${test.expectWooCommerce}, Got: ${availability.hasWooCommerce} - ${wooCommerceMatch ? 'PASS' : 'FAIL'}`);

        if (!wooCommerceMatch) {
          console.error('❌ WooCommerce availability mismatch!');
        }
      }

      if (test.expectShopify !== undefined) {
        const shopifyMatch = availability.hasShopify === test.expectShopify;
        console.log(`✅ Shopify Expected: ${test.expectShopify}, Got: ${availability.hasShopify} - ${shopifyMatch ? 'PASS' : 'FAIL'}`);

        if (!shopifyMatch) {
          console.error('❌ Shopify availability mismatch!');
        }
      }

      // Verify WooCommerce tool only present when configured
      if (!availability.hasWooCommerce && hasWooCommerceTool) {
        console.error('❌ CRITICAL ERROR: WooCommerce tool present without configuration!');
        console.error('   This means AI could offer cart operations when not available!');
      }

      // Check that base search tools are always available
      const baseTools = ['search_website_content', 'search_by_category', 'search_similar'];
      const hasAllBaseTools = baseTools.every(tool => toolNames.includes(tool));
      console.log(`\n✅ Base search tools present: ${hasAllBaseTools ? 'PASS' : 'FAIL'}`);

    } catch (error) {
      console.error(`❌ Error testing ${test.domain}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');

  // Test with actual environment configuration
  const currentDomain = process.env.TEST_DOMAIN || 'example.com';
  console.log(`Testing with current environment (${currentDomain}):\n`);

  const currentAvailability = await checkToolAvailability(currentDomain);
  const currentTools = await getAvailableTools(currentDomain);

  console.log('Current Configuration:');
  console.log('  - WooCommerce:', currentAvailability.hasWooCommerce ? '✅ Configured' : '❌ Not configured');
  console.log('  - Shopify:', currentAvailability.hasShopify ? '✅ Configured' : '❌ Not configured');
  console.log('  - Total Tools Available:', currentTools.length);

  const wooCommerceTool = currentTools.find(t => t.function.name === 'woocommerce_operations');

  if (currentAvailability.hasWooCommerce) {
    if (wooCommerceTool) {
      console.log('\n✅ SUCCESS: WooCommerce is configured and tool is available');
      console.log('   The AI agent CAN offer cart operations for this customer');
    } else {
      console.log('\n❌ ERROR: WooCommerce is configured but tool is missing!');
    }
  } else {
    if (wooCommerceTool) {
      console.log('\n❌ CRITICAL ERROR: WooCommerce NOT configured but tool is available!');
      console.log('   The AI agent would incorrectly offer cart operations!');
    } else {
      console.log('\n✅ SUCCESS: WooCommerce not configured and tool is correctly absent');
      console.log('   The AI agent will NOT offer cart operations for this customer');
    }
  }

  // Check if Store API is enabled
  const storeAPIEnabled = process.env.WOOCOMMERCE_STORE_API_ENABLED === 'true';
  console.log('\n📦 Store API Status:', storeAPIEnabled ? '✅ Enabled (Transactional Mode)' : '⚠️ Disabled (Informational Mode)');

  if (currentAvailability.hasWooCommerce && storeAPIEnabled) {
    console.log('   → AI can directly manipulate cart via Store API');
  } else if (currentAvailability.hasWooCommerce && !storeAPIEnabled) {
    console.log('   → AI will generate add-to-cart URLs');
  }

  console.log('\n✨ Conditional tool availability test complete!\n');
}

// Run the test
testConditionalTools().catch(console.error);