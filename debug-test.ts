#!/usr/bin/env tsx
/**
 * Debug test to check what's going wrong with the edge case tests
 */

async function debugTest() {
  const testMessage = ' '; // Empty message test
  
  try {
    console.log('Testing message:', JSON.stringify(testMessage));
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        conversation_id: `test-debug-${Date.now()}`,
        session_id: `session-debug-${Date.now()}`,
        domain: 'test-domain.com'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.status === 400) {
      console.log('This is a validation error. Checking response body...');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

debugTest();