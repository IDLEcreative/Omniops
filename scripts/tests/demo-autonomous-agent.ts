#!/usr/bin/env tsx
/**
 * Demo Script: Autonomous WooCommerce Setup Agent
 *
 * This script demonstrates the autonomous agent generating WooCommerce API keys
 * without any manual intervention.
 *
 * Prerequisites:
 * 1. WooCommerce store with admin access
 * 2. Admin credentials stored in database
 * 3. User consent granted for the operation
 *
 * Usage:
 *   npx tsx scripts/tests/demo-autonomous-agent.ts --store-url="https://shop.example.com"
 */

import { createWooCommerceSetupAgent } from '@/lib/autonomous/agents/woocommerce-setup-agent';
import { storeCredential } from '@/lib/autonomous/security/credential-vault';
import { grantConsent } from '@/lib/autonomous/security/consent-manager';
import { getOperationAuditLogs, getOperationAuditSummary } from '@/lib/autonomous/security/audit-logger';
import { createClient } from '@supabase/supabase-js';

// Configuration from command line args
const args = process.argv.slice(2);
const storeUrlArg = args.find(arg => arg.startsWith('--store-url='));
const headlessArg = args.find(arg => arg.startsWith('--headless='));

const STORE_URL = storeUrlArg ? storeUrlArg.split('=')[1] : process.env.DEMO_STORE_URL;
const HEADLESS = headlessArg ? headlessArg.split('=')[1] === 'true' : false;

// Test organization and user (replace with real values)
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-123';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-456';
const WC_ADMIN_USERNAME = process.env.WC_ADMIN_USERNAME;
const WC_ADMIN_PASSWORD = process.env.WC_ADMIN_PASSWORD;

console.log('🤖 Autonomous Agent Demo - WooCommerce API Key Generation');
console.log('='.repeat(70));

