/**
 * Quick test to verify payment methods Zod schema fix
 */

import { executeWooCommerceOperation } from './lib/chat/woocommerce-tool';

const DOMAIN = 'thompsonseparts.co.uk';

async function testPaymentMethods() {
  console.log('Testing get_payment_methods after Zod schema fix...\n');

  const start = Date.now();

  try {
    const result = await executeWooCommerceOperation(
      'get_payment_methods',
      {},
      DOMAIN
    );

    const duration = Date.now() - start;

    if (result.success) {
      console.log(`✅ SUCCESS - get_payment_methods now works! (${duration}ms)`);
      console.log(`\nResult:`, JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ STILL FAILING - ${result.message}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    console.log(`❌ ERROR - ${error.message}`);
    console.log(`Duration: ${duration}ms`);
  }
}

testPaymentMethods().catch(console.error);
