import fetch from 'node-fetch';

async function testRAGWidget() {
  console.log('Testing RAG capabilities in chat widget...\n');
  
  const testCases = [
    {
      message: "What products do you sell?",
      description: "Testing product search with RAG"
    },
    {
      message: "Tell me about your tipper safety equipment",
      description: "Testing specific product category"
    },
    {
      message: "Do you have crane parts?",
      description: "Testing product existence query"
    },
    {
      message: "What are your delivery options?",
      description: "Testing service information"
    }
  ];
  
  for (const test of testCases) {
    console.log('====================================');
    console.log(`TEST: ${test.description}`);
    console.log(`QUERY: ${test.message}`);
    console.log('====================================');
    
    try {
      // Test with the widget configuration (websiteScraping enabled by default now)
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          session_id: 'test-widget-' + Date.now(),
          domain: 'thompsonseparts.co.uk',
          // The widget now sends this config by default
          config: {
            features: {
              websiteScraping: { enabled: true },
              woocommerce: { enabled: false }
            }
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.log('ERROR:', data.error);
      } else {
        console.log('\nRESPONSE:', data.message.substring(0, 200) + '...');
        
        if (data.sources && data.sources.length > 0) {
          console.log('\n✅ RAG WORKING - Sources found:', data.sources.length);
          data.sources.forEach(source => {
            console.log(`   - ${source.title} (relevance: ${source.relevance?.toFixed(2)})`);
          });
        } else {
          console.log('\n❌ RAG NOT WORKING - No sources found');
        }
      }
    } catch (error) {
      console.log('FETCH ERROR:', error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n====================================');
  console.log('RAG Testing Complete!');
  console.log('The chat widget should now have access to RAG capabilities.');
  console.log('====================================');
}

testRAGWidget().catch(console.error);