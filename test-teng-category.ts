#!/usr/bin/env npx tsx

import fetch from 'node-fetch';

async function testTengQuery() {
  const API_URL = 'http://localhost:3000/api/chat-intelligent';
  
  console.log('🧪 Testing Teng Products Query with Correct Category');
  console.log('='*60);
  
  const query = "Show me Teng products";
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: `test-${Date.now()}`,
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true }
          },
          ai: {
            maxSearchIterations: 2,
            searchTimeout: 10000
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('\n📝 Query:', query);
    console.log('\n💬 AI Response:');
    console.log('-'.repeat(60));
    console.log(data.message);
    console.log('-'.repeat(60));
    
    // Check what category was suggested
    const responseText = data.message;
    
    console.log('\n✅ Analysis:');
    
    // Look for category URLs
    const categoryMatches = responseText.match(/\/product-category\/[^\s\)]+/g);
    if (categoryMatches) {
      console.log('Found category URLs:');
      categoryMatches.forEach(url => {
        console.log(`  • ${url}`);
        if (url.includes('teng-tools')) {
          console.log('    ✓ Correct Teng tools category!');
        } else if (url.includes('/tools/')) {
          console.log('    ⚠️ Generic tools category (should be more specific)');
        }
      });
    } else {
      console.log('❌ No category URLs found in response');
    }
    
    // Check for external sites
    const hasExternalSites = responseText.toLowerCase().includes('external') ||
                            responseText.toLowerCase().includes('elsewhere') ||
                            responseText.toLowerCase().includes('google') ||
                            responseText.toLowerCase().includes('amazon');
    
    if (hasExternalSites) {
      console.log('❌ External sites mentioned (this should not happen)');
    } else {
      console.log('✓ No external sites mentioned');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTengQuery().catch(console.error);