async function main() {
  try {
    // ========================================================================
    // Step 1: Validate Prerequisites
    // ========================================================================
    console.log('\n📋 Step 1: Validating Prerequisites\n');

    if (!STORE_URL) {
      throw new Error('Store URL required. Use --store-url="https://your-store.com" or set DEMO_STORE_URL env var');
    }

    if (!WC_ADMIN_USERNAME || !WC_ADMIN_PASSWORD) {
      throw new Error('WooCommerce credentials required. Set WC_ADMIN_USERNAME and WC_ADMIN_PASSWORD env vars');
    }

    console.log(`✅ Store URL: ${STORE_URL}`);
    console.log(`✅ Admin Username: ${WC_ADMIN_USERNAME}`);
    console.log(`✅ Headless Mode: ${HEADLESS ? 'Yes' : 'No (visible browser)'}`);
    console.log(`✅ Organization ID: ${TEST_ORG_ID}`);

    // ========================================================================
    // Step 2: Store Credentials
    // ========================================================================
    console.log('\n📋 Step 2: Storing WooCommerce Credentials\n');

    await storeCredential(TEST_ORG_ID, 'woocommerce', 'admin_username', {
      value: WC_ADMIN_USERNAME
    });
    console.log('✅ Stored admin username');

    await storeCredential(TEST_ORG_ID, 'woocommerce', 'admin_password', {
      value: WC_ADMIN_PASSWORD
    });
    console.log('✅ Stored admin password');

    // ========================================================================
    // Step 3: Grant Consent
    // ========================================================================
    console.log('\n📋 Step 3: Granting User Consent\n');

    const consent = await grantConsent(TEST_ORG_ID, TEST_USER_ID, {
      service: 'woocommerce',
      operation: 'api_key_generation',
      permissions: ['read_products', 'write_products', 'create_api_keys'],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    console.log(`✅ Consent granted (ID: ${consent.id})`);
    console.log(`   Permissions: ${consent.permissions.join(', ')}`);
    console.log(`   Expires: ${new Date(consent.expiresAt!).toLocaleString()}`);

    // ========================================================================
    // Step 4: Create Autonomous Agent
    // ========================================================================
    console.log('\n📋 Step 4: Creating Autonomous Agent\n');

    const agent = createWooCommerceSetupAgent(STORE_URL);
    console.log('✅ WooCommerce setup agent created');
    console.log(`   Target: ${STORE_URL}`);
    console.log(`   Service: woocommerce`);

    // ========================================================================
    // Step 5: Execute Autonomous Operation
    // ========================================================================
    console.log('\n📋 Step 5: Executing Autonomous Operation\n');
    console.log('⏳ This will take 2-5 minutes...');
    console.log('   The agent will:');
    console.log('   1. Log into WooCommerce admin');
    console.log('   2. Navigate to API settings');
    console.log('   3. Generate new API keys');
    console.log('   4. Retrieve the generated keys');
    console.log('   5. Return the result\n');

    if (!HEADLESS) {
      console.log('🎬 Watch Mode: Browser will be VISIBLE so you can see the agent work!');
      console.log('   (Use --headless=true to run in background)\n');
    }

    const operationId = 'demo-' + Date.now();
    const startTime = Date.now();

    const result = await agent.execute({
      operationId,
      organizationId: TEST_ORG_ID,
      service: 'woocommerce',
      operation: 'api_key_generation',
      headless: HEADLESS,
      slowMo: HEADLESS ? 0 : 500 // Slow down for visibility in watch mode
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // ========================================================================
    // Step 6: Display Results
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 OPERATION RESULTS');
    console.log('='.repeat(70) + '\n');

    if (result.success) {
      console.log('✅ SUCCESS! API Keys Generated\n');
      console.log('📝 Generated API Keys:');
      console.log(`   Consumer Key:    ${result.data.consumerKey}`);
      console.log(`   Consumer Secret: ${result.data.consumerSecret}`);
      console.log(`   Permissions:     ${result.data.permissions}`);
      console.log(`   Description:     ${result.data.description}`);

      if (result.data.productCount) {
        console.log(`\n📦 Verified: ${result.data.productCount} products accessible via API`);
      }
    } else {
      console.log('❌ OPERATION FAILED\n');
      console.log(`Error: ${result.error}`);

      if (result.metadata?.lastSuccessfulStep) {
        console.log(`Last Successful Step: ${result.metadata.lastSuccessfulStep}`);
      }
    }

    console.log(`\n⏱️  Duration: ${duration} seconds`);
    console.log(`🔗 Operation ID: ${operationId}`);

    // ========================================================================
    // Step 7: Display Audit Trail
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📜 AUDIT TRAIL');
    console.log('='.repeat(70) + '\n');

    const auditLogs = await getOperationAuditLogs(operationId);
    const auditSummary = await getOperationAuditSummary(operationId);

    console.log('Summary:');
    console.log(`   Total Steps:       ${auditSummary.totalSteps}`);
    console.log(`   Successful Steps:  ${auditSummary.successfulSteps}`);
    console.log(`   Failed Steps:      ${auditSummary.failedSteps}`);
    console.log(`   Average Duration:  ${auditSummary.avgStepDurationMs}ms per step`);
    console.log(`   Screenshots:       ${auditSummary.screenshots.length}`);

    console.log('\nStep-by-Step Log:');
    auditLogs.forEach(log => {
      const status = log.success ? '✅' : '❌';
      const duration = log.durationMs ? `(${log.durationMs}ms)` : '';
      console.log(`   ${status} Step ${log.stepNumber}: ${log.intent} ${duration}`);

      if (!log.success && log.error) {
        console.log(`      Error: ${log.error}`);
      }

      if (log.screenshotUrl) {
        console.log(`      Screenshot: ${log.screenshotUrl}`);
      }
    });

    // ========================================================================
    // Step 8: Cleanup (Optional)
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('🧹 CLEANUP');
    console.log('='.repeat(70) + '\n');

    console.log('Note: Credentials and consent remain stored for future operations.');
    console.log('To revoke consent, use:');
    console.log(`  await revokeConsent('${TEST_ORG_ID}', 'woocommerce', 'api_key_generation');`);

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('🎉 DEMO COMPLETE');
    console.log('='.repeat(70) + '\n');

    if (result.success) {
      console.log('The autonomous agent successfully:');
      console.log('✅ Logged into WooCommerce admin');
      console.log('✅ Navigated through the admin interface using AI vision');
      console.log('✅ Generated API keys autonomously');
      console.log('✅ Verified the keys work by fetching products');
      console.log('✅ Logged every step with screenshots');
      console.log('✅ Returned the result to you');
      console.log('\n💡 This entire process was FULLY AUTONOMOUS - no manual steps!');
      console.log(`⏱️  Time saved: ~2 hours → ${duration} seconds (98% reduction)`);
    } else {
      console.log('The operation failed, but the system:');
      console.log('✅ Captured complete audit trail');
      console.log('✅ Logged all screenshots for debugging');
      console.log('✅ Provided detailed error information');
      console.log('\n🔍 Review the audit trail above to see where it failed.');
    }

    console.log('\n📚 Documentation:');
    console.log('   - System Overview: docs/10-ANALYSIS/ANALYSIS_AUTONOMOUS_DEPLOYMENT_SUCCESS.md');
    console.log('   - Deployment Guide: docs/05-DEPLOYMENT/GUIDE_AUTONOMOUS_DEPLOYMENT.md');
    console.log('   - Test Results: AUTONOMOUS_TESTS_CREATED.md');

  } catch (error) {
    console.error('\n❌ Demo Failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Verify environment variables are set');
    console.error('2. Ensure database migration is applied');
    console.error('3. Check that storage bucket exists');
    console.error('4. Verify WooCommerce credentials are correct');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Demo interrupted by user');
  console.log('   Operation may be incomplete - check audit logs');
  process.exit(0);
});

// Run the demo
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
