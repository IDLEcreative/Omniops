import fetch from 'node-fetch';

async function testRAG() {
  const queries = [
    "What tipper sheet systems do you offer?",
    "Tell me about your hydraulic equipment",
    "Do you sell crane parts?",
    "What products do you have for tippers?"
  ];
  
  console.log('🧪 TESTING RAG IMPLEMENTATION WITH TRAINING DATA\n');
  console.log('================================================\n');
  
  for (const query of queries) {
    console.log(`📝 QUERY: "${query}"`);
    console.log('---');
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          session_id: 'rag-test-' + Date.now(),
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
        console.log('❌ ERROR:', data.error);
      } else {
        // Check if response is generic or specific
        const isGeneric = data.message.includes("I don't have specific") || 
                         data.message.includes("I'm sorry") ||
                         data.message.includes("recommend checking");
        
        if (isGeneric) {
          console.log('⚠️  GENERIC RESPONSE (RAG not working):');
          console.log(data.message.substring(0, 150) + '...\n');
        } else {
          console.log('✅ CONTEXT-AWARE RESPONSE (RAG working!):');
          console.log(data.message.substring(0, 300) + '...\n');
        }
        
        if (data.sources && data.sources.length > 0) {
          console.log('📚 SOURCES USED:', data.sources.length);
          data.sources.forEach((source, i) => {
            console.log(`   ${i + 1}. ${source.title} (similarity: ${source.relevance?.toFixed(2)})`);
          });
        } else {
          console.log('⚠️  NO SOURCES FOUND');
        }
      }
    } catch (error) {
      console.log('❌ FETCH ERROR:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('🎯 SUMMARY:');
  console.log('If you see context-aware responses above, RAG is working!');
  console.log('If responses are generic, the search_embeddings function may need debugging.');
}

testRAG();