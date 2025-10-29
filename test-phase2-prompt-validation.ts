/**
 * Phase 2 Validation: AI Prompt Optimization
 *
 * Validates that enhanced prompts and tool descriptions are correctly integrated
 * and that the chat system can still access WooCommerce tools.
 */

import { getCustomerServicePrompt } from './lib/chat/system-prompts';
import { WOOCOMMERCE_TOOL } from './lib/chat/woocommerce-tool-types';

console.log('='.repeat(80));
console.log('PHASE 2 VALIDATION: AI PROMPT OPTIMIZATION');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

function test(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   ${details}`);
    failCount++;
  }
}

// Test 1: System Prompt includes workflow sections
console.log('\n📝 Testing System Prompt Enhancements...\n');

const systemPrompt = getCustomerServicePrompt();

test(
  'System prompt includes Product Discovery Workflow',
  systemPrompt.includes('PRODUCT DISCOVERY WORKFLOW') && systemPrompt.includes('3-step process'),
  'Should include workflow guidance for product discovery'
);

test(
  'System prompt includes Order Management Workflow',
  systemPrompt.includes('ORDER MANAGEMENT WORKFLOW') && systemPrompt.includes('lookup → track → resolve'),
  'Should include workflow guidance for order management'
);

test(
  'System prompt includes Cart Workflow',
  systemPrompt.includes('CART WORKFLOW') && systemPrompt.includes('search → add → review → checkout'),
  'Should include workflow guidance for cart operations'
);

test(
  'System prompt includes Operation Selection Guide',
  systemPrompt.includes('OPERATION SELECTION GUIDE'),
  'Should include guide for choosing operations'
);

test(
  'System prompt mentions all 25 operations',
  systemPrompt.includes('25 live WooCommerce operations'),
  'Should reference the correct count of operations'
);

// Test specific workflow steps
test(
  'Product workflow includes search_products',
  systemPrompt.includes('search_products') && systemPrompt.includes('BROAD SEARCH'),
  'Step 1 should recommend search_products'
);

test(
  'Product workflow includes get_product_details',
  systemPrompt.includes('get_product_details') && systemPrompt.includes('DETAILED INFO'),
  'Step 2 should recommend get_product_details'
);

test(
  'Product workflow includes check_stock',
  systemPrompt.includes('check_stock') && systemPrompt.includes('STOCK CHECK'),
  'Step 3 should recommend check_stock'
);

// Test 2: Tool Definition Enhancements
console.log('\n🔧 Testing Tool Definition Enhancements...\n');

const toolDef = WOOCOMMERCE_TOOL.function;

test(
  'Tool description is enhanced (>100 characters)',
  toolDef.description.length > 100,
  `Current length: ${toolDef.description.length} characters`
);

test(
  'Tool description mentions 5 capability categories',
  toolDef.description.includes('(1)') &&
  toolDef.description.includes('(2)') &&
  toolDef.description.includes('(3)') &&
  toolDef.description.includes('(4)') &&
  toolDef.description.includes('(5)'),
  'Should list 5 categories: Product info, Orders, Cart, Store config, Business intelligence'
);

test(
  'Tool description includes workflow hint',
  toolDef.description.includes('search_products') &&
  toolDef.description.includes('get_product_details') &&
  toolDef.description.includes('check_stock'),
  'Should mention the recommended product discovery workflow'
);

test(
  'Operation parameter has enhanced description',
  toolDef.parameters.properties.operation.description.length > 50,
  `Current length: ${toolDef.parameters.properties.operation.description.length} characters`
);

test(
  'Operation parameter includes intent mapping',
  toolDef.parameters.properties.operation.description.includes('customer intent') ||
  toolDef.parameters.properties.operation.description.includes('finding products') ||
  toolDef.parameters.properties.operation.description.includes('availability'),
  'Should map customer intents to operations'
);

// Test 3: All 25 operations are in the enum
console.log('\n📋 Testing Operation Coverage...\n');

const operations = toolDef.parameters.properties.operation.enum as string[];

test(
  'Tool enum contains 25 operations',
  operations.length === 25,
  `Current count: ${operations.length}`
);

// Check for critical operations
const criticalOps = [
  'search_products',
  'get_product_details',
  'check_stock',
  'check_order',
  'add_to_cart',
  'get_cart',
  'cancel_order'
];

criticalOps.forEach(op => {
  test(
    `Operation '${op}' is in enum`,
    operations.includes(op),
    `Critical operation missing from tool definition`
  );
});

// Test 4: Workflow Examples
console.log('\n📖 Testing Workflow Examples...\n');

test(
  'Product workflow has concrete examples',
  systemPrompt.includes('"Do you have hydraulic pumps?"') ||
  systemPrompt.includes('"Show me products under'),
  'Should include example customer queries'
);

test(
  'Order workflow has decision tree',
  systemPrompt.includes('Has order number?') ||
  systemPrompt.includes('Only has email?'),
  'Should include order lookup decision criteria'
);

test(
  'Cart workflow shows 4 steps',
  systemPrompt.includes('Step 1') &&
  systemPrompt.includes('Step 2') &&
  systemPrompt.includes('Step 3') &&
  systemPrompt.includes('Step 4'),
  'Cart workflow should be broken into 4 clear steps'
);

// Results Summary
console.log('\n' + '='.repeat(80));
console.log('VALIDATION RESULTS');
console.log('='.repeat(80));

console.log(`\n✅ PASSED: ${passCount}`);
console.log(`❌ FAILED: ${failCount}`);
console.log(`📊 TOTAL: ${passCount + failCount}`);
console.log(`📈 SUCCESS RATE: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Phase 2 enhancements are correctly integrated.');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TESTS FAILED. Please review the Phase 2 implementation.');
  process.exit(1);
}
