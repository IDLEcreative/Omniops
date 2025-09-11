// Test the chat API directly
const fetch = require('node-fetch');

async function testChatAPI() {
  console.log('\n🚀 Testing Chat API with GPT-5-mini model...\n');
  const queries = [
    "What are your business hours?",
    "Tell me about your return policy",
    "Is 2EVRA48 in stock?"
  ];
  
  for (const query of queries) {
    console.log(`\nTesting query: "${query}"`);
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          session_id: 'test-session-' + Date.now(),
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: true }
            }
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.log('Error:', data.error);
      } else {
        console.log('Response:', data.message);
        if (data.sources) {
          console.log('Sources:', data.sources.map(s => s.url));
        }
      }
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  }
}

testChatAPI();