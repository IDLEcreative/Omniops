// Debug what the chat route is doing
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugChatRoute() {
  import { SimpleCustomerVerification  } from './lib/customer-verification-simple';
  
  const conversationId = 'debug-' + Date.now();
  const domain = 'thompsonseparts.co.uk';
  
  // Test with email
  const email = 'samguy@thompsonsuk.com';
  console.log('=== Testing Customer Verification ===');
  console.log('Email:', email);
  console.log('Domain:', domain);
  console.log('');
  
  // This is what the chat route does
  const emailMatch = email.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const orderMatch = null;
  const nameMatch = null;
  
  console.log('Extracted:');
  console.log('- Email:', emailMatch ? emailMatch[0] : 'none');
  console.log('- Order:', orderMatch ? orderMatch[0] : 'none');
  console.log('- Name:', nameMatch ? nameMatch[1] : 'none');
  console.log('');
  
  const verificationLevel = await SimpleCustomerVerification.verifyCustomer({
    conversationId,
    email: emailMatch ? emailMatch[0] : undefined,
    orderNumber: orderMatch ? orderMatch[0] : undefined,
    name: nameMatch ? nameMatch[1] : undefined
  }, domain);
  
  console.log('Verification Result:');
  console.log('- Level:', verificationLevel.level);
  console.log('- Customer Email:', verificationLevel.customerEmail);
  console.log('- Customer ID:', verificationLevel.customerId);
  console.log('- Allowed Data:', verificationLevel.allowedData);
  console.log('');
  
  const context = await SimpleCustomerVerification.getCustomerContext(
    verificationLevel,
    conversationId,
    domain
  );
  
  const prompt = SimpleCustomerVerification.getVerificationPrompt(verificationLevel);
  
  console.log('Customer Context:');
  console.log(context);
  console.log('');
  
  console.log('Verification Prompt:');
  console.log(prompt || 'No prompt');
  
  // Now test what AI instructions would be added
  import { WooCommerceAIInstructions  } from './lib/woocommerce-ai-instructions';
  
  const systemPrompt = WooCommerceAIInstructions.getEnhancedSystemPrompt(
    verificationLevel.level,
    context.includes('Recent Orders:')
  );
  
  console.log('\n=== AI System Prompt ===');
  console.log(systemPrompt.substring(0, 500) + '...');
  
  const actionPrompt = WooCommerceAIInstructions.getActionPrompt(
    'Please show me my orders for samguy@thompsonsuk.com',
    verificationLevel.level
  );
  
  console.log('\n=== Action Prompt ===');
  console.log(actionPrompt || 'No action prompt');
}

debugChatRoute().catch(console.error);