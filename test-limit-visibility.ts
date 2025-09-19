#!/usr/bin/env npx tsx
import { config } from 'dotenv';
config();

// Test to see EXACTLY what the AI sees when there are many results

async function testWhatAISees() {
  console.log('🔍 Testing what AI sees with different result counts\n');

  // Test queries designed to get different amounts of results
  const testCases = [
    {
      query: "Show me all Cifa products",
      description: "Should find many Cifa products"
    },
    {
      query: "List all your pumps", 
      description: "Should find many pumps"
    },
    {
      query: "What safety equipment do you have?",
      description: "Should find safety products"
    }
  ];

  for (const test of testCases) {
    console.log('='*60);
    console.log(`Query: "${test.query}"`);
    console.log(`Purpose: ${test.description}`);
    console.log('-'*60);

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: test.query,
        session_id: `visibility-test-${Date.now()}`,
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
    
    // This is the KEY information we need
    console.log('\n📊 WHAT THE AI RECEIVES:');
    
    if (data.searchMetadata) {
      console.log('\nSearch Metadata:');
      console.log(`  Total iterations: ${data.searchMetadata.iterations || 0}`);
      console.log(`  Total searches performed: ${data.searchMetadata.totalSearches || 0}`);
      
      if (data.searchMetadata.searchLog) {
        console.log('\nSearch Log Details:');
        data.searchMetadata.searchLog.forEach((log: any, i: number) => {
          console.log(`  Search ${i+1}:`);
          console.log(`    Tool: ${log.tool}`);
          console.log(`    Query: ${log.query}`);
          console.log(`    Results returned: ${log.resultCount}`);
          console.log(`    Source: ${log.source}`);
        });
      }
    }

    if (data.sources) {
      console.log(`\n✅ Sources returned to user: ${data.sources.length}`);
    }

    // Check the response to see what the AI said
    console.log('\n🤖 AI Response Analysis:');
    const response_text = data.message || '';
    
    // Look for number mentions
    const numberPattern = /\b(\d+)\s*(products?|items?|results?|options?)\b/gi;
    const matches = response_text.match(numberPattern);
    if (matches) {
      console.log('  Numbers mentioned by AI:', matches.join(', '));
    }

    // Look for quantity descriptions
    const quantityPhrases = [
      /extensive\s+(range|selection|collection)/i,
      /wide\s+(range|selection|variety)/i,
      /many\s+(different|various)?/i,
      /numerous/i,
      /large\s+selection/i,
      /we\s+have\s+(\d+|several|many|numerous)/i
    ];

    const foundPhrases = quantityPhrases
      .filter(pattern => pattern.test(response_text))
      .map(pattern => response_text.match(pattern)?.[0]);
    
    if (foundPhrases.length > 0) {
      console.log('  Quantity descriptions used:', foundPhrases.join(', '));
    }

    // Extract first 200 chars of response
    console.log('\n  Response preview:', response_text.substring(0, 200) + '...');
    
    console.log('\n' + '='*60 + '\n');
    
    // Small delay
    await new Promise(r => setTimeout(r, 2000));
  }
}

testWhatAISees().catch(console.error);
