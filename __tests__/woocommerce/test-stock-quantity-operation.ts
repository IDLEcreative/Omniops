/**
 * Test the new get_stock_quantity operation
 */

import { executeWooCommerceOperation } from './lib/chat/woocommerce-tool';

async function testStockQuantity() {
  console.log('🧪 Testing New Stock Quantity Operation\n');

  // Test with a real product from Thompson's
  const testProducts = [
    { sku: 'SAG115', name: 'Sealey 115mm Angle Grinder' },
    { sku: 'RE9810-PRK', name: 'Body Repair Kit' }
  ];

  for (const product of testProducts) {
    console.log(`📦 Testing: ${product.name} (SKU: ${product.sku})`);
    console.log('─'.repeat(60));

    try {
      const result = await executeWooCommerceOperation(
        'get_stock_quantity',
        { productId: product.sku },
        'thompsonseparts.co.uk'
      );

      if (result.success) {
        console.log('✅ Success!');
        console.log('\n📊 Response:');
        console.log(result.message);
        console.log('\n📦 Data:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('❌ Failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  console.log('🎉 Test complete!');
}

testStockQuantity();
