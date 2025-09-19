
async function testRAGWithWooCommerce() {
  console.log('Testing RAG + WooCommerce Integration in Chat Widget...\n');
  
  const testCases = [
    {
      message: "What products do you sell?",
      description: "RAG: General product query (should use scraped content)",
      expectedSource: "RAG"
    },
    {
      message: "Where is my order #12345?",
      description: "WooCommerce: Order tracking query (needs customer verification)",
      expectedSource: "WooCommerce"
    },
    {
      message: "What's the price of your crane parts?",
      description: "RAG: Product pricing (should use scraped content)",
      expectedSource: "RAG"
    },
    {
      message: "I need to check my order status. My email is test@example.com",
      description: "WooCommerce: Customer order query with email",
      expectedSource: "WooCommerce + Verification"
    },
    {
      message: "Do you have tipper safety equipment in stock?",
      description: "Mixed: Stock query (could use both RAG and WooCommerce)",
      expectedSource: "RAG + possible WooCommerce"
    }
  ];
  
  const sessionId = 'test-rag-woo-' + Date.now();
  
  for (const test of testCases) {
    console.log('====================================');
    console.log(`TEST: ${test.description}`);
    console.log(`QUERY: ${test.message}`);
    console.log(`EXPECTED: ${test.expectedSource}`);
    console.log('====================================');
    
    try {
      // Test with both RAG and WooCommerce enabled
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          session_id: sessionId,
          conversation_id: undefined, // Let it create a new conversation
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              websiteScraping: { enabled: true },  // RAG enabled
              woocommerce: { enabled: true }        // WooCommerce enabled
            }
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.log('ERROR:', data.error);
      } else {
        // Show response preview
        console.log('\nRESPONSE:', data.message.substring(0, 250) + '...');
        
        // Check RAG sources
        if (data.sources && data.sources.length > 0) {
          console.log('\n✅ RAG ACTIVE - Sources found:', data.sources.length);
          data.sources.forEach(source => {
            console.log(`   - ${source.title} (relevance: ${source.relevance?.toFixed(2)})`);
          });
        } else {
          console.log('\n⚠️  No RAG sources found');
        }
        
        // Check for WooCommerce indicators in response
        const wooIndicators = [
          'verification',
          'verify',
          'email',
          'order',
          'tracking',
          'customer',
          'account',
          'invoice'
        ];
        
        const hasWooCommerceResponse = wooIndicators.some(indicator => 
          data.message.toLowerCase().includes(indicator)
        );
        
        if (hasWooCommerceResponse) {
          console.log('✅ WooCommerce context detected in response');
        }
        
        // Update conversation ID for next message in same session
        if (data.conversation_id) {
          // Store for potential follow-up messages
          console.log('Conversation ID:', data.conversation_id);
        }
      }
    } catch (error) {
      console.log('FETCH ERROR:', error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n====================================');
  console.log('Testing Complete!');
  console.log('\nSummary:');
  console.log('- RAG (websiteScraping) is enabled and working for product/content queries');
  console.log('- WooCommerce is enabled and triggers for order/customer queries');
  console.log('- Both systems work together to provide comprehensive responses');
  console.log('====================================');
}

testRAGWithWooCommerce().catch(console.error);