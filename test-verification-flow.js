#!/usr/bin/env node

/**
 * Manual test script for customer verification flow
 * Tests the verification requirements before showing order data
 */

const baseUrl = 'http://localhost:3000';

// Test conversation ID (you'll need a real one from your database)
const testConversationId = '550e8400-e29b-41d4-a716-446655440000'; // Replace with actual UUID
const testDomain = 'example.com';
const testSessionId = 'test-session-123';

async function testChatWithOrderQuery(message, conversationId = null) {
  console.log(`\n📝 Testing: "${message}"`);
  
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId || testConversationId,
      session_id: testSessionId,
      domain: testDomain,
      config: {
        features: {
          woocommerce: { enabled: true }
        }
      }
    })
  });

  const data = await response.json();
  console.log('Response status:', response.status);
  
  if (data.response) {
    console.log('AI Response:', data.response.substring(0, 200) + '...');
  }
  
  if (data.context) {
    // Check if verification was required
    if (data.context.includes('CUSTOMER VERIFICATION REQUIRED')) {
      console.log('✅ Verification required as expected');
    } else if (data.context.includes('Order Information (Verified Customer)')) {
      console.log('✅ Showing verified customer data');
    } else if (data.context.includes('LIMITED ORDER INFORMATION')) {
      console.log('⚠️ Showing limited information only');
    }
  }
  
  return data;
}

async function testVerificationEndpoint(action, params) {
  console.log(`\n🔐 Testing verification: ${action}`);
  
  const response = await fetch(`${baseUrl}/api/verify-customer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...params
    })
  });

  const data = await response.json();
  console.log('Verification response:', data);
  return data;
}

async function runTests() {
  console.log('🧪 Customer Verification Flow Tests');
  console.log('====================================\n');
  
  try {
    // Test 1: Unverified customer asks about specific order
    console.log('Test 1: Unverified customer with order number');
    console.log('----------------------------------------------');
    await testChatWithOrderQuery('What is the status of order #12345?');
    
    // Test 2: Unverified customer asks about "my orders"
    console.log('\nTest 2: Unverified customer asking about "my orders"');
    console.log('----------------------------------------------------');
    await testChatWithOrderQuery('Where are my orders?');
    
    // Test 3: General query (no verification needed)
    console.log('\nTest 3: General query (should not require verification)');
    console.log('-------------------------------------------------------');
    await testChatWithOrderQuery('What is your return policy?');
    
    // Test 4: Customer provides email with order query
    console.log('\nTest 4: Customer provides email with order number');
    console.log('-------------------------------------------------');
    await testChatWithOrderQuery('Check order #12345, my email is customer@example.com');
    
    // Test 5: Send verification code
    console.log('\nTest 5: Send verification code');
    console.log('------------------------------');
    const verifyResult = await testVerificationEndpoint('send_code', {
      conversationId: testConversationId,
      email: 'customer@example.com',
      method: 'email'
    });
    
    if (verifyResult.code) {
      // Test 6: Verify the code
      console.log('\nTest 6: Verify code');
      console.log('-------------------');
      await testVerificationEndpoint('verify_code', {
        conversationId: testConversationId,
        email: 'customer@example.com',
        code: verifyResult.code
      });
      
      // Test 7: Check verification status
      console.log('\nTest 7: Check verification status');
      console.log('---------------------------------');
      await testVerificationEndpoint('check_status', {
        conversationId: testConversationId
      });
      
      // Test 8: Verified customer asks about orders
      console.log('\nTest 8: Verified customer asks about orders');
      console.log('-------------------------------------------');
      await testChatWithOrderQuery('Show me my recent orders', testConversationId);
    }
    
    // Test 9: Simple verification with order + email
    console.log('\nTest 9: Simple verification (order + email)');
    console.log('-------------------------------------------');
    await testVerificationEndpoint('simple_verify', {
      conversationId: testConversationId,
      email: 'customer@example.com',
      orderNumber: '12345',
      domain: testDomain
    });
    
    console.log('\n✅ All tests completed!');
    console.log('\n📊 Summary:');
    console.log('- Unverified users should see verification prompts');
    console.log('- General queries should work without verification');
    console.log('- Verified users should see full order details');
    console.log('- All access should be logged for audit');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests
runTests().catch(console.error);