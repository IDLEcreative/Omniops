#!/usr/bin/env npx tsx
/**
 * Get the raw response to see exactly what the AI is returning
 */

import 'dotenv/config';

const DOMAIN = "thompsonseparts.co.uk";

async function getRawResponse() {
  console.log('🔍 GETTING RAW AI RESPONSE');
  console.log('=' .repeat(60));
  
  const query = "Show me all Cifa mixer pumps and products you have";
  console.log(`Query: "${query}"\n`);
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: `raw-test-${Date.now()}`,
        domain: DOMAIN,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    // Show search metadata
    if (data.searchMetadata?.searchLog) {
      console.log('📊 SEARCHES PERFORMED:');
      data.searchMetadata.searchLog.forEach((log: any, index: number) => {
        console.log(`${index + 1}. ${log.tool}: "${log.query}" → ${log.resultCount} results`);
      });
      console.log();
    }
    
    // Show full response
    console.log('📝 FULL AI RESPONSE:');
    console.log('-'.repeat(60));
    console.log(data.message);
    console.log('-'.repeat(60));
    
    // Count products in response
    const lines = data.message.split('\n');
    let productCount = 0;
    
    console.log('\n📦 PRODUCT ANALYSIS:');
    lines.forEach(line => {
      if (line.includes('http') || 
          (line.includes('•') && line.toLowerCase().includes('cifa')) ||
          (line.match(/^\d+\./) && line.toLowerCase().includes('cifa'))) {
        productCount++;
        console.log(`Product ${productCount}: ${line.substring(0, 80)}...`);
      }
    });
    
    console.log(`\nTotal products shown: ${productCount}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

getRawResponse().catch(console.error);