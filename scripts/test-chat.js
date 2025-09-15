import fetch from 'node-fetch';

async function testChat() {
  const queries = [
    "What products do you offer for tippers?",
    "Do you sell crane parts?",
    "What hydraulic equipment is available?",
    "Tell me about your delivery options"
  ];
  
  for (const query of queries) {
    console.log('\n====================================');
    console.log('QUERY:', query);
    console.log('====================================');
    
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
              websiteScraping: { enabled: true }
            }
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.log('ERROR:', data.error);
      } else {
        console.log('\nRESPONSE:', data.message);
        if (data.sources && data.sources.length > 0) {
          console.log('\nSOURCES USED:');
          data.sources.forEach(source => {
            console.log(`- ${source.title} (relevance: ${source.relevance})`);
            console.log(`  URL: ${source.url}`);
          });
        } else {
          console.log('\nNO SOURCES FOUND - Response may be generic');
        }
      }
    } catch (error) {
      console.log('FETCH ERROR:', error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testChat();