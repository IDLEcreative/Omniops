#!/usr/bin/env node

/**
 * Test script to verify the chat API handles vague product queries better
 * This tests whether the system shows available options instead of asking excessive questions
 */

const API_URL = 'http://localhost:3000/api/chat';

// Test messages that should trigger showing available options
const testMessages = [
  'Need a pump for my Cifa mixer',
  'any pump',
  'looking for pumps',
  'I need parts'
];

async function testQuery(message, conversationId = null) {
  try {
    const payload = {
      message,
      session_id: 'test-session-' + Date.now(),
      domain: 'thompsonseparts.co.uk',
      config: {
        features: {
          websiteScraping: { enabled: true },
          woocommerce: { enabled: true }
        }
      }
    };
    
    // Only add conversation_id if it's not null
    if (conversationId) {
      payload.conversation_id = conversationId;
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error testing query:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('Testing vague product query handling...\n');
  console.log('=' .repeat(80));

  // Test 1: Initial vague query
  console.log('\n📝 TEST 1: "Need a pump for my Cifa mixer"');
  console.log('-'.repeat(40));
  const response1 = await testQuery('Need a pump for my Cifa mixer');
  if (response1) {
    console.log('Response:', response1.message);
    console.log('\nAnalysis:');
    
    // Check if response shows products or asks questions
    const hasProducts = response1.message.includes('available') || 
                       response1.message.includes('options') ||
                       response1.message.includes('Here are') ||
                       response1.message.includes('We have');
    
    const asksWhichType = response1.message.includes('Which pump') || 
                         response1.message.includes('Which type') ||
                         response1.message.includes('what type') ||
                         response1.message.includes('what kind');
    
    // Check for compact markdown links vs raw URLs
    const hasMarkdownLinks = /\[.*?\]\(https?:\/\/.*?\)/.test(response1.message);
    // Check for raw URLs that are NOT inside markdown parentheses
    const hasRawURLs = /https:\/\/www\.thompsons[^\s\)]+(?!\))/.test(response1.message.replace(/\]\(https[^\)]+\)/g, ''));
    const hasBulletPoints = response1.message.includes('•');
    
    if (hasProducts) {
      console.log('✅ GOOD: Response shows available products');
    } else if (asksWhichType) {
      console.log('⚠️  ISSUE: Response asks for clarification without showing options');
    }
    
    if (hasMarkdownLinks && !hasRawURLs) {
      console.log('✅ GOOD: Using compact markdown links');
    } else if (hasRawURLs) {
      console.log('⚠️  ISSUE: Showing raw URLs instead of compact links');
    }
    
    if (hasBulletPoints) {
      console.log('✅ GOOD: Using bullet points for better formatting');
    }
    
    // Test 2: Follow-up with "any"
    console.log('\n📝 TEST 2: Following up with "any"');
    console.log('-'.repeat(40));
    const response2 = await testQuery('any', response1.conversation_id);
    if (response2) {
      console.log('Response:', response2.message);
      console.log('\nAnalysis:');
      
      const showsOptions = response2.message.includes('available') || 
                          response2.message.includes('options') ||
                          response2.message.includes('Here are') ||
                          response2.message.includes('We have');
      
      const stillAsking = response2.message.includes('Can you tell me') ||
                         response2.message.includes('model') ||
                         response2.message.includes('part number');
      
      if (showsOptions) {
        console.log('✅ GOOD: Response shows available options when customer says "any"');
      } else if (stillAsking) {
        console.log('⚠️  ISSUE: Still asking for clarification instead of showing options');
      }
    }
  }

  // Test 3: Direct product query
  console.log('\n📝 TEST 3: "looking for pumps"');
  console.log('-'.repeat(40));
  const response3 = await testQuery('looking for pumps');
  if (response3) {
    console.log('Response:', response3.message.substring(0, 300) + '...');
    console.log('\nAnalysis:');
    
    const showsProducts = response3.message.includes('pump') && 
                         (response3.message.includes('http') || 
                          response3.message.includes('available'));
    
    if (showsProducts) {
      console.log('✅ GOOD: Response shows pump products');
    } else {
      console.log('⚠️  ISSUE: Response doesn\'t show products');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Test complete!\n');
  console.log('Summary:');
  console.log('- The system should now show available products first');
  console.log('- It should avoid asking "which type" before showing options');
  console.log('- When customers say "any", it should display all relevant options');
}

// Run tests
runTests().catch(console.error);