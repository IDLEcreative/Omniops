#!/usr/bin/env npx tsx

/**
 * Test the new deployment URL directly
 */

async function testNewDeployment() {
  console.log('🧪 Testing new deployment directly...\n');

  const deploymentUrl = 'https://omniops-qjjwsc9gn-idlecreatives-projects.vercel.app';
  const testUrl = `${deploymentUrl}/api/chat`;

  console.log(`📡 Testing: ${testUrl}\n`);

  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://epartstaging.wpengine.com'
      },
      body: JSON.stringify({
        message: 'Do you have any pumps?',
        session_id: `test-${Date.now()}`,
        domain: 'epartstaging.wpengine.com'
      })
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! New deployment works!');
      console.log('\n🤖 Response:', data.message?.substring(0, 200) + '...');
    } else {
      console.log('❌ Still failing:', data.error);
    }
  } catch (error) {
    console.error('Failed:', error);
  }
}

testNewDeployment().catch(console.error);