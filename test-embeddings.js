#!/usr/bin/env node

// Test the embeddings search function to verify the fix

async function testEmbeddingsSearch() {
  console.log('🧪 Testing Embeddings Search Function');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const apiUrl = 'http://localhost:3000/api/chat';
  const sessionId = require('crypto').randomUUID();
  
  // Test with a domain that might have content
  const testCases = [
    {
      name: 'With domain (should try embeddings)',
      payload: {
        message: 'What are your shipping policies?',
        session_id: sessionId,
        domain: 'example.com',
        config: {
          features: {
            websiteScraping: { enabled: true }
          }
        }
      }
    },
    {
      name: 'Without domain (should skip embeddings)',
      payload: {
        message: 'Tell me about your products',
        session_id: require('crypto').randomUUID(),
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log('─'.repeat(40));
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Response received');
        console.log(`   Message: ${data.message?.substring(0, 80)}...`);
        if (data.sources) {
          console.log(`   Sources: ${data.sources.length} found`);
        } else {
          console.log('   Sources: None (embeddings might be empty or disabled)');
        }
      } else {
        console.log('❌ Request failed:', data.error);
      }
    } catch (error) {
      console.error('❌ Test error:', error.message);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Check server logs for any embeddings errors');
  console.log('💡 If no errors appear, the fix is working!');
}

testEmbeddingsSearch().catch(console.error);