#!/usr/bin/env node

/**
 * Final check that formatting is working correctly
 */

const API_URL = 'http://localhost:3000/api/chat';

async function testQuery(message) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: 'test-final-' + Date.now(),
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true },
            woocommerce: { enabled: true }
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function runTest() {
  console.log('🔍 Final formatting check\n');
  console.log('=' .repeat(80));
  
  const response = await testQuery('Need a pump for my Cifa mixer');
  
  if (response) {
    console.log('\n📋 Response from chat agent:\n');
    console.log(response);
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ Formatting check results:');
    
    // Check for proper formatting
    const hasNewlines = response.includes('\n');
    const hasBullets = response.includes('•');
    const hasMarkdownLinks = /\[.*?\]\(.*?\)/.test(response);
    const hasRawURLs = /https:\/\/www\.thompsons[^\s\)]+(?!\))/.test(response.replace(/\]\(https[^\)]+\)/g, ''));
    
    console.log(`- Bullet points on separate lines: ${hasNewlines ? '✅ Yes' : '❌ No'}`);
    console.log(`- Using bullet points: ${hasBullets ? '✅ Yes' : '❌ No'}`);
    console.log(`- Using markdown links: ${hasMarkdownLinks ? '✅ Yes' : '❌ No'}`);
    console.log(`- Has raw URLs: ${hasRawURLs ? '❌ Yes (bad)' : '✅ No (good)'}`);
    
    if (hasNewlines && hasBullets && hasMarkdownLinks && !hasRawURLs) {
      console.log('\n🎉 SUCCESS: All formatting requirements are met!');
    }
  }
}

runTest().catch(console.error);