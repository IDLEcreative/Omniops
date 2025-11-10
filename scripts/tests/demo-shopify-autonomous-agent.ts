#!/usr/bin/env tsx
/**
 * Demo Script: Autonomous Shopify Setup Agent
 *
 * This script demonstrates the autonomous agent generating Shopify API credentials
 * without any manual intervention.
 *
 * Prerequisites:
 * 1. Shopify store with admin access
 * 2. Admin credentials stored in database
 * 3. User consent granted for the operation
 * 4. Private app development enabled in store settings
 *
 * Usage:
 *   npx tsx scripts/tests/demo-shopify-autonomous-agent.ts --store-url="mystore.myshopify.com"
 *
 * Alternative usage with env vars:
 *   export DEMO_STORE_URL="mystore.myshopify.com"
 *   export SHOPIFY_ADMIN_EMAIL="admin@example.com"
 *   export SHOPIFY_ADMIN_PASSWORD="your-password"
 *   export TEST_ORG_ID="org-123"
 *   npx tsx scripts/tests/demo-shopify-autonomous-agent.ts
 */

import { createShopifySetupAgent } from '@/lib/autonomous/agents/shopify-setup-agent';
import { storeCredential } from '@/lib/autonomous/security/credential-vault';
import { grantConsent } from '@/lib/autonomous/security/consent-manager';
import { getOperationAuditLogs, getOperationAuditSummary } from '@/lib/autonomous/security/audit-logger';

// Configuration from command line args or environment
const args = process.argv.slice(2);
const storeUrlArg = args.find(arg => arg.startsWith('--store-url='));
const headlessArg = args.find(arg => arg.startsWith('--headless='));

const STORE_URL = storeUrlArg ? storeUrlArg.split('=')[1] : process.env.DEMO_STORE_URL;
const HEADLESS = headlessArg ? headlessArg.split('=')[1] === 'true' : false;

// Test organization and user (replace with real values)
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-123';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-456';
const SHOPIFY_ADMIN_EMAIL = process.env.SHOPIFY_ADMIN_EMAIL;
const SHOPIFY_ADMIN_PASSWORD = process.env.SHOPIFY_ADMIN_PASSWORD;

console.log('🤖 Autonomous Agent Demo - Shopify API Credential Generation');
console.log('='.repeat(70));

