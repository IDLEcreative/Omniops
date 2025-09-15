// Test the embed widget API behavior
import fetch from 'node-fetch';

async function testEmbedWidget() {
  console.log('Testing embed widget responses...\n');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`=== Test ${i}: Embed widget simulation ===`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Need a pump for my Cifa mixer',
          domain: 'thompsonseparts.co.uk', // Using actual domain like embed widget does
          conversationId: `embed-test-${i}`,
          session_id: `embed-session-${i}`,
        }),
      });

      const data = await response.json();
      
      if (data.message) {
        // Check first 200 chars of response
        console.log('Response:', data.message.substring(0, 200));
        
        // Check if it asks questions or shows products
        if (data.message.includes('model') || data.message.includes('Which')) {
          console.log('❓ Asks for clarification');
        } else if (data.message.includes('Here are') || data.message.includes('pump')) {
          console.log('✅ Shows products directly');
        }
      } else {
        console.log('Error:', data.error || 'No message in response');
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    console.log('');
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testEmbedWidget().catch(console.error);