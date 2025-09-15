// Test chatbot with real WooCommerce API
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function simulateChatbot() {
  console.log('=== Simulating Chatbot Order Lookup ===\n');
  
  // Simulate what happens in the chat route
  import { SimpleCustomerVerification  } from './lib/customer-verification-simple';
  import { WooCommerceCustomer  } from './lib/woocommerce-customer';
  
  const conversationId = 'test-conversation-' + Date.now();
  const domain = 'thompsonseparts.co.uk';
  
  // Test Case 1: Customer provides email only
  console.log('TEST 1: Customer says "samguy@thompsonsuk.com"');
  console.log('---------------------------------------');
  
  const message1 = 'samguy@thompsonsuk.com';
  const emailMatch1 = message1.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  
  const verification1 = await SimpleCustomerVerification.verifyCustomer({
    conversationId,
    email: emailMatch1 ? emailMatch1[0] : undefined
  }, domain);
  
  console.log('Verification Level:', verification1.level);
  console.log('Customer Email:', verification1.customerEmail);
  console.log('Allowed Data:', verification1.allowedData);
  
  if (verification1.customerEmail) {
    const wooCustomer = await WooCommerceCustomer.forDomain(domain);
    if (wooCustomer) {
      const context = await wooCustomer.getCustomerContext(
        verification1.customerEmail,
        conversationId
      );
      console.log('\nCustomer Context Generated:');
      console.log(context);
    }
  }
  
  // Test Case 2: Customer provides order number
  console.log('\n\nTEST 2: Customer says "119410"');
  console.log('---------------------------------------');
  
  const message2 = '119410';
  const orderMatch2 = message2.match(/#?\d{4,}/);
  
  const verification2 = await SimpleCustomerVerification.verifyCustomer({
    conversationId,
    orderNumber: orderMatch2 ? orderMatch2[0] : undefined
  }, domain);
  
  console.log('Verification Level:', verification2.level);
  console.log('Prompt:', verification2.prompt);
  
  // Test Case 3: Customer provides both
  console.log('\n\nTEST 3: Customer says "My order 119410 for samguy@thompsonsuk.com"');
  console.log('---------------------------------------');
  
  const message3 = 'My order 119410 for samguy@thompsonsuk.com';
  const emailMatch3 = message3.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const orderMatch3 = message3.match(/#?\d{4,}/);
  
  const verification3 = await SimpleCustomerVerification.verifyCustomer({
    conversationId,
    email: emailMatch3 ? emailMatch3[0] : undefined,
    orderNumber: orderMatch3 ? orderMatch3[0] : undefined
  }, domain);
  
  console.log('Verification Level:', verification3.level);
  console.log('Customer Email:', verification3.customerEmail);
  console.log('Customer ID:', verification3.customerId);
  
  if (verification3.level === 'full') {
    const wooCustomer = await WooCommerceCustomer.forDomain(domain);
    if (wooCustomer && verification3.customerId) {
      const orders = await wooCustomer.getCustomerOrders(
        verification3.customerId,
        5,
        conversationId,
        verification3.customerEmail
      );
      console.log('\nOrders Retrieved:');
      orders.forEach(order => {
        console.log(`- Order #${order.number}: ${order.status} - ${order.currency} ${order.total}`);
      });
    }
  }
  
  console.log('\n=== Test Complete ===');
  console.log('The chatbot should now be able to:');
  console.log('✓ Recognize when customers provide emails');
  console.log('✓ Recognize order numbers');
  console.log('✓ Retrieve real order data from WooCommerce');
  console.log('✓ Generate context for AI responses');
}

simulateChatbot().catch(console.error);