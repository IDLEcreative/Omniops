#!/usr/bin/env node

// Test script for chat integration with Supabase
// This tests the complete flow with proper UUID session IDs

const crypto = require('crypto');

// Generate a proper UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

async function testChatAPI() {
  const sessionId = generateUUID();
  const apiUrl = 'http://localhost:3000/api/chat';
  
  console.log('🧪 Testing Chat Integration with Supabase');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📝 Session ID (UUID): ${sessionId}`);
  console.log();

  // Test 1: Create new conversation
  console.log('Test 1: Creating new conversation...');
  try {
    const response1 = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, I need help with my order',
        session_id: sessionId,
        domain: 'test.example.com'
      })
    });

    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ Response received:', data1.message?.substring(0, 100) + '...');
      console.log(`📊 Conversation ID: ${data1.conversation_id}`);
      
      // Test 2: Continue conversation
      console.log('\nTest 2: Continuing conversation...');
      const response2 = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'My order number is #12345',
          session_id: sessionId,
          conversation_id: data1.conversation_id,
          domain: 'test.example.com'
        })
      });

      const data2 = await response2.json();
      
      if (response2.ok) {
        console.log('✅ Follow-up response received:', data2.message?.substring(0, 100) + '...');
        console.log(`📊 Same conversation: ${data2.conversation_id === data1.conversation_id}`);
        
        // Test 3: Test with WooCommerce context
        console.log('\nTest 3: Testing with product query...');
        const response3 = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'What products do you have available?',
            session_id: sessionId,
            conversation_id: data1.conversation_id,
            domain: 'test.example.com',
            config: {
              features: {
                woocommerce: { enabled: true }
              }
            }
          })
        });

        const data3 = await response3.json();
        
        if (response3.ok) {
          console.log('✅ Product query response received');
          if (data3.sources) {
            console.log(`📚 Sources provided: ${data3.sources.length}`);
          }
        } else {
          console.log('❌ Product query failed:', data3.error);
        }
        
      } else {
        console.log('❌ Follow-up failed:', data2.error);
      }
      
    } else {
      console.log('❌ Initial request failed:', data1.error);
      if (data1.details) {
        console.log('Details:', JSON.stringify(data1.details, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  // Test 4: Verify database persistence
  console.log('\nTest 4: Verifying database persistence...');
  console.log('Checking if conversations and messages were saved to Supabase...');
  
  // Create a new session to test if we can retrieve history
  const newSessionId = generateUUID();
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Testing database persistence',
        session_id: newSessionId,
        domain: 'test.example.com'
      })
    });

    const data = await response.json();
    if (response.ok && data.conversation_id) {
      console.log('✅ Database connection working - conversation created');
      console.log(`📊 New conversation ID: ${data.conversation_id}`);
    } else {
      console.log('⚠️  Possible database issue:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏁 Test completed');
  console.log('\n💡 Check the server logs for any database errors');
  console.log('💡 Check Supabase dashboard to verify data was saved');
}

// Run the test
testChatAPI().catch(console.error);