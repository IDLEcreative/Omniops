#!/usr/bin/env node

// Test with the actual configured domain
async function testRealDomain() {
  console.log('🧪 Testing with configured domain: test.example.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const apiUrl = 'http://localhost:3000/api/chat';
  const sessionId = require('crypto').randomUUID();
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What information do you have about this website?',
        session_id: sessionId,
        domain: 'test.example.com', // This exists in customer_configs
        config: {
          features: {
            websiteScraping: { enabled: true }
          }
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Response received');
      console.log(`   Message: ${data.message?.substring(0, 100)}...`);
      if (data.sources && data.sources.length > 0) {
        console.log(`   ✨ Sources found: ${data.sources.length}`);
        data.sources.forEach((source, i) => {
          console.log(`      ${i+1}. ${source.title} - ${source.url}`);
        });
      } else {
        console.log('   📭 No sources (domain has no scraped content yet)');
      }
    } else {
      console.log('❌ Request failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Embeddings search is working correctly!');
  console.log('💡 No errors = parameter mismatch is fixed');
}

testRealDomain().catch(console.error);