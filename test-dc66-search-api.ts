#!/usr/bin/env tsx
/**
 * Test DC66-10P Search via API
 * Tests the actual search endpoint to verify it's working correctly
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat';

async function testSearch() {
  console.log('🔍 Testing DC66-10P Search via Chat API');
  console.log('=====================================\n');

  const searchQuery = {
    message: "Tell me about the DC66-10P hydraulic ram cylinder",
    domainId: "8dccd788-1ec1-43c2-af56-78aa3366bad3", // Correct Thompson's domain ID
    conversationId: "test-" + Date.now()
  };

  try {
    console.log('📤 Sending query:', searchQuery.message);
    console.log('🏢 Domain ID:', searchQuery.domainId);
    console.log('');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchQuery)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📥 Response received:');
    console.log('-------------------');
    console.log(data.response);
    console.log('');

    // Check if DC66-10P was found
    if (data.response.includes('DC66-10P')) {
      console.log('✅ SUCCESS: DC66-10P content was found and returned!');
    } else if (data.response.toLowerCase().includes("don't have") || 
               data.response.toLowerCase().includes("no information") ||
               data.response.toLowerCase().includes("not found")) {
      console.log('❌ FAILURE: DC66-10P was not found in search results');
      console.log('   This indicates the search/embedding system is not working properly');
    } else {
      console.log('⚠️  WARNING: Response received but DC66-10P not explicitly mentioned');
    }

    // Show sources if available
    if (data.sources && data.sources.length > 0) {
      console.log('\n📚 Sources used:');
      data.sources.forEach((source: any, i: number) => {
        console.log(`   ${i + 1}. ${source.title || source.url}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing search:', error);
    console.log('\n💡 Make sure the development server is running on port 3000:');
    console.log('   npm run dev');
  }
}

// Run the test
testSearch();