/**
 * Test the complete chat flow for agricultural tipper search
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testChatFlow() {
  console.log('=== Testing Chat API for Agricultural Tipper ===\n');
  
  const chatEndpoint = 'http://localhost:3000/api/chat';
  
  const testQueries = [
    'agricultural tipper',
    'agri flip product',
    'sheeting system for agricultural dumper'
  ];
  
  for (const query of testQueries) {
    console.log(`\nTesting: "${query}"`);
    console.log('=' .repeat(60));
    
    try {
      const response = await fetch(chatEndpoint, {
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
              websiteScraping: { enabled: true },
              woocommerce: { enabled: false }
            }
          }
        })
      });
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        continue;
      }
      
      const result = await response.json();
      
      console.log('\nAI Response:');
      console.log(result.message.substring(0, 500) + '...');
      
      // Check if Agri Flip is mentioned
      if (result.message.toLowerCase().includes('agri flip') || 
          result.message.includes('agri-flip')) {
        console.log('\n✓ SUCCESS: Agri Flip product mentioned in response!');
      } else {
        console.log('\n❌ FAIL: Agri Flip NOT mentioned in response');
      }
      
      // Check sources
      if (result.sources && result.sources.length > 0) {
        console.log('\nSources returned:');
        result.sources.forEach((source: any, i: number) => {
          console.log(`${i + 1}. ${source.title || 'Untitled'}`);
          console.log(`   URL: ${source.url}`);
          console.log(`   Relevance: ${(source.relevance * 100).toFixed(1)}%`);
          if (source.url?.includes('agri-flip')) {
            console.log('   ✓ This is the Agri Flip product!');
          }
        });
      }
      
    } catch (error) {
      console.error('Request failed:', error);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testChatFlow().catch(console.error);