async function main() {
  try {
    // ========================================================================
    // Step 1: Validate Prerequisites
    // ========================================================================
    console.log('\n📋 Step 1: Validating Prerequisites\n');

    if (!STORE_URL) {
      throw new Error('Store URL required. Use --store-url="mystore.myshopify.com" or set DEMO_STORE_URL env var');
    }

    if (!SHOPIFY_ADMIN_EMAIL || !SHOPIFY_ADMIN_PASSWORD) {
      throw new Error('Shopify credentials required. Set SHOPIFY_ADMIN_EMAIL and SHOPIFY_ADMIN_PASSWORD env vars');
    }

    console.log(`✅ Store URL: ${STORE_URL}`);
    console.log(`✅ Admin Email: ${SHOPIFY_ADMIN_EMAIL}`);
    console.log(`✅ Headless Mode: ${HEADLESS ? 'Yes' : 'No (visible browser)'}`);
    console.log(`✅ Organization ID: ${TEST_ORG_ID}`);

    // ========================================================================
    // Step 2: Store Credentials
    // ========================================================================
    console.log('\n📋 Step 2: Storing Shopify Credentials\n');

    await storeCredential(TEST_ORG_ID, 'shopify', 'admin_email', {
      value: SHOPIFY_ADMIN_EMAIL
    });
    console.log('✅ Stored admin email');

    await storeCredential(TEST_ORG_ID, 'shopify', 'admin_password', {
      value: SHOPIFY_ADMIN_PASSWORD
    });
    console.log('✅ Stored admin password');

    // ========================================================================
    // Step 3: Grant Consent
    // ========================================================================
    console.log('\n📋 Step 3: Granting User Consent\n');

    const consent = await grantConsent(TEST_ORG_ID, TEST_USER_ID, {
      service: 'shopify',
      operation: 'api_credential_generation',
      permissions: ['read_products', 'write_products', 'read_orders', 'create_api_credentials'],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    console.log(`✅ Consent granted (ID: ${consent.id})`);
    console.log(`   Permissions: ${consent.permissions.join(', ')}`);
    console.log(`   Expires: ${new Date(consent.expiresAt!).toLocaleString()}`);

    // ========================================================================
    // Step 4: Create Autonomous Agent
    // ========================================================================
    console.log('\n📋 Step 4: Creating Autonomous Agent\n');

    const agent = createShopifySetupAgent(STORE_URL);
    console.log('✅ Shopify setup agent created');
    console.log(`   Target: ${STORE_URL}`);
    console.log(`   Service: shopify`);

    // ========================================================================
    // Step 5: Execute Autonomous Operation
    // ========================================================================
    console.log('\n📋 Step 5: Executing Autonomous Operation\n');
    console.log('⏳ Agent will now:');
    console.log('   1. Login to Shopify admin');
    console.log('   2. Navigate to Apps & Sales Channels');
    console.log('   3. Create private app');
    console.log('   4. Configure API scopes');
    console.log('   5. Generate and extract credentials');
    console.log('\n🚀 Starting execution...\n');

    const operationId = `shopify-setup-${Date.now()}`;
    const startTime = Date.now();

    try {
      const result = await agent.execute({
        operationId,
        organizationId: TEST_ORG_ID,
        service: 'shopify',
        operation: 'api_credential_generation',
        headless: HEADLESS,
        slowMo: HEADLESS ? 0 : 500 // Slow down for visual demo
      });

      const duration = Date.now() - startTime;

      // ========================================================================
      // Step 6: Display Results
      // ========================================================================
      console.log('\n📋 Step 6: Results\n');
      console.log('='.repeat(70));

      if (result.success) {
        console.log('✅ SUCCESS - API Credentials Generated!\n');

        if (result.accessToken) {
          console.log(`🔑 Access Token: ${result.accessToken}`);
        }

        if (result.apiKey) {
          console.log(`🔑 API Key: ${result.apiKey}`);
        }

        if (result.apiSecret) {
          console.log(`🔑 API Secret: ${result.apiSecret}`);
        }

        if (result.scopes && result.scopes.length > 0) {
          console.log(`\n📋 Configured Scopes:`);
          result.scopes.forEach(scope => {
            console.log(`   - ${scope}`);
          });
        }

        console.log(`\n⏱️  Total Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`📍 Store: ${result.storeUrl}`);
      } else {
        console.log('❌ FAILED - Operation did not complete\n');
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
      }

      // ========================================================================
      // Step 7: Display Audit Trail
      // ========================================================================
      console.log('\n📋 Step 7: Audit Trail\n');
      console.log('='.repeat(70));

      const auditLogs = await getOperationAuditLogs(operationId);
      const auditSummary = await getOperationAuditSummary(operationId);

      console.log(`\n📊 Operation Summary:`);
      console.log(`   Total Steps: ${auditSummary.totalSteps}`);
      console.log(`   Successful: ${auditSummary.successfulSteps}`);
      console.log(`   Failed: ${auditSummary.failedSteps}`);
      console.log(`   Total Duration: ${(auditSummary.totalDurationMs / 1000).toFixed(2)}s`);
      console.log(`   Avg Step Duration: ${(auditSummary.avgStepDurationMs / 1000).toFixed(2)}s`);
      console.log(`   Screenshots: ${auditSummary.screenshots.length}`);

      console.log(`\n📝 Step-by-Step Log:`);
      auditLogs.forEach((log, index) => {
        const status = log.success ? '✅' : '❌';
        const duration = log.durationMs ? `(${log.durationMs}ms)` : '';
        console.log(`   ${index + 1}. ${status} ${log.intent} ${duration}`);
        if (log.error) {
          console.log(`      Error: ${log.error}`);
        }
        if (log.screenshotUrl) {
          console.log(`      Screenshot: ${log.screenshotUrl}`);
        }
      });

      console.log('\n='.repeat(70));
      console.log('✅ Demo Complete!\n');

      // Show next steps
      if (result.success) {
        console.log('🎯 Next Steps:');
        console.log('   1. Save credentials to your .env file');
        console.log('   2. Test API access with a simple request');
        console.log('   3. Configure webhook endpoints if needed');
        console.log('   4. Build more autonomous agents!');
      } else {
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check audit logs for specific failure points');
        console.log('   2. Verify admin credentials are correct');
        console.log('   3. Ensure private app development is enabled');
        console.log('   4. Check store URL format (mystore.myshopify.com)');
        console.log('   5. Review screenshots for UI changes');
      }

    } catch (error) {
      console.error('\n❌ Execution Error:', error);
      console.log('\nPartial audit trail:');

      try {
        const partialLogs = await getOperationAuditLogs(operationId);
        partialLogs.forEach((log, index) => {
          const status = log.success ? '✅' : '❌';
          console.log(`   ${index + 1}. ${status} ${log.intent}`);
        });
      } catch (auditError) {
        console.log('Could not retrieve audit logs');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the demo
main()
  .then(() => {
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal Error:', error);
    process.exit(1);
  });
