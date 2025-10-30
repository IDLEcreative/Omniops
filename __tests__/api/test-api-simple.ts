/**
 * Simple API Test to diagnose 500 error
 */

async function testAPI() {
  console.log('Testing chat API...\n');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Do you have 10mtr cables?',
        domain: 'thompsonseparts.co.uk'
      })
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('\nResponse body:');
    console.log(text);

    if (!response.ok) {
      console.log('\n❌ API returned error');
    } else {
      console.log('\n✅ API call successful');
      const data = JSON.parse(text);
      console.log('\nParsed response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testAPI();
